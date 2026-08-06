# 🌐 My Pace — Web Application (Frontend)

Phân hệ Frontend cho ứng dụng **My Pace**, được xây dựng trên nền tảng Next.js 16 (App Router), React 19 và Tailwind CSS v4.

---

## 🛠️ Công nghệ & Thư viện

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Radix UI / shadcn/ui components
- **State Management:** Zustand
- **Calendar & Timeboxing:** FullCalendar v6
- **Icon Set:** Lucide React
- **Animations & Effects:** Canvas Confetti, Framer Motion

---

## 📂 Cấu trúc thư mục

```text
apps/web-app/
├── app/
│   ├── (auth)/             # Màn hình Đăng nhập / Đăng ký / Xác thực OTP
│   ├── (board)/            # Các màn hình chính (Today, Tomorrow, Flow, Goals, Stats, Calendar)
│   ├── api/                # Next.js API Routes Proxy (nếu có)
│   ├── globals.css         # Import Tailwind CSS v4 & theme variables
│   └── layout.tsx          # Root Layout & Providers
├── components/
│   ├── features/           # Components nghiệp vụ (Eisenhower Matrix, Flow Timer, Daily Plan, Goal Tree)
│   ├── layout/             # Sidebar, Navbar, Page Header
│   └── ui/                 # Atomic design UI primitives (Button, Dialog, Card, Input...)
├── features/               # Custom hooks & stores theo module
├── hooks/                  # Global Custom React Hooks
└── lib/                    # API Client, Axios Config & Utility functions
```

---

## 🚀 Khởi chạy ứng dụng

### 1. Cấu hình biến môi trường
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Ghi nội dung:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 2. Cài đặt dependencies & Chạy dev server
```bash
npm install
npm run dev
```

Ứng dụng sẽ hoạt động tại [http://localhost:3000](http://localhost:3000).

---

## 📝 Quy tắc phát triển Frontend (Clean Code Rules)

1. **Atomic Design & Single Responsibility:**
   - Component Container chỉ làm nhiệm vụ bố cục và điều phối state.
   - Các item lặp (`.map`) hoặc form inline (nhập text, Enter/Escape) phải được tách thành component con độc lập dưới 70 dòng.
2. **State Management:**
   - Dùng Zustand cho global states (User Session, Current Board Plan, Active Flow Task).
   - Dùng React local state cho UI transient states (modal visibility, inline edit value).
