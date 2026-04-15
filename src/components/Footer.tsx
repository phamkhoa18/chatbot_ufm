'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin, Phone, Mail, Globe,
  ArrowRight, Heart, ChevronUp, MessageCircle, Send,
  BookOpen, GraduationCap, FileText,
} from 'lucide-react';
import { useState, useEffect } from 'react';

/* ── Custom Social SVG Icons (removed from lucide-react v0.396+) ── */
const IconFacebook = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const IconYoutube = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
    <path d="m10 15 5-3-5-3z"/>
  </svg>
);
const IconLinkedin = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const QUICK_LINKS = [
  { label: 'Trang chủ', href: '/chat' },
  { label: 'Tư vấn Chatbot AI', href: '/chat/create' },
  { label: 'Viện Đào tạo SĐH', href: 'https://daotaosdh.ufm.edu.vn' },
  { label: 'Tuyển sinh Thạc sĩ', href: 'https://daotaosdh.ufm.edu.vn/ChiTiet.aspx?LoaiTin=v1UjoAIA40d2Nl0tc5EwAA' },
  { label: 'Tuyển sinh Tiến sĩ', href: 'https://daotaosdh.ufm.edu.vn/ChiTiet.aspx?LoaiTin=ffBwKFG43zUj-wnVkKHUNg' },
  { label: 'Tra cứu điều kiện xét tuyển', href: 'https://daotaosdh.ufm.edu.vn/DanhMucDieuKienXTDauVao.aspx' },
];

const PROGRAMS = [
  { label: 'Tài chính – Ngân hàng', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=TCNH' },
  { label: 'Quản trị Kinh doanh', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=QTKD' },
  { label: 'Kế toán', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=KT' },
  { label: 'Luật Kinh tế', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=LKT' },
  { label: 'Marketing', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=MKT' },
  { label: 'Kinh doanh Quốc tế', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=KDQT' },
  { label: 'Kinh tế học', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=KTH' },
  { label: 'Quản lý Kinh tế', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=QLKT' },
  { label: 'Toán Kinh tế', href: 'https://daotaosdh.ufm.edu.vn/ChiTietNganh.aspx?id=TKT' },
];

const RESOURCES = [
  { label: 'Cổng thông tin UFM', href: 'https://ufm.edu.vn' },
  { label: 'Thư viện số', href: 'https://thuvien.ufm.edu.vn/' },
  { label: 'Tra cứu văn bằng', href: 'https://uis.ufm.edu.vn/TraCuuVanBang' },
  { label: 'Đăng ký lớp ngắn hạn', href: 'https://daotaosdh.ufm.edu.vn/dang-ky-lop-ngan-han' },
  { label: 'Bổ sung kiến thức', href: 'https://daotaosdh.ufm.edu.vn/ChiTiet.aspx?LoaiTin=glX2NKa0JIahgGgISLvpuw' },
  { label: 'SĐH Portal (Học viên)', href: 'https://daotaosdh.ufm.edu.vn/Login.aspx' },
];

const CONTACTS = [
  { label: 'Phòng D.006, Số 778 Nguyễn Kiệm, P. Đức Nhuận, TP.HCM', href: 'https://maps.google.com/?q=778+Nguyen+Kiem+TP.HCM', icon: MapPin },
  { label: '(028) 3997 4641', href: 'tel:02839974641', icon: Phone },
  { label: 'daotaosdh@ufm.edu.vn', href: 'mailto:daotaosdh@ufm.edu.vn', icon: Mail },
  { label: 'daotaosdh.ufm.edu.vn', href: 'https://daotaosdh.ufm.edu.vn', icon: Globe },
];

const SOCIALS = [
  { platform: 'Facebook', icon: IconFacebook, href: 'https://www.facebook.com/ufm.edu.vn' },
  { platform: 'YouTube', icon: IconYoutube, href: 'https://www.youtube.com/@UFMChannel' },
  { platform: 'LinkedIn', icon: IconLinkedin, href: 'https://www.linkedin.com/school/ufm/' },
];

export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-[#0c1829] text-white/80 relative">
      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* Brand Column */}
          <div className="lg:col-span-3">
            <Link href="/chat" className="flex items-center gap-3 group mb-5">
              <div className="w-[48px] h-[48px] flex-shrink-0 bg-white/10 rounded-xl p-1.5">
                <Image
                  src="/images/logo_ufm_50nam_no_bg.png"
                  alt="UFM"
                  width={42}
                  height={42}
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-white leading-tight">ĐH Tài chính - Marketing</span>
                <span className="text-[10px] font-medium text-white/50 leading-tight">Viện Đào tạo Sau Đại học</span>
              </div>
            </Link>
            <p className="text-[13px] text-white/50 leading-[1.7] mb-5 max-w-[280px]">
              Viện Đào tạo Sau Đại học – Trường ĐH Tài chính – Marketing (UFM) đào tạo 9 ngành Thạc sĩ và 3 ngành Tiến sĩ thuộc lĩnh vực kinh tế, tài chính, quản trị & luật.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-2 mb-6">
              {SOCIALS.map((s) => (
                <a
                  key={s.platform}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/60 hover:bg-[#005496] hover:text-white transition-all duration-200"
                  aria-label={s.platform}
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/chat/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#005496] hover:bg-[#00427a] text-white text-[13px] font-bold rounded-full transition-all shadow-md shadow-[#005496]/20"
            >
              <MessageCircle size={15} />
              Tư vấn tuyển sinh
            </Link>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-2">
            <h4 className="text-[13px] font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-5 h-px bg-[#005496]" />
              Liên kết nhanh
            </h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : '_self'}
                    className="flex items-center gap-2 text-[13px] text-white/50 font-medium hover:text-white hover:translate-x-1 transition-all duration-200"
                  >
                    <ArrowRight size={12} className="flex-shrink-0 text-[#005496]" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs Column */}
          <div className="lg:col-span-2">
            <h4 className="text-[13px] font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-5 h-px bg-[#005496]" />
              Ngành Thạc sĩ
            </h4>
            <ul className="space-y-2.5">
              {PROGRAMS.map((prog, i) => (
                <li key={i}>
                  <a
                    href={prog.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[13px] text-white/50 font-medium hover:text-white hover:translate-x-1 transition-all duration-200"
                  >
                    <ArrowRight size={12} className="flex-shrink-0 text-[#005496]" />
                    {prog.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div className="lg:col-span-2">
            <h4 className="text-[13px] font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-5 h-px bg-[#005496]" />
              Tài nguyên
            </h4>
            <ul className="space-y-2.5">
              {RESOURCES.map((res, i) => (
                <li key={i}>
                  <a
                    href={res.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[13px] text-white/50 font-medium hover:text-white hover:translate-x-1 transition-all duration-200"
                  >
                    <ArrowRight size={12} className="flex-shrink-0 text-[#005496]" />
                    {res.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-3">
            <h4 className="text-[13px] font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-5 h-px bg-[#005496]" />
              Liên hệ Viện SĐH
            </h4>
            <ul className="space-y-3.5">
              {CONTACTS.map((item, i) => (
                <li key={i}>
                  <a
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : '_self'}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-start gap-2.5 text-[13px] text-white/50 font-medium hover:text-white transition-colors"
                  >
                    <item.icon size={14} className="flex-shrink-0 mt-0.5 text-[#005496]" />
                    <span className="leading-[1.6]">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>

            {/* Tư vấn CTA */}
            <div className="mt-6 p-4 bg-white/[0.04] rounded-xl border border-white/[0.06]">
              <p className="text-[12px] text-white/60 mb-3 leading-relaxed">
                Để lại thông tin để được đội ngũ tư vấn hỗ trợ chi tiết về lộ trình học tập.
              </p>
              <a
                href="https://daotaosdh.ufm.edu.vn/lien-he-tu-van"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#005496]/30 hover:bg-[#005496]/50 text-white/90 text-[12px] font-semibold rounded-lg transition-all"
              >
                <Send size={12} />
                Đăng ký tư vấn trực tiếp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/40 font-medium text-center md:text-left">
            © 2026 Trường Đại học Tài chính - Marketing (UFM) · Viện Đào tạo Sau Đại học. Tất cả quyền được bảo lưu.
          </p>
          <p className="text-[12px] text-white/30 font-medium flex items-center gap-1">
            Thiết kế với <Heart size={11} className="text-rose-400 fill-rose-400" /> bởi{' '}
            <span className="text-[#3578E5] font-semibold">VinCode</span>
          </p>
        </div>
      </div>

      {/* ── Scroll to Top ── */}
      <button
        className={`
          fixed bottom-20 right-5 z-[50] w-10 h-10 rounded-full
          bg-white shadow-[0_2px_16px_rgba(0,0,0,0.1)] border border-slate-200
          flex items-center justify-center text-slate-500 hover:text-[#005496] hover:border-[#005496]/30
          transition-all duration-300
          ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
        onClick={scrollToTop}
        aria-label="Lên đầu trang"
      >
        <ChevronUp size={20} />
      </button>
    </footer>
  );
}
