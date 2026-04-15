import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
