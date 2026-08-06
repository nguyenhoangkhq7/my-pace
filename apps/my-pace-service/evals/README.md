# Bộ Đánh Giá Tự Động Evals (Promptfoo) cho QuickAdd

Thư mục này chứa bộ đánh giá tự động (Evaluation Pipeline) phục vụ kiểm thử độ chính xác của API trích xuất thông tin **QuickAdd** (`POST /api/quick-add`).

---

## 1. Yêu cầu tiên quyết
- Backend Spring Boot (`my-pace-service`) đang được khởi chạy ở cổng **8080** (`http://localhost:8080`).
- Đã có Node.js (v18+) trên máy.

---

## 2. Cách chạy kiểm thử (Execution)

### Bước 1: Mở terminal tại thư mục này
```bash
cd apps/my-pace-service/evals
```

### Bước 2: Điền JWT Token vào file `.env`
Mở file `.env` trong thư mục `evals/` và dán JWT token thu được từ DevTools/Postman:
```env
JWT_TOKEN=eyJhbGciOiJKV1QiLCJhbGci...
```
*(Hoặc truyền qua biến môi trường khi chạy: `$env:JWT_TOKEN="your_token"; npx promptfoo@latest eval`)*

### Bước 2: Chạy kiểm thử tự động
```bash
npx promptfoo@latest eval
```
Promptfoo sẽ tự động gửi 12 câu lệnh kiểm thử trong Golden Dataset lên API và xuất bảng kết quả (Pass / Fail) ngay trên Terminal.

### Bước 3: Xem báo cáo trực quan trên trình duyệt (Web UI Dashboard)
```bash
npx promptfoo@latest view
```
Lệnh này sẽ mở trình duyệt hiển thị giao diện báo cáo chi tiết:
- Tỷ lệ Pass/Fail theo từng câu lệnh.
- Thời gian phản hồi (Latency) của API cho mỗi kịch bản.
- Giá trị JSON thực tế mà API trả về so với giá trị mong đợi (Expected Output).

---

## 3. Cách thêm Test Case mới
Mở file `promptfooconfig.yaml`, bổ sung đối tượng test case vào mảng `tests`:

```yaml
  - vars:
      text: "câu lệnh nhập liệu mới của người dùng"
    assert:
      - type: select-json
        value: "type"
        expected: "task" # hoặc "event"
      - type: select-json
        value: "startTime"
        expected: "14:00"
```
