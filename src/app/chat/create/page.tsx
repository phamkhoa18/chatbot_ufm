'use client';

import { useState, useEffect, useRef, useCallback, useMemo, KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Mic, MicOff, Plus, Bot, User, ArrowLeft,
  GraduationCap, BookOpen, HelpCircle, Calendar,
  Lightbulb, Monitor, Loader2, Copy, PowerSquare,
  Check, ThumbsUp, ThumbsDown,
  ChevronDown, ExternalLink, Mail, UserCircle2, Phone,
  Shield, FileSearch, Brain, Sparkles, Search, Database, Zap
} from 'lucide-react';
import { showToast } from '@/lib/toast';

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */
interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  isStreaming?: boolean;     // True while tokens are arriving (show raw text + cursor)
  pipelineSteps?: string[];  // Real-time pipeline steps
  source?: string;
  intent?: string;
}

/* ═══════════════════════════════════════
   Time-based greeting
   ═══════════════════════════════════════ */
function getGreeting(): { text: string; highlight: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Chào', highlight: 'buổi sáng', emoji: '☀️' };
  if (hour >= 12 && hour < 18) return { text: 'Chào', highlight: 'buổi chiều', emoji: '🌤️' };
  return { text: 'Chào', highlight: 'buổi tối', emoji: '🌙' };
}

/* ═══════════════════════════════════════
   Suggestion chips
   ═══════════════════════════════════════ */
const QUICK_SUGGESTIONS = [
  { icon: GraduationCap, text: 'Chương trình đào tạo thạc sĩ', color: '#0284c7', bg: '#f0f9ff' },
  { icon: BookOpen, text: 'Chương trình đào tạo tiến sĩ', color: '#7c3aed', bg: '#f5f3ff' },
  { icon: Lightbulb, text: 'Cơ hội việc làm sau khi học thạc sĩ', color: '#f59e0b', bg: '#fffbeb' },
  { icon: Calendar, text: 'Điều kiện và thời gian xét tuyển', color: '#ef4444', bg: '#fef2f2' },
];

/* Body text color from user spec */
const TEXT_COLOR = 'lab(6.02612% -1.05058 -4.10174)';

const FASTAPI_CHAT_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://chatbot-ufm-api.vincode.xyz';

console.log(FASTAPI_CHAT_URL);
/* ═══════════════════════════════════════
   Markdown component overrides (ChatGPT-style)
   ═══════════════════════════════════════ */
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-[17px] md:text-[18px] font-bold mt-5 mb-2 pb-2 border-b border-[#e5e7eb]" style={{ color: TEXT_COLOR }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[15px] md:text-[16px] font-bold mt-4 mb-1.5" style={{ color: TEXT_COLOR }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[14px] md:text-[15px] font-semibold mt-3 mb-1" style={{ color: TEXT_COLOR }}>{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-[13px] md:text-[14px] font-semibold mt-2 mb-1" style={{ color: TEXT_COLOR }}>{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-[1.85]" style={{ color: TEXT_COLOR }}>{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: TEXT_COLOR }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-[#475569]">{children}</em>
  ),
  a: ({ href, children }) => {
    const text = typeof children === 'string' ? children : '';
    const isEmail = href?.startsWith('mailto:') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    const isViewDocument = href?.startsWith('/view-document');
    
    let finalHref = href;
    if (isEmail && !href?.startsWith('mailto:')) {
      finalHref = `mailto:${text}`;
    } else if (isViewDocument) {
      finalHref = `${FASTAPI_CHAT_URL}${href}`;
    }

    if (isEmail) {
      return (
        <a href={finalHref} className="inline-flex items-center gap-1 font-semibold hover:opacity-80 transition-opacity break-words" style={{ color: '#3578E5', textDecoration: 'underline' }}>
          <Mail size={12} className="flex-shrink-0 opacity-70" />
          {children}
        </a>
      );
    }
    return (
      <a href={finalHref} target="_blank" rel="noopener noreferrer" className="font-semibold hover:opacity-80 transition-opacity break-words" style={{ color: '#3578E5', textDecoration: 'underline' }}>
        {children}
      </a>
    );
  },
  ul: ({ children }) => (
    <ul className="my-2 ml-1 space-y-1.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 ml-1 space-y-1.5 list-decimal list-inside marker:text-[#64748b] marker:font-semibold">{children}</ol>
  ),
  li: ({ children, ...props }) => {
    // Check if it's inside an ordered list by checking for 'ordered' property
    const isOrdered = (props as any).ordered;
    return (
      <li className={`leading-[1.8] ${!isOrdered ? 'flex items-start gap-2' : ''}`} style={{ color: TEXT_COLOR }}>
        {!isOrdered && (
          <span className="mt-[7px] w-[5px] h-[5px] rounded-full bg-[#0284c7] flex-shrink-0" />
        )}
        <span className="flex-1">{children}</span>
      </li>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="my-2.5 pl-3.5 border-l-[3px] border-[#0284c7]/40 text-[#475569] italic bg-[#f0f7ff]/50 py-2 pr-3 rounded-r-lg">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block my-2.5 p-3.5 bg-[#1e293b] text-[#e2e8f0] text-[12px] md:text-[13px] rounded-xl font-mono leading-[1.7] overflow-x-auto whitespace-pre-wrap break-words">
          {children}
        </code>
      );
    }
    return (
      <code className="px-1.5 py-0.5 bg-[#f1f5f9] text-[#e11d48] text-[12px] md:text-[13px] rounded-md font-mono border border-[#e2e8f0]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2.5 rounded-xl overflow-hidden">{children}</pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-[#e2e8f0]">
      <table className="w-full text-[12px] md:text-[13px] border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gradient-to-r from-[#f0f7ff] to-[#f8fafc]">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-[#005496] border-b-2 border-[#0284c7]/20 whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2.5 border-b border-[#e8edf2]" style={{ color: TEXT_COLOR }}>
      {children}
    </td>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-[#f8fafc] transition-colors">{children}</tr>
  ),
  hr: () => (
    <hr className="my-3 border-0 h-px bg-gradient-to-r from-transparent via-[#e2e8f0] to-transparent" />
  ),
};

/* ═══════════════════════════════════════
   Typing dots — synced with Chatbot widget
   ═══════════════════════════════════════ */
function TypingDots() {
  return (
    <div className="flex items-center gap-2.5 py-1 px-1">
      <div className="flex items-center gap-[5px]">
        <span className="w-[7px] h-[7px] rounded-full bg-[#3578E5]" style={{ animation: 'chatDotBounce 1.4s ease-in-out infinite', animationDelay: '0s' }} />
        <span className="w-[7px] h-[7px] rounded-full bg-[#5a9cf5]" style={{ animation: 'chatDotBounce 1.4s ease-in-out infinite', animationDelay: '0.2s' }} />
        <span className="w-[7px] h-[7px] rounded-full bg-[#7eb8ff]" style={{ animation: 'chatDotBounce 1.4s ease-in-out infinite', animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Content enhancer — post-process markdown text
   Detects [Nguồn: xxx] patterns and emails
   ═══════════════════════════════════════ */
function enhanceContent(raw: string): string {
  let text = raw;
  // Auto-detect bare emails and wrap in markdown link
  text = text.replace(
    /(?<![\[(<])\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b(?![\]>)])/g,
    '[$1](mailto:$1)'
  );
  return text;
}

/* ═══════════════════════════════════════
   Render bot message — single-pass approach
   Convert [Nguồn: xxx] → inline markdown link
   then render everything in ONE ReactMarkdown
   ═══════════════════════════════════════ */
function BotContent({ content }: { content: string }) {
  let text = enhanceContent(content);

  // Mảng chứa các nguồn tài liệu bóc từ markdown
  const documentSources: Array<{label: string, url: string}> = [];
  
  // Regex tìm dòng "Nguồn tài liệu: [Label](url)" hoặc "Nguồn tài liệu tham khảo: [Label](url)"
  const sourceRegex = /Nguồn tài liệu(?: tham khảo)?:\s*\[(.*?)\]\((.*?)\)/gi;
  
  text = text.replace(sourceRegex, (match, label, url) => {
    const finalUrl = url.trim().startsWith('/view-document') 
      ? `${FASTAPI_CHAT_URL}${url.trim()}` 
      : url.trim();
    documentSources.push({ label: label.trim(), url: finalUrl });
    return ''; // Xóa khỏi text chính
  });

  // Convert [Nguồn: xxx](url) → [Nguồn: xxx](url) (những nguồn inline)
  text = text.replace(
    /\[Nguồn(?:\s*\d*)?(?:\s*[—:–]\s*)?([^\]]+)\](?:\(([^)]+)\))?/g,
    (match, label: string, url?: string) => {
      if (url) {
        const finalUrl = url.trim().startsWith('/view-document') 
          ? `${FASTAPI_CHAT_URL}${url.trim()}` 
          : url.trim();
        return `[Nguồn: ${label.trim()}](${finalUrl})`;
      }
      return match;
    }
  );
  
  // 1. Remove Nguồn tài liệu block followed by raw .md/.txt files
  text = text.replace(/Nguồn tài liệu(?: tham khảo)?\s*:?[\s\n]*([\w_-]+\.(?:md|txt)[\s\n]*)+/gi, '');
  
  // 2. Remove any remaining raw internal file lines (e.g. thong_tin.md)
  text = text.replace(/^.*[\w_-]+\.(?:md|txt).*$/gm, '');

  // 3. Remove lingering "Nguồn tài liệu:" headers if they got orphaned
  text = text.replace(/Nguồn tài liệu(?: tham khảo)?\s*:?[\s\n]*$/gi, '');

  text = text.trim();

  // Custom components
  const components: Components = {
    ...markdownComponents,
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="chat-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {text}
        </ReactMarkdown>
      </div>
      
      {documentSources.length > 0 && (
        <div className="mt-1 pt-2 border-t border-[#3578E5]/10 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-[#005496] flex items-center gap-1">
            <Database size={11} />
            Nguồn tài liệu tham khảo:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {documentSources.map((src, i) => {
              const isExternal = src.url.startsWith('http');
              return (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f0f7ff] hover:bg-[#e0efff] text-[#005496] text-[11px] rounded-md transition-colors border border-[#005496]/20"
                >
                  <FileSearch size={11} className="flex-shrink-0" />
                  <span className="max-w-[250px] truncate">{src.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   Message Bubble
   ═══════════════════════════════════════ */
function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isBot = message.role === 'bot';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className={`flex flex-col max-w-[52rem] mx-auto w-full px-4 md:px-6 ${isBot ? 'items-start' : 'items-end'}`}
    >
      {/* Sender label — synced with Chatbot widget */}
      {isBot ? (
        <div className="flex items-center gap-1.5 mb-1 ml-1">
          <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
            <Image src="/images/ufm_chatbot_icon.png" alt="UFM" width={20} height={20} className="rounded-full object-cover" />
          </div>
          <span className="text-[12px] font-medium text-gray-500">UFM Tuyển sinh</span>
        </div>
      ) : (
        <span className="text-[11px] font-medium text-gray-400 mr-1 mb-1">Bạn</span>
      )}

      <div className={`flex flex-col gap-1.5 ${isBot ? 'max-w-[90%] md:max-w-[85%]' : 'max-w-[85%] md:max-w-[75%]'}`}>
        {/* Message bubble — synced colors with Chatbot widget */}
        <div
          className={`text-[14px] md:text-[15px] leading-[1.75] md:leading-[1.8] ${isBot
            ? 'px-1 py-0.5'  /* ChatGPT-style: no visible bubble for bot */
            : 'px-4 py-3 md:px-5 md:py-3.5 bg-[#3578E5] text-white rounded-[18px] rounded-br-[6px] shadow-[0_1px_4px_rgba(53,120,229,0.25)]'
            }`}
          style={isBot ? { color: TEXT_COLOR } : undefined}
        >
          {message.isTyping ? (
            <TypingDots />
          ) : isBot ? (
            message.isStreaming ? (
              <span className="whitespace-pre-wrap" style={{ color: TEXT_COLOR }}>
                {message.content}
                <span className="streaming-cursor" />
              </span>
            ) : (
              <BotContent content={message.content} />
            )
          ) : (
            <span>{message.content}</span>
          )}
        </div>

        {/* Action buttons — only for completed bot messages */}
        {isBot && !message.isTyping && !message.isStreaming && message.content && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
            className="flex items-center gap-0.5 -ml-0.5"
          >
            <button onClick={handleCopy} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#b0b8c4] hover:text-[#3578E5] hover:bg-[#3578E5]/5 transition-all" title="Sao chép">
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[#b0b8c4] hover:text-[#3578E5] hover:bg-[#3578E5]/5 transition-all" title="Hữu ích">
              <ThumbsUp size={13} />
            </button>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[#b0b8c4] hover:text-[#3578E5] hover:bg-[#3578E5]/5 transition-all" title="Chưa hữu ích">
              <ThumbsDown size={13} />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   MAIN CHAT PAGE
   ═══════════════════════════════════════ */
export default function ChatCreatePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [greeting] = useState(getGreeting);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // CRM Lead tracking states
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadFormData, setLeadFormData] = useState({ fullName: '', phone: '', email: '' });
  const [leadId, setLeadId] = useState<string | null>(null);
  const [isEndingChat, setIsEndingChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const sessionIdRef = useRef<string>(`web-${Date.now()}`);
  const messagesRef = useRef<ChatMessage[]>([]);

  // ── Smooth streaming: token buffer + RAF ──
  const tokenBufferRef = useRef<string>('');       // Accumulated raw tokens from SSE
  const renderedLenRef = useRef<number>(0);         // How much has been rendered
  const rafIdRef = useRef<number>(0);               // requestAnimationFrame ID
  const streamingMsgIdRef = useRef<string>('');      // ID of the message being streamed
  const lastScrollRef = useRef<number>(0);           // Throttle scroll during streaming

  // Keep messagesRef in sync with messages state
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const hasMessages = messages.length > 0;

  const [hasLeadInfo, setHasLeadInfo] = useState(false);

  // Ref tracking for background silently analyzing chat
  const bgHasLeadInfoRef = useRef(false);
  const bgLeadDataRef = useRef({ fullName: '', phone: '', email: '' });
  const bgMessagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => { bgHasLeadInfoRef.current = hasLeadInfo; }, [hasLeadInfo]);
  useEffect(() => { bgLeadDataRef.current = leadFormData; }, [leadFormData]);
  useEffect(() => { bgMessagesRef.current = messages; }, [messages]);

  useEffect(() => {
    const sendSilentAnalysis = () => {
      const history = bgMessagesRef.current;
      const data = bgLeadDataRef.current;
      
      if (bgHasLeadInfoRef.current && history.length > 1) {
        // Đánh dấu đã gửi để chống gửi đúp
        bgHasLeadInfoRef.current = false;
        
        const cleanHistory = history.filter(m => !m.isTyping && m.content.trim()).map(m => ({ role: m.role, content: m.content }));
        const payload = JSON.stringify({ ...data, chatHistory: cleanHistory });
        
        fetch(`/api/chat-leads/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    };

    // Trigger when user closes tab, reloads, or navigates away
    window.addEventListener('beforeunload', sendSilentAnalysis);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sendSilentAnalysis();
    });

    return () => {
      window.removeEventListener('beforeunload', sendSilentAnalysis);
      sendSilentAnalysis(); // Trigger on SPA unmount
    };
  }, []);

  const [showResumePrompt, setShowResumePrompt] = useState(false);

  useEffect(() => {
    // Tải lại thông tin form
    const savedLead = localStorage.getItem('ufm_chatbot_lead');
    if (savedLead) {
      try {
        setLeadFormData(JSON.parse(savedLead));
      } catch (e) {}
    }

    // Tải lại Session ID
    const savedSession = localStorage.getItem('ufm_chatbot_session_id');
    if (savedSession) {
      sessionIdRef.current = savedSession;
    } else {
      localStorage.setItem('ufm_chatbot_session_id', sessionIdRef.current);
    }

    // Tải lại màn trò chuyện
    const savedMessages = localStorage.getItem('ufm_chatbot_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        if (parsed && parsed.length > 0) {
          setShowResumePrompt(true);
          return;
        }
      } catch (e) {}
    }
    
    setShowLeadModal(true);
  }, []);

  useEffect(() => {
    // Lưu trữ session messages khi chat
    if (messages.length > 0) {
      localStorage.setItem('ufm_chatbot_messages', JSON.stringify(messages));
    }
  }, [messages]);

  /* ── Speech Recognition setup ── */
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setSpeechSupported(true);

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech error:', event.error);
      if (event.error !== 'aborted') {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.abort(); } catch (e) { }
    };
  }, []);

  const toggleRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        setInput('');
        recognition.start();
        setIsRecording(true);
      } catch (e) {
        // Already started, restart
        recognition.stop();
        setTimeout(() => {
          try {
            setInput('');
            recognition.start();
            setIsRecording(true);
          } catch (err) {
            console.warn('Cannot start speech recognition:', err);
          }
        }, 200);
      }
    }
  }, [isRecording]);

  /* ── Auto-scroll ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    // Skip auto-scroll during streaming — the RAF loop handles it with throttling
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.isStreaming) return;
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ── Scroll detection ── */
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Auto-resize textarea ── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  /* ── Smooth RAF render loop for streaming tokens ── */
  const startStreamingRaf = useCallback((msgId: string) => {
    streamingMsgIdRef.current = msgId;
    renderedLenRef.current = 0;

    const CHARS_PER_FRAME = 8; // characters to reveal per frame (~480 chars/sec at 60fps)

    const tick = () => {
      const fullText = tokenBufferRef.current;
      const currentLen = renderedLenRef.current;

      if (currentLen < fullText.length) {
        // Reveal next chunk of characters
        const nextLen = Math.min(currentLen + CHARS_PER_FRAME, fullText.length);
        renderedLenRef.current = nextLen;
        const visibleText = fullText.slice(0, nextLen);

        setMessages(prev => prev.map(m =>
          m.id === msgId
            ? { ...m, content: visibleText }
            : m
        ));

        // Throttled scroll: only scroll every 150ms
        const now = Date.now();
        if (now - lastScrollRef.current > 150) {
          lastScrollRef.current = now;
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  const stopStreamingRaf = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }
  }, []);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => { stopStreamingRaf(); };
  }, [stopStreamingRaf]);

  /* ── Send message (ChatGPT-style Smooth Token Streaming) ── */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Typing indicator with pipeline steps
    const typingId = 'typing';
    const botMsgId = `bot-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: typingId, role: 'bot', content: '', timestamp: new Date(), isTyping: true, pipelineSteps: [],
    }]);

    // Build chat_history from latest messages ref (avoids stale closure)
    const chatHistory = messagesRef.current
      .filter(m => !m.isTyping)
      .slice(-20)
      .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }));

    if (leadFormData.fullName) {
      chatHistory.unshift({ 
        role: 'user', 
        content: `HỆ THỐNG: Người dùng tên là ${leadFormData.fullName}. Hãy xưng hô bằng tên thân thiện. SĐT: ${leadFormData.phone}. Email: ${leadFormData.email}.` 
      });
    }

    // Reset token buffer
    tokenBufferRef.current = '';
    renderedLenRef.current = 0;

    try {
      const res = await fetch(`${FASTAPI_CHAT_URL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text.trim(),
          chat_history: chatHistory,
          session_id: sessionIdRef.current,
        }),
      });

      if (!res.ok) throw new Error('Lỗi kết nối AI Backend');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Không thể đọc stream');

      const decoder = new TextDecoder();
      let sseBuffer = '';
      let isStreamingTokens = false;
      let responseSource = '';
      let responseIntent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'node') {
              setMessages(prev => prev.map(m =>
                m.id === typingId
                  ? { ...m, pipelineSteps: [...(m.pipelineSteps || []), event.label] }
                  : m
              ));
            } else if (event.type === 'token') {
              // ── Append to buffer (NOT to React state directly!) ──
              tokenBufferRef.current += (event.content || '');

              if (!isStreamingTokens) {
                // First token: replace typing indicator with streaming message
                isStreamingTokens = true;
                setMessages(prev => prev.map(m =>
                  m.id === typingId
                    ? { ...m, id: botMsgId, isTyping: false, isStreaming: true, content: '' }
                    : m
                ));
                // Start the smooth RAF render loop
                startStreamingRaf(botMsgId);
              }
              // Tokens just accumulate in the buffer — RAF loop handles rendering
            } else if (event.type === 'done') {
              responseSource = event.source || '';
              responseIntent = event.intent || '';
            } else if (event.type === 'result') {
              // ── Full response (bypass: greetings, blocks, etc.) ──
              // Vẫn dùng typing buffer + RAF để có hiệu ứng gõ từng chữ
              const fullResponse = event.response || '';
              responseSource = event.source || '';
              responseIntent = event.intent || '';

              if (fullResponse) {
                tokenBufferRef.current = fullResponse;

                if (!isStreamingTokens) {
                  isStreamingTokens = true;
                  setMessages(prev => prev.map(m =>
                    m.id === typingId
                      ? { ...m, id: botMsgId, isTyping: false, isStreaming: true, content: '' }
                      : m
                  ));
                  startStreamingRaf(botMsgId);
                }
              } else {
                // Fallback nếu response rỗng
                const finalMsg: ChatMessage = {
                  id: botMsgId,
                  role: 'bot',
                  content: 'Xin lỗi, mình không thể xử lý yêu cầu này.',
                  timestamp: new Date(),
                  source: responseSource,
                  intent: responseIntent,
                };
                setMessages(prev => prev.filter(m => m.id !== typingId).concat(finalMsg));
                isStreamingTokens = true;
              }
            } else if (event.type === 'error') {
              const errContent = event.message || 'Xin lỗi, có lỗi xảy ra.';
              setMessages(prev => prev.filter(m => m.id !== typingId && m.id !== botMsgId).concat({
                id: botMsgId,
                role: 'bot',
                content: errContent,
                timestamp: new Date(),
                source: 'error',
              }));
              isStreamingTokens = true;
            }
          } catch { }
        }
      }

      // ── SSE stream ended — finalize ──
      stopStreamingRaf();

      if (isStreamingTokens && tokenBufferRef.current) {
        // Ensure ALL remaining buffered text is rendered + switch to Markdown mode
        const finalContent = tokenBufferRef.current;
        setMessages(prev => prev.map(m =>
          m.id === botMsgId
            ? { ...m, content: finalContent, isStreaming: false, source: responseSource, intent: responseIntent }
            : m
        ));
      } else if (!isStreamingTokens) {
        // No tokens received at all
        setMessages(prev => prev.filter(m => m.id !== typingId && m.id !== botMsgId).concat({
          id: botMsgId,
          role: 'bot',
          content: 'Xin lỗi, mình không thể xử lý yêu cầu này.',
          timestamp: new Date(),
          source: responseSource,
          intent: responseIntent,
        }));
      }
    } catch (err: any) {
      console.error('Chat stream error:', err);
      stopStreamingRaf();
      // Fallback to non-stream endpoint
      try {
        const chatHistory = messagesRef.current
          .filter(m => !m.isTyping)
          .slice(-20)
          .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }));
        const res = await fetch(`${FASTAPI_CHAT_URL}/api/v1/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: text.trim(),
            chat_history: chatHistory,
            session_id: sessionIdRef.current,
          }),
        });
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'bot',
          content: data.response || 'Xin lỗi, có lỗi xảy ra.',
          timestamp: new Date(),
          source: data.source,
          intent: data.intent,
        };
        setMessages(prev => prev.filter(m => m.id !== typingId).concat(botMsg));
      } catch {
        setMessages(prev => prev.filter(m => m.id !== typingId).concat({
          id: `bot-${Date.now()}`,
          role: 'bot',
          content: 'Xin lỗi, không thể kết nối đến hệ thống AI. Vui lòng thử lại sau.',
          timestamp: new Date(),
        }));
      }
    } finally {
      setIsLoading(false);
      tokenBufferRef.current = '';
      renderedLenRef.current = 0;
    }
  }, [isLoading, startStreamingRaf, stopStreamingRaf]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleNewChat = () => {
    // Phân tích người dùng trc khi xoá chat (mô phỏng tắt tab)
    const history = messages;
    if (hasLeadInfo && history.length > 1) {
      bgHasLeadInfoRef.current = false; // Tránh gọi đúp
      
      const cleanHistory = history.filter(m => !m.isTyping && m.content.trim()).map(m => ({ role: m.role, content: m.content }));
      const payload = JSON.stringify({ ...leadFormData, chatHistory: cleanHistory });
      fetch(`/api/chat-leads/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }

    localStorage.removeItem('ufm_chatbot_messages');
    setMessages([]);
    setInput('');
    sessionIdRef.current = `web-${Date.now()}`;
    localStorage.setItem('ufm_chatbot_session_id', sessionIdRef.current);
    
    // Reset trạng thái chat nhưng hiển thị lại form lấy thông tin (đã được lưu sẵn)
    setHasLeadInfo(false);
    setShowLeadModal(true);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .streaming-cursor {
          display: inline-block;
          width: 2.5px;
          height: 1.1em;
          background: linear-gradient(to bottom, #3578E5, #5E9BF0);
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink-cursor 0.75s ease-in-out infinite;
          border-radius: 2px;
        }
        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(15px, -20px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.95); }
        }
        /* Premium scrollbar */
        .chat-scroll::-webkit-scrollbar { width: 5px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>

      <div className="flex flex-col h-[100dvh] bg-[#fafafa] font-sans" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

        {/* ═══════════ TOP HEADER — Minimal & refined ═══════════ */}
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-[#e5e7eb]/60 relative z-50">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#3578E5] to-transparent opacity-60" />
          <div className="flex items-center justify-between px-4 md:px-8 h-[52px] md:h-[60px]">
            <Link href="/chat" className="flex items-center gap-3 md:gap-4 group">
              <div className="relative">
                <Image src="/images/logo_ufm_50nam_no_bg.png" alt="UFM" width={44} height={44} className="w-[36px] h-[36px] md:w-[42px] md:h-[42px] object-contain transition-transform group-hover:scale-105" priority />
              </div>
              <div className="hidden sm:block h-7 w-px bg-[#e5e7eb]" />
              <div className="hidden sm:flex flex-col">
                <span className="text-[12px] md:text-[13px] font-bold text-[#005496] leading-tight">Trường Đại học Tài chính - Marketing</span>
                <span className="text-[10px] md:text-[11px] font-medium text-[#9ca3af] leading-tight">Viện Đào tạo Sau Đại học · AI Assistant</span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button onClick={handleNewChat} className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium text-[#6b7280] bg-[#f3f4f6] rounded-full hover:bg-[#e5e7eb] active:scale-95 transition-all">
                <Plus size={13} />
                Chat mới
              </button>
              <Link href="/chat" className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 text-[12px] md:text-[13px] font-medium text-white bg-[#3578E5] rounded-full active:scale-95 hover:bg-[#2b69d1] transition-all shadow-sm">
                <ArrowLeft size={13} />
                <span className="hidden sm:inline">Quay lại</span>
              </Link>
            </div>
          </div>
        </header>

        {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
        <main ref={chatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden relative chat-scroll">

          {/* Prompt Modal */}
          <AnimatePresence>
            {showResumePrompt && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
                >
                  <div className="bg-[#005496] p-5 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10" />
                    <div className="relative z-10">
                      <h2 className="text-white text-lg font-bold">Cuộc trò chuyện cũ</h2>
                    </div>
                  </div>
                  <div className="p-6 space-y-4 text-center text-sm text-slate-700">
                    <p>Bạn có một đoạn chat chưa hoàn thành. Bạn muốn tiếp tục hay tạo đoạn chat mới?</p>
                    <div className="flex gap-3">
                      <button 
                        className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-all"
                        onClick={() => {
                           localStorage.removeItem('ufm_chatbot_messages');
                           setShowResumePrompt(false);
                           setShowLeadModal(true);
                        }}
                      >
                        Tạo mới
                      </button>
                      <button 
                        className="flex-1 py-2 bg-[#005496] text-white rounded-lg font-bold hover:bg-[#00427a] transition-all"
                        onClick={() => {
                           try {
                             const savedMessages = localStorage.getItem('ufm_chatbot_messages');
                             if (savedMessages) setMessages(JSON.parse(savedMessages));
                           } catch (e) {}
                           setHasLeadInfo(true);
                           setShowResumePrompt(false);
                           setShowLeadModal(false);
                        }}
                      >
                        Tiếp tục
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CRM Modal */}
          <AnimatePresence>
            {showLeadModal && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                >
                  <div className="bg-[#005496] p-5 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
                        <Image src="/images/ufm_chatbot_icon.png" alt="UFM" width={32} height={32} className="rounded-full" />
                      </div>
                      <h2 className="text-white text-lg font-bold">Chào mừng bạn đến với UFM Bot</h2>
                      <p className="text-[#90c2ff] text-sm mt-1 mb-2">Vui lòng cung cấp một số thông tin để chúng tôi hỗ trợ bạn tốt nhất.</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {(() => {
                      const submitLeadForm = async () => {
                        const { fullName, phone, email } = leadFormData;
                        if (!fullName.trim()) return showToast.error('Vui lòng nhập họ và tên của bạn.');
                        if (fullName.trim().length < 2) return showToast.error('Họ tên quá ngắn.');
                        
                        if (!phone.trim()) return showToast.error('Vui lòng nhập số điện thoại.');
                        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
                        if (!phoneRegex.test(phone.trim())) return showToast.error('Số điện thoại không đúng định dạng hợp lệ (VD: 0912345678).');

                        if (email.trim()) {
                           const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                           if (!emailRegex.test(email.trim())) return showToast.error('Địa chỉ email không hợp lệ.');
                        }

                        setIsLoading(true);
                        localStorage.setItem('ufm_chatbot_lead', JSON.stringify(leadFormData));
                        setTimeout(() => {
                           setHasLeadInfo(true);
                           setShowLeadModal(false);
                           setIsLoading(false);
                        }, 500);
                      };
                      return (
                        <>
                    <div>
                      <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5 ">Họ và tên *</label>
                      <div className="relative">
                        <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={leadFormData.fullName} onChange={e => setLeadFormData({...leadFormData, fullName: e.target.value})} onKeyDown={e => e.key === 'Enter' && submitLeadForm()} placeholder="Nguyễn Văn A" className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[14px] focus:ring-2 focus:ring-[#005496]/20 focus:border-[#005496] outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">Số điện thoại *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="tel" value={leadFormData.phone} onChange={e => setLeadFormData({...leadFormData, phone: e.target.value})} onKeyDown={e => e.key === 'Enter' && submitLeadForm()} placeholder="09xxxx" className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[14px] focus:ring-2 focus:ring-[#005496]/20 focus:border-[#005496] outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">Email liên hệ (Tùy chọn)</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="email" value={leadFormData.email} onChange={e => setLeadFormData({...leadFormData, email: e.target.value})} onKeyDown={e => e.key === 'Enter' && submitLeadForm()} placeholder="email@example.com" className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[14px] focus:ring-2 focus:ring-[#005496]/20 focus:border-[#005496] outline-none transition-all" />
                      </div>
                    </div>
                    <button 
                      className="w-full py-2.5 mt-2 bg-[#005496] text-white rounded-lg font-bold text-[14px] hover:bg-[#00427a] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      onClick={submitLeadForm}
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Bắt đầu trò chuyện</span>}
                      {!isLoading && <ArrowLeft className="w-4 h-4 rotate-180" />}
                    </button>
                    </>
                      );
                    })()}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── WELCOME STATE ─── */}
          {!hasMessages && (
            <div className="flex flex-col items-center justify-center h-full px-4 md:px-6 relative">

              {/* Subtle floating orbs background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-[#005496]/[0.03] blur-3xl" style={{ animation: 'float-orb 12s ease-in-out infinite' }} />
                <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] rounded-full bg-[#0284c7]/[0.04] blur-3xl" style={{ animation: 'float-orb 15s ease-in-out 3s infinite' }} />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-center mb-8 md:mb-12 relative z-10"
              >
                {/* UFM chatbot icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#f0f7ff] to-[#e0efff] border border-[#d0e3f5] shadow-[0_2px_12px_rgba(0,84,150,0.08)] flex items-center justify-center overflow-hidden"
                >
                  <Image src="/images/ufm_chatbot_icon.png" alt="UFM Bot" width={48} height={48} className="w-10 h-10 md:w-12 md:h-12 object-cover" />
                </motion.div>

                <h1 className="text-[24px] md:text-[36px] font-bold tracking-tight mb-2 md:mb-3" style={{ color: TEXT_COLOR }}>
                  {greeting.text}{' '}
                  <span className="bg-gradient-to-r from-[#005496] to-[#0284c7] bg-clip-text text-transparent">{greeting.highlight}</span>
                  {' '}{greeting.emoji}
                </h1>
                <p className="text-[14px] md:text-[16px] text-[#9ca3af] font-normal">
                  Hỏi bất cứ điều gì về tuyển sinh Sau Đại học
                </p>
              </motion.div>

              {/* Suggestion cards — Premium grid */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-2 gap-2.5 md:gap-3 max-w-xl w-full mb-7 md:mb-10 px-1 relative z-10"
              >
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    disabled={isLoading}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="group flex items-start gap-3 p-3.5 md:p-4 bg-white border border-[#e5e7eb] rounded-2xl text-left hover:border-[#d0e3f5] hover:shadow-[0_4px_20px_rgba(0,84,150,0.06)] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: s.bg, color: s.color }}>
                      <s.icon size={16} />
                    </div>
                    <span className="text-[12px] md:text-[13px] font-medium leading-snug text-[#4b5563] group-hover:text-[#1f2937] transition-colors line-clamp-2">{s.text}</span>
                  </motion.button>
                ))}
              </motion.div>

              {/* Input box — Premium glassmorphic card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="w-full max-w-xl px-1 relative z-10"
              >
                <div className="relative bg-white border border-[#d1d5db] rounded-2xl md:rounded-[20px] px-4 md:px-5 pt-3.5 md:pt-4 pb-2.5 md:pb-3 shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-all duration-300 focus-within:border-[#005496]/40 focus-within:shadow-[0_2px_24px_rgba(0,84,150,0.1)]">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Hỏi bất cứ điều gì..."
                    rows={2}
                    disabled={isLoading}
                    className="w-full bg-transparent border-none outline-none resize-none text-[14px] md:text-[15px] placeholder-[#9ca3af] leading-relaxed min-h-[48px] md:min-h-[56px] max-h-[100px] md:max-h-[120px] disabled:opacity-50"
                    style={{ color: TEXT_COLOR }}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {speechSupported && (
                      <button
                        onClick={toggleRecording}
                        className={`relative w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${isRecording
                          ? 'text-white bg-red-500 shadow-lg'
                          : 'text-[#9ca3af] hover:text-[#005496] hover:bg-[#f0f7ff]'
                          }`}
                        title={isRecording ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
                      >
                        {isRecording && (
                          <span className="absolute inset-0 rounded-full bg-red-500" style={{ animation: 'pulse-ring 1.5s ease-out infinite' }} />
                        )}
                        {isRecording ? <MicOff size={17} className="relative z-10" /> : <Mic size={18} />}
                      </button>
                    )}
                    {!speechSupported && <div />}
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || isLoading}
                      className="w-9 h-9 rounded-full bg-[#3578E5] flex items-center justify-center text-white active:scale-90 hover:bg-[#2b69d1] transition-all disabled:opacity-30 disabled:bg-[#9ca3af]"
                      title="Gửi tin nhắn"
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </div>
                </div>
                <p className="text-center text-[11px] text-[#b0b8c4] mt-3">
                  UFM AI có thể mắc lỗi. Hãy kiểm chứng thông tin quan trọng.
                </p>
              </motion.div>
            </div>
          )}

          {/* ─── CHAT STATE (has messages) ─── */}
          {hasMessages && (
            <div className="py-5 md:py-8 space-y-5 md:space-y-6 min-h-full">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} className="h-2" />
            </div>
          )}

          {/* Scroll to bottom FAB */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={scrollToBottom}
                className="fixed bottom-[180px] md:bottom-[200px] right-4 md:right-8 w-9 h-9 rounded-full bg-white border border-[#d1d5db] shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center justify-center text-[#6b7280] hover:text-[#005496] hover:border-[#005496]/20 transition-all z-30"
              >
                <ChevronDown size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </main>

        {/* ═══════════ BOTTOM BAR — Floating Gemini/GPT Style ═══════════ */}
        {hasMessages && (
          <div className="flex-shrink-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa]/90 to-transparent pt-6 pb-4 md:pb-6 px-3 md:px-6 relative z-10">
            <div className="max-w-[48rem] mx-auto">
              {/* Quick actions - subtle pills above the input */}
              <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-3 md:pb-3.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <button onClick={handleNewChat} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3578E5] text-white rounded-lg md:rounded-xl text-[12px] font-medium whitespace-nowrap active:scale-95 hover:bg-[#2b69d1] transition-all flex-shrink-0 shadow-sm">
                  <Plus size={13} />
                  Chat mới
                </button>
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s.text)} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-lg md:rounded-xl text-[12px] font-medium text-[#6b7280] whitespace-nowrap active:scale-95 hover:border-[#3578E5]/30 hover:text-[#3578E5] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all flex-shrink-0 disabled:opacity-50 disabled:pointer-events-none">
                    <s.icon size={12} style={{ color: s.color }} />
                    {s.text}
                  </button>
                ))}
              </div>

              {/* Input card - Floating Box */}
              <div className="relative bg-white border border-[#d1d5db] rounded-[24px] px-4 md:px-5 pt-3.5 md:pt-4 pb-2.5 md:pb-3 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300 focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#005496]/50 focus-within:shadow-[0_4px_24px_rgba(0,84,150,0.12)]">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi bất cứ điều gì..."
                  rows={1}
                  disabled={isLoading}
                  className="w-full bg-transparent border-none outline-none resize-none text-[14px] md:text-[15px] placeholder-[#9ca3af] leading-relaxed min-h-[24px] md:min-h-[26px] max-h-[100px] md:max-h-[120px] disabled:opacity-50"
                  style={{ color: TEXT_COLOR }}
                />
                <div className="flex items-center justify-between mt-1.5">
                  {speechSupported ? (
                    <button
                      onClick={toggleRecording}
                      className={`relative w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${isRecording
                        ? 'text-white bg-red-500 shadow-lg'
                        : 'text-[#9ca3af] hover:text-[#005496] hover:bg-[#f0f7ff]'
                        }`}
                      title={isRecording ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
                    >
                      {isRecording && (
                        <span className="absolute inset-0 rounded-full bg-red-500" style={{ animation: 'pulse-ring 1.5s ease-out infinite' }} />
                      )}
                      {isRecording ? <MicOff size={16} className="relative z-10" /> : <Mic size={18} />}
                    </button>
                  ) : <div />}
                  <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="w-9 h-9 rounded-full bg-[#3578E5] flex items-center justify-center text-white active:scale-90 hover:bg-[#2b69d1] transition-all disabled:opacity-30 disabled:bg-[#9ca3af]" title="Gửi tin nhắn">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-center text-[10px] md:text-[11px] text-[#b0b8c4] mt-3">
                UFM AI có thể mắc lỗi. Hãy kiểm chứng thông tin quan trọng.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
