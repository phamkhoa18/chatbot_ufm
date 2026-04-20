import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cô Thắm Tuyển sinh - Viện Đào tạo Sau Đại học UFM',
  description: 'Trò chuyện cùng Cô Thắm Tuyển sinh - Trợ lý AI tư vấn tuyển sinh Thạc sĩ, Tiến sĩ tại Viện Đào tạo Sau Đại học, Đại học Tài chính - Marketing (UFM).',
  openGraph: {
    title: 'Cô Thắm Tuyển sinh - Viện Đào tạo Sau Đại học UFM',
    description: 'Trò chuyện trực tiếp cùng Cô Thắm Tuyển sinh để giải đáp mọi thắc mắc về tuyển sinh dễ dàng và nhanh chóng.',
  }
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {/* Padding top to offset fixed header: top-bar(32) + main(68) = 100px on desktop, 60px on mobile */}
      <div className="pt-[60px] md:pt-[100px]">
        {children}
      </div>
      <Footer />
    </>
  );
}
