import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import GlobalChatbotWrapper from "@/components/GlobalChatbotWrapper";

export const metadata: Metadata = {
  metadataBase: new URL("https://daotaosdh.ufm.edu.vn"),
  title: {
    default: "Hệ thống Tư vấn Tuyển sinh SĐH – UFM",
    template: "%s | Trợ lý AI – UFM",
  },
  description:
    "Trợ lý ảo AI tư vấn tuyển sinh Thạc sĩ, Tiến sĩ tại Viện Đào tạo Sau Đại học – Đại học Tài chính – Marketing (UFM).",
  keywords:
    "tuyển sinh ufm, viện sau đại học UFM, thạc sĩ tài chính, tiến sĩ quản trị kinh doanh, tuyển sinh sau đại học, AI tư vấn tuyển sinh",
  authors: [{ name: "Viện Đào tạo Sau Đại học – UFM" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Hệ thống AI Chatbot – UFM",
    title: "Trợ lý ảo AI – Viện Đào tạo Sau Đại học UFM",
    description: "Nhắn tin trực tiếp với AI để nhận thông tin tuyển sinh, học phí, và lộ trình đào tạo nhanh chóng.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {children}
        <GlobalChatbotWrapper />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
