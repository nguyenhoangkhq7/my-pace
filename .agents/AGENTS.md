# My Pace Project Rules & Context

This file contains the workspace configuration, technology stack details, and coding guidelines for the **My Pace** project. Any AI agent assisting in this workspace should read and adhere to these guidelines to understand the project architecture and work correctly.

---

## 1. Project Overview & Architecture
**My Pace** is a Timeboxing and Daily Planning productivity application. It is structured as a monorepo containing a Next.js frontend and a Spring Boot backend, orchestrated with Docker Compose.

```text
my-pace-app/
├── apps/
│   ├── web-app/            # Frontend (Next.js 16, React 19, Zustand, Tailwind v4)
│   └── my-pace-service/    # Backend (Spring Boot 4.x, Java 21, PostgreSQL)
├── docker-compose.yml      # Docker orchestrator
└── .env                    # Local environment variables
```

### Frontend (`apps/web-app`)
- **Core:** Next.js 16 (App Router), React 19, TypeScript
- **Styling & UI:** Tailwind CSS v4, shadcn/ui components (`components/ui`)
- **State Management:** Zustand
- **Architecture:** 
  - `app/(board)`: Main application routes and page layouts (`calendar`, `flow`, `goals`, `stats`).
  - `components/layout/`: Global layout components.
  - `components/features/`: Core feature components for timeboxing and daily planning.

### Backend (`apps/my-pace-service`)
- **Core:** Spring Boot 4.x, Java 21, Maven
- **Database & Caching:** Spring Data JPA (PostgreSQL), Spring ConcurrentMapCache
- **Authentication:** JWT (`jjwt`)
- **Package Structure (`nhk`):**
  - `auth`, `user`: Security, auth, user profiles.
  - `calendar`: Fixed events, daily check-ins, available time calculation.
  - `category`, `goal`: Goal and category management.
  - `planning`, `scheduling`: Task planning and auto-scheduling algorithms.
  - `task`, `timeblock`: Task management and time boxing slots.
  - `timecontext`: Timezone safety and context.

---

## 2. FRONTEND STRICT CLEAN CODE CONSTRAINTS

Mọi Agent khi làm việc với UI components (tạo mới hoặc refactor) phải coi mình là **chuyên gia kiến trúc frontend**, áp dụng triệt để tư duy **"Atomic Design"** và **"Single Responsibility Principle"**:

1. **Component Cha (Container / Layout):**
   - Chỉ đóng vai trò bố cục (Structural Grid/Flex) và điều phối các State dùng chung.
   - **Tuyệt đối không** chứa logic UI chi tiết hay xử lý sự kiện cá nhân của component con.
2. **Component Con (Item / Atom):**
   - Toàn bộ UI lặp (ví dụ: vòng lặp `.map`) **PHẢI** được tách thành một Component riêng biệt (VD: `TaskItem`, `UserRow`, `ColumnCard`).
   - Component này tự quản lý logic tương tác nội bộ của nó (hover, active) hoặc nhận callback từ cha.
3. **Component Input / Form inline:**
   - Bất kỳ phần tạo mới hoặc chỉnh sửa dạng inline nào (nhập text, bắt phím Enter/Escape, quản lý state input tạm thời) **PHẢI** bóc tách hoàn toàn thành một component độc lập riêng (VD: `InlineTaskInput`).
4. **Clean Code & Reusability:**
   - Giữ cho các file sau khi chia nhỏ có độ dài tối giản (**thường dưới 50-70 dòng**) và cực kỳ dễ đọc.
   - Nếu có logic state/business phức tạp, phải tách ra custom hook (VD: `useBacklogMatrix`).
   - Tối đa hóa tái sử dụng từ `components/ui/` (shadcn/ui).
   - Dựa vào React 19 Compiler để tối ưu memoization, hạn chế `useMemo`/`useCallback` thủ công trừ khi có profile hiệu năng rõ ràng.

---

## 3. CORE DOMAIN RULES & BACKEND GUIDELINES

### Security & Authentication
- **UUID:** User IDs phải luôn là `UUID` trên cả DB (PostgreSQL) và Java backend để tránh sai lệch.
- **Logout Flow:** 
  - *Client:* Gọi `POST /api/auth/logout`, clear session Zustand, redirect về `/login`.
  - *Server:* Không dùng blacklist lưu JWT trên server. Client tự xóa token và đăng xuất.

### Goals & Work Breakdown Structure
- **Flat Architecture (3 Cấp):** `Milestone (Goal) -> Task -> Checklist`. Lưu phẳng trong DB, nhưng frontend build thành Tree View để dễ nhìn.
- **Daily Pick:** Task nằm ở Backlog -> Chọn vào kế hoạch hằng ngày (Ma trận Eisenhower).

### Fixed Events & Calendar
- **FullCalendar v6:** Dùng trên Frontend. Backend giải nén các sự kiện định kỳ (recurring events) thành các object phẳng theo khoảng thời gian request.
- **Timezone Safety:** Mọi tính toán liên quan đến `LocalTime.now()` hoặc boundary phải gắn với Timezone của User (`ZoneId.of(user.getTimezone())`), không được dùng UTC mặc định của container.

### Available Time & Daily Check-in
- **Union-Interval Engine:** Tính Available Time bằng việc gộp (union) các sự kiện cố định trùng lặp để không trừ thời gian hai lần.
- **Auto Check-in & Freeze:** Khóa thời điểm check-in (frozen) ngay lần mở app đầu tiên trong ngày. Mở hook Next.js `useAppVisibility` chạy ngầm.
- **+15m Buffer:** Lên lịch ngày hôm nay tính từ `Hiện tại + 15 phút`. Ngày mai tính từ `Giờ thức dậy + 15 phút`. Tách biệt State `dataToday` và `dataTomorrow`.

### Timeboxing & Daily Lifecycle
- **Auto-Schedule:** Thuật toán xử lý tập trung hoàn toàn ở Backend (`AutoScheduleServiceImpl` kết hợp `InMemoryBitmapScheduler` và `TaskPriorityScorer`), ưu tiên Q1 > Q2 > Q3 > Q4. Chia khối tối thiểu 30 phút. Bỏ qua gap < 30 phút. Client gọi API.
- **Execution Mode (isConfirmed):** Khi đã chốt lịch, khóa UI (ẩn nút thêm/sửa/xóa task).
- **Read-Only Board:** Tab "Hôm nay" chỉ đọc. Việc hoàn thành task phải đi qua tab "Flow" để tận hưởng màn hình ăn mừng khi xong hết việc.
- **Backend Coding:** Controller mỏng, đẩy logic vào Service. Dùng MapStruct mapper và Lombok boilerplate. Dùng `@RequiredArgsConstructor`.
- **Environment:** Không dùng file `.env` chung ở root. Mỗi app có `.env` riêng (e.g. `apps/web-app/.env`).
