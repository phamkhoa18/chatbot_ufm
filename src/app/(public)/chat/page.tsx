'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Send, Mic, Plus, GraduationCap,
  BookOpen, HelpCircle, Bot, User,
  MessageCircle, Calendar,
  Shield, Globe, Phone, Mail, MapPin,
  ChevronRight, Star,
  Award, Clock, Building, Users,
  TrendingUp, FileText, Banknote, Briefcase,
  CheckCircle2, Sparkles, ArrowRight,
} from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease, delay: i * 0.1 }
  })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease } }
};

const slideRight = {
  hidden: { opacity: 0, x: -30 },
  visible: (i: number = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.6, ease, delay: i * 0.08 }
  })
};

/* ─── Dữ liệu thực từ Viện Đào tạo Sau Đại học UFM ─── */

const SUGGESTIONS = [
  { icon: GraduationCap, text: 'Điều kiện xét tuyển Thạc sĩ 2026', color: '#005496' },
  { icon: Banknote, text: 'Học phí và chính sách ưu đãi', color: '#0284c7' },
  { icon: Calendar, text: 'Lịch thi đầu vào đợt gần nhất', color: '#7c3aed' },
  { icon: FileText, text: 'Hồ sơ cần chuẩn bị những gì?', color: '#059669' },
];

const STATS = [
  { value: '50+', label: 'Năm hình thành & phát triển', icon: Award, color: '#f59e0b' },
  { value: '9', label: 'Ngành Thạc sĩ', icon: BookOpen, color: '#3b82f6' },
  { value: '3', label: 'Ngành Tiến sĩ', icon: GraduationCap, color: '#8b5cf6' },
  { value: '24/7', label: 'Tư vấn trực tuyến', icon: Clock, color: '#10b981' },
];

const MASTER_PROGRAMS = [
  { name: 'Tài chính – Ngân hàng', code: 'TCNH', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=TCNH', icon: TrendingUp },
  { name: 'Quản trị Kinh doanh', code: 'QTKD', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=QTKD', icon: Briefcase },
  { name: 'Kế toán', code: 'KT', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=KT', icon: FileText },
  { name: 'Kinh tế học', code: 'KTH', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=KTH', icon: TrendingUp },
  { name: 'Quản lý Kinh tế', code: 'QLKT', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=QLKT', icon: Building },
  { name: 'Luật Kinh tế', code: 'LKT', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=LKT', icon: Shield },
  { name: 'Kinh doanh Quốc tế', code: 'KDQT', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=KDQT', icon: Globe },
  { name: 'Marketing', code: 'MKT', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=MKT', icon: Star },
  { name: 'Toán Kinh tế', code: 'TKT', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=TKT', icon: BookOpen },
];

const PHD_PROGRAMS = [
  { name: 'Quản trị Kinh doanh', code: 'TS_QTKD', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=TS_QTKD' },
  { name: 'Tài chính – Ngân hàng', code: 'TS_TCNH', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=TS_TCNH' },
  { name: 'Quản lý Kinh tế', code: 'TS_QLKT', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=TS_QLKT' },
];

const POLICIES = [
  {
    icon: Clock,
    title: 'Tiết kiệm thời gian',
    desc: 'Sinh viên được đăng ký học trước các học phần thạc sĩ ngay từ năm cuối đại học, rút ngắn đáng kể thời gian nhận bằng.',
    gradient: 'from-[#005496] to-[#0ea5e9]',
  },
  {
    icon: Banknote,
    title: 'Học phí ưu đãi',
    desc: 'Giảm 10% học phí cho cựu sinh viên UFM. Cam kết ổn định mức học phí trong suốt toàn khóa học.',
    gradient: 'from-[#059669] to-[#34d399]',
  },
  {
    icon: Sparkles,
    title: 'Linh hoạt & Hiện đại',
    desc: 'Quy trình số hóa toàn diện từ đăng ký đến quản lý học vụ. Đào tạo kết hợp linh hoạt trực tiếp và trực tuyến.',
    gradient: 'from-[#7c3aed] to-[#a78bfa]',
  },
  {
    icon: Users,
    title: 'Hỗ trợ chuyên sâu',
    desc: 'Đội ngũ giảng viên đầu ngành trực tiếp hướng dẫn. Quy trình bảo vệ luận văn/luận án tinh gọn, hiệu quả.',
    gradient: 'from-[#f59e0b] to-[#fbbf24]',
  },
];

const USEFUL_LINKS = [
  { label: 'Viện Đào tạo Sau Đại học', href: 'https://daotaosdh.ufm.edu.vn', icon: Building, desc: 'Cổng thông tin chính thức của Viện SĐH' },
  { label: 'Cổng thông tin ĐH Tài chính – Marketing', href: 'https://ufm.edu.vn', icon: Globe, desc: 'Website chính thức nhà trường' },
  { label: 'Tuyển sinh Thạc sĩ', href: 'https://daotaosdh.ufm.edu.vn/ChiTiet.aspx?LoaiTin=v1UjoAIA40d2Nl0tc5EwAA', icon: GraduationCap, desc: 'Thông báo tuyển sinh & điều kiện xét tuyển' },
  { label: 'Tuyển sinh Tiến sĩ', href: 'https://daotaosdh.ufm.edu.vn/ChiTiet.aspx?LoaiTin=ffBwKFG43zUj-wnVkKHUNg', icon: Award, desc: 'Chương trình đào tạo trình độ Tiến sĩ' },
  { label: 'Tra cứu điều kiện xét tuyển', href: 'https://daotaosdh.ufm.edu.vn/DanhMucDieuKienXTDauVao.aspx', icon: FileText, desc: 'Tra cứu ngành & môn học bổ sung kiến thức' },
  { label: 'Đăng ký lớp ngắn hạn', href: 'https://daotaosdh.ufm.edu.vn/dang-ky-lop-ngan-han', icon: BookOpen, desc: 'Lớp bổ sung kiến thức & kỹ năng chuyên môn' },
  { label: 'Tra cứu văn bằng', href: 'https://uis.ufm.edu.vn/TraCuuVanBang', icon: Shield, desc: 'Kiểm tra tính hợp lệ của văn bằng' },
  { label: 'Thư viện số UFM', href: 'https://thuvien.ufm.edu.vn/', icon: BookOpen, desc: 'Tài liệu học tập & nghiên cứu khoa học' },
];

function useTypingEffect(text: string, speed = 35) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return { displayed, done };
}

// Pre-computed values to avoid hydration mismatch (Math.random() differs between server/client)
const FLOATING_PARTICLES = [
  { w: 18, h: 24, left: 15, top: 20, moveY: -35, moveX: 12, dur: 7.2 },
  { w: 14, h: 16, left: 72, top: 45, moveY: -28, moveX: -8, dur: 8.5 },
  { w: 22, h: 20, left: 35, top: 70, moveY: -42, moveX: 15, dur: 6.8 },
  { w: 12, h: 18, left: 85, top: 30, moveY: -25, moveX: -18, dur: 9.1 },
  { w: 26, h: 22, left: 50, top: 55, moveY: -38, moveX: 10, dur: 7.6 },
  { w: 16, h: 28, left: 25, top: 80, moveY: -30, moveX: -14, dur: 8.3 },
  { w: 20, h: 14, left: 60, top: 15, moveY: -45, moveX: 6, dur: 6.4 },
  { w: 24, h: 26, left: 42, top: 60, moveY: -32, moveX: -10, dur: 9.5 },
];

function FloatingDecorations() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {FLOATING_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.w,
            height: p.h,
            background: i % 2 === 0 ? 'rgba(0, 84, 150, 0.05)' : 'rgba(255, 210, 0, 0.1)',
            left: `${p.left}%`,
            top: `${p.top}%`,
            filter: 'blur(4px)'
          }}
          animate={{
            y: [0, p.moveY, 0],
            x: [0, p.moveX, 0],
            opacity: [0.3, 0.6, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function ChatLandingPage() {
  const greeting = "Chào bạn! 😊 Mình là Chatbot Tư vấn Tuyển sinh của Viện Đào tạo Sau Đại học – Trường ĐH Tài chính - Marketing. Mình có thể hỗ trợ bạn thông tin về 9 ngành Thạc sĩ, 3 ngành Tiến sĩ, điều kiện xét tuyển, học phí hay lịch thi đầu vào ạ!";
  const { displayed, done } = useTypingEffect(greeting, 28);
  const [activeTab, setActiveTab] = useState<'master' | 'phd'>('master');

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans selection:bg-[#005496]/20 selection:text-[#005496]">

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative pt-[80px] pb-16 md:pt-[120px] md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#f0f7ff] to-[#e6f2fc] -z-10" />
        <FloatingDecorations />

        <div className="absolute inset-0 pointer-events-none -z-10">
          <motion.div
            className="absolute top-20 right-[10%] w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,84,150,0.06), transparent 70%)', filter: 'blur(40px)' }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-40 left-[5%] w-[350px] h-[350px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,210,0,0.08), transparent 70%)', filter: 'blur(50px)' }}
            animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Left: Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease }}
              className="flex-1 flex justify-center order-2 lg:order-1"
            >
              <div className="relative w-[280px] h-[280px] md:w-[380px] md:h-[380px] lg:w-[440px] lg:h-[440px]">
                <div className="absolute inset-[-10px] rounded-full border border-[#005496]/10" />
                <div className="absolute inset-[-30px] rounded-full border border-dashed border-[#0284c7]/15" />

                <Image
                  src="/images/ufm_chatbot.png"
                  alt="Trợ lý Tuyển sinh UFM"
                  fill
                  sizes="(max-width: 768px) 280px, (max-width: 1024px) 380px, 440px"
                  className="object-contain drop-shadow-2xl relative z-10"
                  priority
                />

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="absolute top-4 -left-4 md:top-8 md:-left-8 bg-white/90 backdrop-blur-md px-3 py-2.5 rounded-2xl shadow-xl border border-[#e2e8f0]/80 z-20"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] flex items-center justify-center shadow-inner">
                      <GraduationCap size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">9 ngành Thạc sĩ</p>
                      <p className="text-[13px] font-bold text-[#0f172a]">3 ngành Tiến sĩ</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="absolute -bottom-2 -right-2 md:bottom-2 md:right-4 bg-white px-4 py-3 rounded-full shadow-[0_10px_40px_-10px_rgba(0,84,150,0.3)] border border-[#005496]/10 flex items-center gap-3 z-20"
                >
                  <div className="relative w-10 h-10 rounded-full bg-[#005496] flex items-center justify-center">
                    <Bot size={20} className="text-white" />
                    <motion.div
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[#64748b]">Tư vấn viên AI</p>
                    <p className="text-[15px] font-bold text-[#005496]">Tuyển sinh UFM</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Content */}
            <div className="flex-1 text-center lg:text-left order-1 lg:order-2">
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#005496]/5 border border-[#005496]/10 mb-6"
              >
                <Award size={14} className="text-[#005496]" />
                <span className="text-[12px] font-semibold text-[#005496] tracking-wide uppercase">Viện Đào tạo Sau Đại học – UFM</span>
              </motion.div>

              <motion.h1
                initial="hidden" animate="visible" variants={fadeUp} custom={1}
                className="text-[36px] md:text-[48px] lg:text-[56px] font-bold leading-[1.15] tracking-tight text-[#0f172a] mb-5"
              >
                Nâng tầm sự nghiệp với{' '}
                <span className="relative inline-block mt-2">
                  <span className="text-[#005496]">Sau Đại học UFM</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6, ease }}
                    className="absolute -bottom-1 left-0 w-full h-[3px] bg-[#ffd200] rounded-full origin-left"
                  />
                </span>
              </motion.h1>

              <motion.p
                initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="text-[16px] md:text-[18px] font-normal text-[#64748b] leading-[1.7] max-w-lg mx-auto lg:mx-0 mb-8"
              >
                Trợ lý AI tư vấn tuyển sinh tức thì — giải đáp mọi thắc mắc về chương trình Thạc sĩ, Tiến sĩ, điều kiện đầu vào, học phí & lịch thi tại Trường ĐH Tài chính - Marketing.
              </motion.p>

              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={3}
                className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
              >
                <Link
                  href="/chat/create"
                  className="group relative flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-[#005496] to-[#0068b8] text-white rounded-full font-semibold text-[15px] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,84,150,0.3)] hover:-translate-y-0.5 overflow-hidden w-full sm:w-auto"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#0068b8] to-[#005496] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <MessageCircle size={18} className="relative z-10" />
                  <span className="relative z-10">Bắt đầu tư vấn ngay</span>
                </Link>
                <a
                  href="https://daotaosdh.ufm.edu.vn/gioi-thieu-tuyen-sinh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-4 text-[#005496] font-semibold text-[15px] hover:underline transition-all"
                >
                  Xem thông tin tuyển sinh
                  <ArrowRight size={16} />
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ STATS RIBBON ═══════════ */}
      <section className="relative py-8 bg-white border-y border-[#e2e8f0]/60">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="group relative flex items-center gap-4 py-4 px-4 rounded-2xl transition-all duration-500 hover:bg-[#f8fafc] hover:shadow-sm"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                >
                  <stat.icon size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[24px] md:text-[28px] font-bold text-[#0f172a] leading-none tracking-tight">{stat.value}</p>
                  <p className="text-[12px] font-medium text-[#64748b] mt-1.5">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CHÍNH SÁCH VƯỢT TRỘI ═══════════ */}
      <section className="py-20 md:py-24 bg-[#f8fafc] relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#005496]/5 border border-[#005496]/10 mb-4">
              <Sparkles size={14} className="text-[#005496]" />
              <span className="text-[12px] font-semibold text-[#005496] tracking-wide uppercase">Đồng hành cùng người học</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-[28px] md:text-[36px] font-bold text-[#0f172a] tracking-tight mb-4">
              Chính sách <span className="text-[#005496]">Vượt trội</span> dành cho Học viên
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-[15px] md:text-[16px] font-normal text-[#64748b] max-w-xl mx-auto leading-relaxed">
              Viện Đào tạo Sau Đại học UFM cam kết mang đến trải nghiệm học tập tốt nhất với những chính sách ưu đãi hấp dẫn.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {POLICIES.map((policy, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="group relative bg-white rounded-[24px] p-7 border border-[#e2e8f0] transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,84,150,0.1)] hover:border-[#005496]/20 hover:-translate-y-1"
              >
                <div className="relative z-10">
                  <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${policy.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`} style={{ width: '52px', height: '52px' }}>
                    <policy.icon size={24} className="text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[17px] font-bold text-[#0f172a] mb-2.5">{policy.title}</h3>
                  <p className="text-[14px] font-normal text-[#64748b] leading-[1.7]">{policy.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CHƯƠNG TRÌNH ĐÀO TẠO ═══════════ */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-[28px] md:text-[36px] font-bold text-[#0f172a] tracking-tight mb-4">
              Chương trình <span className="text-[#005496]">Đào tạo</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-[15px] md:text-[16px] text-[#64748b] max-w-2xl mx-auto leading-relaxed">
              Đa dạng ngành học thuộc các lĩnh vực kinh tế, tài chính, quản trị & luật — đáp ứng nhu cầu nâng cao chuyên môn và nghiên cứu học thuật.
            </motion.p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="flex justify-center gap-2 mb-10"
          >
            <button
              onClick={() => setActiveTab('master')}
              className={`px-6 py-3 rounded-full text-[14px] font-semibold transition-all duration-300 ${activeTab === 'master' ? 'bg-[#005496] text-white shadow-lg shadow-[#005496]/20' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}
            >
              <GraduationCap size={16} className="inline mr-2 -mt-0.5" />
              Thạc sĩ ({MASTER_PROGRAMS.length} ngành)
            </button>
            <button
              onClick={() => setActiveTab('phd')}
              className={`px-6 py-3 rounded-full text-[14px] font-semibold transition-all duration-300 ${activeTab === 'phd' ? 'bg-[#005496] text-white shadow-lg shadow-[#005496]/20' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}
            >
              <Award size={16} className="inline mr-2 -mt-0.5" />
              Tiến sĩ ({PHD_PROGRAMS.length} ngành)
            </button>
          </motion.div>

          {/* Master Programs Grid */}
          {activeTab === 'master' && (
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {MASTER_PROGRAMS.map((prog, i) => (
                <motion.a
                  key={prog.code}
                  variants={fadeUp}
                  custom={i}
                  href={prog.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl transition-all duration-300 hover:border-[#005496] hover:shadow-md hover:-translate-y-0.5 hover:bg-white"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f0f7ff] flex items-center justify-center text-[#005496] group-hover:bg-[#005496] group-hover:text-white transition-all duration-300 flex-shrink-0">
                    <prog.icon size={20} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#1e293b] group-hover:text-[#005496] transition-colors truncate">{prog.name}</p>
                    <p className="text-[12px] text-[#94a3b8] font-medium mt-0.5">Mã ngành: {prog.code}</p>
                  </div>
                  <ChevronRight size={16} className="text-[#cbd5e1] group-hover:text-[#005496] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </motion.a>
              ))}
            </motion.div>
          )}

          {/* PhD Programs Grid */}
          {activeTab === 'phd' && (
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {PHD_PROGRAMS.map((prog, i) => (
                <motion.a
                  key={prog.code}
                  variants={fadeUp}
                  custom={i}
                  href={prog.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl transition-all duration-300 hover:border-[#005496] hover:shadow-md hover:-translate-y-0.5 hover:bg-white"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#fef3c7] flex items-center justify-center text-[#f59e0b] group-hover:bg-[#f59e0b] group-hover:text-white transition-all duration-300 flex-shrink-0">
                    <Award size={20} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#1e293b] group-hover:text-[#005496] transition-colors">Tiến sĩ {prog.name}</p>
                    <p className="text-[12px] text-[#94a3b8] font-medium mt-0.5">Mã ngành: {prog.code}</p>
                  </div>
                  <ChevronRight size={16} className="text-[#cbd5e1] group-hover:text-[#005496] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </motion.a>
              ))}
            </motion.div>
          )}

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
            className="text-center mt-10"
          >
            <a
              href="https://daotaosdh.ufm.edu.vn/DanhMucDieuKienXTDauVao.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#f0f7ff] text-[#005496] font-semibold text-[14px] rounded-full border border-[#005496]/20 hover:bg-[#005496] hover:text-white transition-all duration-300"
            >
              <FileText size={16} />
              Tra cứu điều kiện xét tuyển đầu vào
              <ArrowRight size={14} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CHAT PREVIEW SECTION ═══════════ */}
      <section className="py-20 bg-[#f8fafc] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-[28px] md:text-[36px] font-bold text-[#0f172a] tracking-tight mb-4">
              Tại sao chọn <span className="text-[#005496]">Tuyển sinh UFM?</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-[15px] md:text-[16px] text-[#64748b] max-w-xl mx-auto leading-relaxed">
              Trợ lý AI tuyển sinh được xây dựng chuyên biệt cho Viện SĐH, hiểu sâu các chương trình đào tạo và quy chế tuyển sinh — giúp bạn tiết kiệm thời gian tìm hiểu.
            </motion.p>
          </motion.div>

          {/* Chat features grid */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14"
          >
            {[
              { icon: Clock, title: 'Phản hồi tức thì 24/7', desc: 'Không cần chờ đợi giờ hành chính. Nhận câu trả lời ngay lập tức mọi lúc, giải đáp xuyên suốt ngày đêm.', gradient: 'from-[#005496] to-[#0ea5e9]' },
              { icon: Shield, title: 'Dữ liệu tin cậy', desc: 'Thông tin được cập nhật và kiểm duyệt trực tiếp từ Viện Đào tạo Sau Đại học — trường ĐH Tài chính - Marketing.', gradient: 'from-[#059669] to-[#34d399]' },
              { icon: Sparkles, title: 'AI thông minh', desc: 'Hiểu ngữ cảnh câu hỏi, gợi ý thông tin liên quan và hướng dẫn chi tiết từng bước chuẩn bị hồ sơ dự tuyển.', gradient: 'from-[#7c3aed] to-[#a78bfa]' },
            ].map((feat, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}
                className="group bg-white rounded-[24px] p-7 border border-[#e2e8f0] transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,84,150,0.1)] hover:border-[#005496]/20 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feat.icon size={22} className="text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-[17px] font-bold text-[#0f172a] mb-2">{feat.title}</h3>
                <p className="text-[14px] text-[#64748b] leading-[1.7]">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Chat Preview */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            variants={scaleIn}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-[#005496]/5 via-transparent to-[#eab308]/5 rounded-[36px] blur-xl" />
            <div className="relative bg-white rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,84,150,0.1),0_0_0_1px_rgba(0,84,150,0.04)] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-[#005496]">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-white border-2 border-white/20 flex items-center justify-center overflow-hidden">
                    <Image src="/images/ufm_chatbot.png" alt="Tuyển sinh UFM" width={36} height={36} className="w-full h-full object-cover" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#005496]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">Tuyển sinh UFM – Tư vấn Tuyển sinh SĐH</h3>
                    <p className="text-[12px] text-white/80 flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Trực tuyến • Viện Đào tạo Sau Đại học
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-8 min-h-[320px] bg-[#f8fafc]">
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-end"
                  >
                    <div className="flex items-end gap-2.5 max-w-[80%]">
                      <div className="bg-[#005496] text-white px-5 py-3.5 rounded-[20px] rounded-br-[6px] text-[15px] leading-relaxed shadow-sm">
                        Cho mình hỏi điều kiện xét tuyển Thạc sĩ ngành Tài chính - Ngân hàng và mức học phí hiện tại ạ?
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#cbd5e1] flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-[#64748b]" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="flex gap-2.5 max-w-[85%]"
                  >
                    <div className="w-9 h-9 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden mt-1">
                      <Image src="/images/ufm_chatbot.png" alt="UFM Bot" width={32} height={32} className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-white border border-[#e2e8f0] text-[#334155] px-5 py-4 rounded-[20px] rounded-bl-[6px] text-[15px] leading-[1.7] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                      {displayed}
                      {!done && (
                        <span className="inline-block w-[2px] h-4 mx-1 bg-[#005496] rounded-full align-middle" style={{ animation: 'ai-typing-cursor 0.8s ease infinite' }} />
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="px-6 py-4 bg-white border-t border-[#f1f5f9]">
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-full text-[13px] font-medium text-[#475569] whitespace-nowrap hover:border-[#005496]/40 hover:text-[#005496] hover:bg-[#f8fafc] transition-colors"
                    >
                      <s.icon size={15} className="text-[#005496]" />
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 py-5 bg-white border-t border-[#f1f5f9]">
                <div className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-full px-5 py-2.5">
                  <Plus size={20} className="text-[#94a3b8]" />
                  <input type="text" disabled placeholder="Nhập câu hỏi về tuyển sinh SĐH..." className="flex-1 bg-transparent border-none outline-none text-[15px] text-[#1e293b]" />
                  <Mic size={20} className="text-[#94a3b8] mr-2" />
                  <div className="w-10 h-10 rounded-full bg-[#005496] flex items-center justify-center text-white shadow-md">
                    <Send size={16} className="-ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ THÔNG TIN HỮU ÍCH ═══════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-[24px] md:text-[30px] font-bold text-[#0f172a] tracking-tight mb-3">
              Thông tin Hữu ích
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-[15px] text-[#64748b] max-w-lg mx-auto">
              Truy cập nhanh các cổng thông tin chính thức của Viện Đào tạo Sau Đại học và Trường ĐH Tài chính - Marketing.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {USEFUL_LINKS.map((link, i) => (
              <motion.a
                key={i}
                variants={slideRight}
                custom={i}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl transition-all duration-300 hover:border-[#005496] hover:shadow-md hover:-translate-y-0.5 hover:bg-white"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#f0f7ff] flex items-center justify-center text-[#005496] group-hover:bg-[#005496] group-hover:text-white transition-all duration-300 flex-shrink-0">
                    <link.icon size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1e293b] group-hover:text-[#005496] transition-colors">{link.label}</p>
                    <p className="text-[12px] text-[#94a3b8] font-normal mt-0.5">{link.desc}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#cbd5e1] group-hover:text-[#005496] group-hover:translate-x-1 transition-all flex-shrink-0" />
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CONTACT SECTION ═══════════ */}
      <section className="py-20 bg-[#f8fafc] border-t border-[#f1f5f9]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-[24px] md:text-[30px] font-bold text-[#0f172a] tracking-tight mb-3">
              Liên hệ Viện Đào tạo Sau Đại học
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-[15px] text-[#64748b] max-w-lg mx-auto">
              Trường Đại học Tài chính – Marketing (UFM)
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { icon: MapPin, label: 'Văn phòng', value: 'Phòng D.006, Số 778 Nguyễn Kiệm, P. Đức Nhuận, TP.HCM', color: '#005496' },
              { icon: Phone, label: 'Điện thoại', value: '(028) 3997 4641', color: '#059669' },
              { icon: Mail, label: 'Email', value: 'daotaosdh@ufm.edu.vn', color: '#7c3aed' },
              { icon: Globe, label: 'Website', value: 'daotaosdh.ufm.edu.vn', color: '#0284c7', href: 'https://daotaosdh.ufm.edu.vn' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#e2e8f0]/60"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}15`, color: item.color }}
                >
                  <item.icon size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wider mb-1">{item.label}</p>
                  {'href' in item && item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium text-[#005496] hover:underline">{item.value}</a>
                  ) : (
                    <p className="text-[14px] font-medium text-[#1e293b]">{item.value}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-[#005496]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#ffd200] rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0} className="text-[30px] md:text-[40px] font-bold text-white tracking-tight mb-6 leading-tight">
              Sẵn sàng nâng tầm sự nghiệp<br className="hidden md:block" /> cùng UFM?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-[16px] text-white/80 font-normal max-w-md mx-auto mb-10 leading-relaxed">
              Chatbot tư vấn tuyển sinh luôn sẵn sàng giải đáp mọi thắc mắc về chương trình Thạc sĩ & Tiến sĩ tại Viện Đào tạo Sau Đại học – UFM.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat/create"
                className="group inline-flex items-center justify-center gap-2.5 px-10 py-4 bg-[#ffd200] text-[#005496] rounded-full font-bold text-[16px] transition-all hover:bg-yellow-400 hover:shadow-lg hover:-translate-y-1"
              >
                <MessageCircle size={20} />
                <span>Trò chuyện ngay</span>
              </Link>
              <a
                href="https://daotaosdh.ufm.edu.vn/lien-he-tu-van"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white/10 backdrop-blur text-white rounded-full font-semibold text-[15px] border border-white/20 transition-all hover:bg-white/20 hover:-translate-y-0.5"
              >
                <Phone size={18} />
                Đăng ký tư vấn trực tiếp
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-[#0f172a] text-white/70 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[13px]">© 2026 Trường Đại học Tài chính - Marketing (UFM) · Viện Đào tạo Sau Đại học. Phát triển bởi <span className="text-[#3578E5] font-semibold">VinCode</span></p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes ai-typing-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
