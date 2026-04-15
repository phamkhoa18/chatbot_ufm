'use client';

import { useState, useEffect } from 'react';
import {
  Phone, Mail, Globe, BookOpen, Monitor,
  Search, Menu, X,
  MessageCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024 && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mobileOpen]);

  const NAV_LINKS = [
    { label: 'Trang chủ', href: '/chat' },
    { label: 'Tư vấn AI', href: '/chat/create' },
    { label: 'Quản trị', href: '/admin' },
  ];

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-[100] transition-all duration-300
        ${scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_12px_rgba(0,0,0,0.06)] border-b border-slate-200/60'
          : 'bg-white/80 backdrop-blur-md border-b border-slate-200/40'
        }
      `}
    >
      {/* ── Top Bar ── */}
      <div className="hidden md:block bg-[#003d73] text-white/90">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[32px]">
          <div className="flex items-center gap-5 text-[11px] font-medium">
            <a href="tel:02838225048" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone size={11} /> (028) 3822 5048
            </a>
            <a href="mailto:sdh@ufm.edu.vn" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail size={11} /> sdh@ufm.edu.vn
            </a>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <a href="https://ufm.edu.vn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Globe size={11} /> Cổng TTĐT
            </a>
            <span className="text-white/30">|</span>
            <a href="#" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <BookOpen size={11} /> Thư viện
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Header ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-[60px] md:h-[68px]">
          {/* Logo */}
          <Link href="/chat" className="flex items-center gap-3 group">
            <div className="w-[44px] h-[44px] md:w-[50px] md:h-[50px] flex-shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/images/logo_ufm_50nam_no_bg.png"
                alt="UFM"
                width={50}
                height={50}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-200" />
            <div className="hidden sm:flex flex-col">
              <span className="text-[13px] md:text-[14px] font-bold text-[#005496] leading-tight">
                Trường Đại học Tài chính - Marketing
              </span>
              <span className="text-[10px] md:text-[11px] font-medium text-slate-500 leading-tight">
                Viện Đào tạo Sau Đại học · AI Chatbot
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-[13px] font-semibold text-slate-600 rounded-lg hover:text-[#005496] hover:bg-[#005496]/5 transition-all"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2.5">
            <Link
              href="/chat/create"
              className="flex items-center gap-2 h-[38px] px-5 bg-[#005496] text-white text-[13px] font-bold rounded-full hover:bg-[#00427a] active:scale-[0.97] transition-all shadow-sm"
            >
              <MessageCircle size={15} />
              Tư vấn ngay
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/chat/create"
              className="flex items-center gap-1.5 h-[34px] px-3.5 bg-[#005496] text-white text-[12px] font-bold rounded-full hover:bg-[#00427a] transition-all"
            >
              <MessageCircle size={13} />
              Tư vấn
            </Link>
            <button
              className={`w-[38px] h-[38px] flex items-center justify-center rounded-lg transition-all ${
                mobileOpen ? 'bg-slate-100 text-[#005496]' : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Full-Screen Menu ── */}
      <div
        className={`
          fixed inset-0 top-[60px] bg-white/98 backdrop-blur-xl z-[90]
          transition-all duration-300 lg:hidden
          ${mobileOpen
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none -translate-y-4'
          }
        `}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-6 space-y-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center h-[52px] px-4 text-[16px] font-semibold text-slate-700 rounded-xl hover:bg-[#005496]/5 hover:text-[#005496] transition-all"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Bottom CTA */}
          <div className="p-6 border-t border-slate-100 space-y-3">
            <Link
              href="/chat/create"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 h-[48px] w-full bg-[#005496] text-white text-[15px] font-bold rounded-xl hover:bg-[#00427a] transition-all"
            >
              <MessageCircle size={18} />
              Bắt đầu Tư vấn Ngay
            </Link>
            <div className="flex items-center justify-center gap-4 text-[12px] text-slate-500 font-medium pt-2">
              <a href="tel:02838225048" className="flex items-center gap-1.5 hover:text-[#005496]">
                <Phone size={12} /> (028) 3822 5048
              </a>
              <span className="text-slate-300">|</span>
              <a href="mailto:sdh@ufm.edu.vn" className="flex items-center gap-1.5 hover:text-[#005496]">
                <Mail size={12} /> sdh@ufm.edu.vn
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
