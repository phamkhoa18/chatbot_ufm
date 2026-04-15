# UFM Tuyển Sinh Chatbot - Next.js Frontend

Dự án Frontend xây dựng hệ thống Chatbot Tuyển sinh và Quản trị CRM cho trường Đại học Tài chính - Marketing (UFM). 

Hệ thống được thiết kế theo phong cách UI hiện đại (tương tự như `uxui-taichinh`), tập trung vào trải nghiệm người dùng tối ưu và tốc độ phản hồi nhanh.

## Tính năng chính

### 1. Dành cho Sinh viên/Ứng viên
- Giao diện chat toàn màn hình hiển thị nội dung trực quan.
- **Truyền nội dung mượt (Streaming)**: Hỗ trợ stream SSE, gõ từng chữ giống ChatGPT.
- **Theo dõi khách hàng tiềm năng**: Form thu thập thông tin người dùng trước hoặc trong khi chat.
- Hiển thị tài liệu/nguồn tham khảo rõ ràng kèm đường dẫn tải/xem tài liệu.

### 2. Dành cho Admin / Quản trị viên
- **Thống kê tổng quan (`/admin`)**: Biểu đồ hoạt động, trạng thái khách hàng tiềm năng, lưu lượng chat hàng ngày.
- **Quản lý hội thoại (`/admin/lich-su-chat`)**: Tra cứu toàn bộ hội thoại của người dùng với hệ thống AI theo thời gian thực.
- **Quản lý Leads (`/admin/khach-hang-tiem-nang`)**: Lưu danh sách những người dùng tiềm năng (được AI đánh giá thông qua Chat).
- **RAG Document Management (`/admin/ai-chatbot`)**: Pipeline nạp tài liệu cho AI với luồng Pipeline chuyên dụng (Upload, Chia chunk, Re-ingest).

## Cấu trúc luồng chạy (Chat - Lead Pipeline)
1. User truy cập trang hiển thị modal thu thập thông tin (Tên, SĐT, Email).
2. Thông tin sẽ được liên kết trực tiếp với các phiên chat thông qua Session lưu trữ nội bộ.
3. Trong lúc chat, tin nhắn được hiển thị bằng tính năng Streaming thông qua SSE từ backend FastAPI.
4. Khi user đóng tab hoặc rời trang, hệ thống âm thầm (Silent Background POST) lưu toàn bộ phiên chat.
5. AI đánh giá phiên chat (Lead Analytics) từ 1-10 điểm. Hệ thống chỉ lưu người dùng vào CRM (Leads) nếu đạt điểm đánh giá.

## Stack Công nghệ
- **Framework**: Next.js 14+ (App Router).
- **Styling**: Tailwind CSS & Lucide React.
- **Animation**: Framer Motion & Custom Keyframes.
- **Database**: MongoDB (Mongoose).
- **AI Integration**: Tích hợp với `FASTAPI_URL` phía sau (Sử dụng SSE/Stream).

## Thiết lập và Chạy ứng dụng

### 1. Cài đặt Dependency
```bash
npm install
```

### 2. Cấu hình Biến môi trường (.env.local)
```env
MONGODB_URI=mongodb_của_bạn
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
# Các biến OPENROUTER Cần dùng đánh giá tiềm năng
OPENROUTER_API_KEY=your_openrouter_key
```

### 3. Chạy Server
```bash
npm run dev
# Mặc định ứng dụng sẽ chạy tại port 3000 -> http://localhost:3000
```
