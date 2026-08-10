# 💻 UFM AI Chatbot Frontend — Viện Đào Tạo Sau Đại Học UFM (Next.js 15)

Giao diện Web App AI Chatbot Tuyển sinh Sau đại học & Trang Quản trị CRM — Trường Đại học Tài chính - Marketing (UFM).

---

## 🌟 Tính Năng Nổi Bật
- **Giao diện Chatbot AI (Cô Thắm)**: Trải nghiệm nhắn tin mượt mà, hỗ trợ Token Streaming, hiệu ứng 3 chấm nảy sinh động.
- **Hệ thống Quản trị CRM (`/admin`)**:
  - Quản lý Khách hàng tiềm năng: Lọc từ khóa, trạng thái, điểm tiềm năng AI, lọc từ ngày - đến ngày, phân trang linh hoạt (10-100 dòng/trang) và xuất file Excel CSV chuẩn UTF-8 Tiếng Việt.
  - Quản lý Kho tri thức: Upload file Markdown/Docx, tự động phân tích Metadata và Reindex dữ liệu RAG.
  - Phân quyền & Quản lý Tài khoản: Tạo tài khoản cán bộ mới, đổi mật khẩu cá nhân có mã hóa JWT.
- **Giao diện Chuẩn shadcn/ui**: Thiết kế đồng bộ, hiện đại và phản hồi nhanh trên mọi thiết bị.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy 

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Cấu hình môi trường (`.env.local`)
Tạo file `.env.local`:
```env
NEXT_PUBLIC_FASTAPI_URL=https://chatbot-ufm-api.vincode.xyz
FASTAPI_URL=https://chatbot-ufm-api.vincode.xyz
NEXT_PUBLIC_API_KEY=ufm_cotham_api_key_2026
```

### 3. Chạy Môi Trường Development
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000`

### 4. Build Production
```bash
npm run build
npm run start
```

---

## 🛡️ License
Bản quyền thuộc về **Viện Đào Tạo Sau Đại Học — Trường Đại Học Tài Chính - Marketing (UFM)**.
