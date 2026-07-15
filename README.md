# My Pace - Lập kế hoạch Timeboxing & Eisenhower

**My Pace** là ứng dụng hỗ trợ lập kế hoạch hàng ngày và quản lý thời gian cá nhân. Ứng dụng kết hợp phương pháp **Timeboxing** (chia ngày thành các khối thời gian cố định) và **Ma trận quyết định Eisenhower** (phân loại nhiệm vụ theo độ khẩn cấp/quan trọng) giúp người dùng quản lý thời gian khoa học, tăng cường sự tập trung và giảm thiểu sự trì hoãn.

Dự án được cấu trúc dạng Monorepo tích hợp đầy đủ cả Frontend (Next.js) và Backend (Spring Boot), khởi chạy nhanh chóng thông qua Docker Compose.

---

## 🔍 Mô tả chi tiết các phân hệ của dự án

### 1. Phân loại Backlog & Ma trận Eisenhower
* Người dùng tạo các nhiệm vụ và lưu trữ trong Backlog.
* Hệ thống hỗ trợ phân loại trực quan nhiệm vụ vào 4 ô phần tư:
  * **Q1 (Do First)**: Việc khẩn cấp & quan trọng (Cần làm ngay).
  * **Q2 (Schedule)**: Việc quan trọng nhưng không khẩn cấp (Lên kế hoạch thực hiện).
  * **Q3 (Delegate)**: Việc khẩn cấp nhưng không quan trọng (Ủy quyền hoặc giải quyết nhanh).
  * **Q4 (Eliminate)**: Việc không khẩn cấp & không quan trọng (Hạn chế thực hiện).

### 2. Tính toán thời gian trống thông minh (Available Time)
* Người dùng thiết lập lịch sinh hoạt (Giờ thức dậy, Giờ đi ngủ) và các sự kiện cố định trong ngày (Lịch họp, Lịch học, Hẹn gặp).
* Bộ lọc thuật toán ở Backend (`Union-Interval Engine`) sẽ tính toán tự động: gộp các khoảng thời gian cố định trùng lặp để xác định chính xác quỹ thời gian trống thực tế trong ngày (`Available Time`), giúp người dùng không lên lịch quá tải.

### 3. Đóng gói thời gian (Timeboxing)
* Người dùng kéo thả hoặc lựa chọn các công việc từ Backlog để lấp đầy quỹ thời gian trống.
* Hệ thống hỗ trợ thuật toán gợi ý sắp xếp lịch trình tự động (Auto-Schedule) dựa trên thứ tự ưu tiên của Ma trận Eisenhower với khoảng thời gian đệm hợp lý (+15 phút).

### 4. Chế độ thực thi & Luồng tập trung (Execution Mode & Flow)
* Khi đã chốt lịch trình của ngày, hệ thống sẽ khóa toàn bộ tính năng chỉnh sửa (`Execution Mode`) để tránh gây phân tâm.
* Người dùng chuyển sang màn hình **Flow** để thực thi nhiệm vụ với đồng hồ đếm ngược và chỉ tập trung vào duy nhất một công việc tại một thời điểm. Màn hình chúc mừng sẽ hiển thị sau khi hoàn thành toàn bộ công việc trong ngày.

---

## 🏗️ Cấu trúc thư mục dự án

```text
my-pace-app/
├── apps/
│   ├── web-app/            # Frontend (Next.js 16, React 19, Zustand, Tailwind v4)
│   └── my-pace-service/    # Backend (Spring Boot 4.x, Java 21, PostgreSQL, Redis)
├── docker-compose.yml      # Khởi chạy toàn bộ cơ sở dữ liệu và các ứng dụng
└── .env.example            # Ghi chú biến môi trường (cấu hình riêng cho từng ứng dụng)
```

---

## 💻 Hướng dẫn khởi chạy dự án (bằng Docker)

Yêu cầu duy nhất: Máy đã cài đặt **Docker** và **Docker Compose**.

### Bước 1: Chuẩn bị biến môi trường (.env)
1. Cấu hình biến môi trường Backend:
   * Copy file `apps/my-pace-service/.env.example` thành `apps/my-pace-service/.env`.
   * Điền giá trị `JWT_SECRET` (khóa ngẫu nhiên tối thiểu 256-bit) và `RESEND_API_KEY` (để gửi OTP qua mail).
2. Cấu hình biến môi trường Frontend:
   * Copy file `apps/web-app/.env.example` thành `apps/web-app/.env`.

### Bước 2: Khởi chạy toàn bộ hệ thống
Chạy lệnh sau tại thư mục gốc của dự án:
```bash
docker compose up --build -d
```
Hệ thống sẽ tự động tải các base image, build ảnh Docker cho Backend và Frontend, sau đó khởi chạy tất cả các dịch vụ (Database, Redis, API, Web).

### Bước 3: Truy cập ứng dụng
* **Frontend Web App**: `http://localhost:3000`
* **Backend API**: `http://localhost:8080`

### Dừng hệ thống
Để tắt tất cả các dịch vụ đang chạy:
```bash
docker compose down
```
