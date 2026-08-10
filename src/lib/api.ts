/**
 * src/lib/api.ts — Centralized API Client for UFM Chatbot Backend v4.0.0
 *
 * All calls go through this module so headers, base URL, and API key
 * are managed in ONE place.
 */

/* ─── Config ────────────────────────────────────────── */

export const API_BASE =
  process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://chatbot-ufm-api.vincode.xyz';

const API_KEY =
  process.env.NEXT_PUBLIC_API_KEY || '';

/* ─── Types (matching OpenAPI 3.1 spec) ─────────────── */

export interface ChatRequest {
  /** Câu hỏi hoặc tin nhắn của người dùng */
  message: string;
  /** ID phiên chat — để trống sẽ tự tạo mới */
  session_id?: string;
  /** 'nam' | 'nu' — để Cô Thắm xưng hô */
  gender?: string;
}

export interface SourceItem {
  url: string;
  title: string;
  type?: string; // 'webpage' | 'pdf' | 'internet_search'
}

export interface ChatResponse {
  answer: string;
  sources: SourceItem[];
  suggestions: string[];
  requires_handoff: boolean;
  session_id: string;
}

export interface GuestProfile {
  full_name: string;
  birth_year: number;
  gender?: string;
  education_level: string; // 'dai_hoc' | 'sau_dai_hoc' | 'cao_dang' | 'khac'
  education_detail?: string;
  contact: string;
  contact_type?: string; // 'email' | 'phone'
  consent_given: boolean;
  session_id?: string;
}

export interface GuestProfileResponse {
  success: boolean;
  session_id: string;
  message: string;
  profile_id?: string;
}

export interface HandoffRequest {
  name: string;
  phone: string;
  email?: string;
  interest: string;
  session_id?: string;
}

export interface HandoffResponse {
  success: boolean;
  message: string;
}

/** SSE chunk parsed from stream endpoint */
export interface SSEChunk {
  /** Regular text token */
  content?: string;
  /** Stream finished */
  done?: boolean;
  /** Metadata fields (only when done=true) */
  session_id?: string;
  sources?: SourceItem[];
  suggestions?: string[];
  requires_handoff?: boolean;
  co_tham_xung?: string;
  /** Error message */
  error?: string;
}

/* ─── Helpers ───────────────────────────────────────── */

function apiHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
    ...extra,
  };
}

/* ─── Chat — Synchronous ────────────────────────────── */

/**
 * POST /api/v1/chat/message
 * Trả về toàn bộ câu trả lời trong một request.
 */
export async function chatMessage(
  message: string,
  sessionId?: string,
  gender?: string,
): Promise<ChatResponse> {
  const body: ChatRequest = {
    message,
    ...(sessionId ? { session_id: sessionId } : {}),
    ...(gender ? { gender } : {}),
  };

  const res = await fetch(`${API_BASE}/api/v1/chat/message`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Chat API error (${res.status}): ${errText}`);
  }

  return res.json();
}

/* ─── Chat — SSE Stream ─────────────────────────────── */

/**
 * POST /api/v1/chat/stream
 * Returns the raw Response so caller can read the ReadableStream.
 */
export async function chatStream(
  message: string,
  sessionId?: string,
  gender?: string,
): Promise<Response> {
  const body: ChatRequest = {
    message,
    ...(sessionId ? { session_id: sessionId } : {}),
    ...(gender ? { gender } : {}),
  };

  const res = await fetch(`${API_BASE}/api/v1/chat/stream`, {
    method: 'POST',
    headers: apiHeaders({ Accept: 'text/event-stream' }),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Stream API error (${res.status}): ${errText}`);
  }

  return res;
}

/* ─── Guest Register ────────────────────────────────── */

/**
 * POST /api/v1/guest/register
 */
export async function registerGuest(
  profile: GuestProfile,
): Promise<GuestProfileResponse> {
  const res = await fetch(`${API_BASE}/api/v1/guest/register`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Guest register error (${res.status}): ${errText}`);
  }

  return res.json();
}

/* ─── Human Handoff ─────────────────────────────────── */

/**
 * POST /api/v1/handoff
 */
export async function requestHandoff(
  data: HandoffRequest,
): Promise<HandoffResponse> {
  const res = await fetch(`${API_BASE}/api/v1/handoff`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Handoff error (${res.status}): ${errText}`);
  }

  return res.json();
}

/* ─── SSE Parser Utilities ──────────────────────────── */

/**
 * Parse a single JSON string from SSE into an SSEChunk.
 * Returns null for unparseable data.
 */

export function parseSSEData(dataStr: string): SSEChunk | null {
  const trimmed = dataStr.trim();
  if (!trimmed || trimmed === '[DONE]') return null;
  try {
    return JSON.parse(trimmed) as SSEChunk;
  } catch {
    return null;
  }
}

/**
 * Extract complete SSE events from a raw buffer string.
 *
 * The backend sends literal `\n\n` (backslash-n-backslash-n) as the SSE
 * delimiter **and** inside JSON `content` values.  A simple `indexOf`
 * will match inside the JSON first, truncating it.
 *
 * This function uses brace-depth + string-context tracking to find the
 * real closing `}` of each JSON object, then skips the delimiter.
 */
export function extractSSEEvents(buffer: string): { events: string[]; remaining: string } {
  const events: string[] = [];
  let pos = 0;

  while (pos < buffer.length) {
    const dataIdx = buffer.indexOf('data:', pos);
    if (dataIdx === -1) break;

    // Skip "data:" and optional whitespace
    let contentStart = dataIdx + 5;
    while (contentStart < buffer.length && buffer[contentStart] === ' ') contentStart++;

    // Handle [DONE] sentinel
    if (buffer.startsWith('[DONE]', contentStart)) {
      pos = contentStart + 6;
      // Skip trailing delimiter
      if (buffer.startsWith('\\n\\n', pos)) pos += 4;
      else if (buffer.startsWith('\n\n', pos)) pos += 2;
      continue;
    }

    // Expect a JSON object starting with {
    if (contentStart >= buffer.length || buffer[contentStart] !== '{') {
      pos = contentStart + 1;
      continue;
    }

    // Find end of JSON by tracking brace depth (handles \\n\\n inside strings)
    let depth = 0;
    let inString = false;
    let escaped = false;
    let jsonEnd = -1;

    for (let i = contentStart; i < buffer.length; i++) {
      const ch = buffer[i];

      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }

      if (!inString) {
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) { jsonEnd = i + 1; break; }
        }
      }
    }

    if (jsonEnd === -1) {
      // Incomplete JSON — return remaining from this data: position
      return { events, remaining: buffer.substring(dataIdx) };
    }

    events.push(buffer.substring(contentStart, jsonEnd));

    // Skip delimiter after the JSON object
    pos = jsonEnd;
    if (buffer.startsWith('\\n\\n', pos)) pos += 4;
    else if (buffer.startsWith('\n\n', pos)) pos += 2;
    else if (buffer.startsWith('\r\n\r\n', pos)) pos += 4;
  }

  return { events, remaining: buffer.substring(pos) };
}
