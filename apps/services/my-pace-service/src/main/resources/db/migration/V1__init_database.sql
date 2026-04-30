CREATE DATABASE IF NOT EXISTS my_pace_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE my_pace_db;

-- 1. Bảng Người dùng
CREATE TABLE users (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       username VARCHAR(50) NOT NULL,
                       email VARCHAR(191) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Cấu hình năng lượng cá nhân (Nhịp sinh học)
CREATE TABLE energy_profiles (
                                 id INT AUTO_INCREMENT PRIMARY KEY,
                                 user_id INT NOT NULL,
                                   peak_start_time TIME COMMENT 'Giờ bắt đầu khung giờ vàng',
                                 peak_end_time TIME COMMENT 'Giờ kết thúc khung giờ vàng',
                                 default_buffer_minutes INT DEFAULT 15,
                                 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Ngữ cảnh công việc (Context Batching)
CREATE TABLE contexts (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          user_id INT NOT NULL,
                          name VARCHAR(50) NOT NULL,
                          color_code VARCHAR(7) DEFAULT '#3498db',
                          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Danh sách Công việc (Tasks)
CREATE TABLE tasks (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       user_id INT NOT NULL,
                       context_id INT,
                       title VARCHAR(255) NOT NULL,
                       description TEXT,

    -- Logic năng lượng
                       energy_required INT NOT NULL DEFAULT 3 COMMENT 'Thang điểm 1-5',
                        impact_type VARCHAR(20) DEFAULT 'DRAIN',

    -- Ước tính & Trạng thái
                       estimated_minutes SMALLINT DEFAULT 30,
                       priority INT DEFAULT 1,
                        status VARCHAR(20) DEFAULT 'todo',

    -- Cờ đánh dấu lặp lại
                       is_recurring BOOLEAN DEFAULT FALSE,

                       due_date DATETIME,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                       FOREIGN KEY (context_id) REFERENCES contexts(id) ON DELETE SET NULL,
                       INDEX idx_task_status (user_id, status)
) ENGINE=InnoDB;

-- 5. Quản lý quy luật lặp lại (Recurrence Rules)
CREATE TABLE task_recurrence (
                                 id INT AUTO_INCREMENT PRIMARY KEY,
                                 task_id INT NOT NULL,

    -- Quy luật: daily, weekly, monthly
                                  frequency VARCHAR(20) NOT NULL,

    -- Lưu các thứ trong tuần (ví dụ: "1,3,5" cho Thứ 2, 4, 6)
    -- "0" là Chủ nhật, "1-6" là Thứ 2 đến Thứ 7
                                 days_of_week VARCHAR(20),

    -- Thời điểm bắt đầu và kết thúc quy luật
                                 start_date DATE NOT NULL,
                                 repeat_until DATE NULL COMMENT 'Nếu NULL là lặp vô hạn',

                                 FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Nhật ký năng lượng (Check-ins)
CREATE TABLE energy_checkins (
                                 id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                 user_id INT NOT NULL,
                                 energy_level INT NOT NULL,
                                 alertness_level INT NOT NULL,
                                 note VARCHAR(255),
                                 recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Lịch trình thực tế (Time Blocks)
CREATE TABLE time_blocks (
                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                             user_id INT NOT NULL,
                             task_id INT NULL,
                             checkin_id BIGINT NULL,

    -- Phân loại & Khóa lịch
                              block_type VARCHAR(20) NOT NULL,
                             is_locked BOOLEAN DEFAULT FALSE COMMENT 'TRUE: Không tự động dời lịch',

    -- Thời gian kế hoạch và thực tế
                             scheduled_start DATETIME NOT NULL,
                             scheduled_end DATETIME NOT NULL,
                             actual_start DATETIME NULL,
                             actual_end DATETIME NULL,

    -- Tiêu đề hiển thị (dùng khi task_id NULL hoặc muốn ghi đè tên)
                             title_override VARCHAR(255),

                             FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                             FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                             FOREIGN KEY (checkin_id) REFERENCES energy_checkins(id) ON DELETE SET NULL,

                             INDEX idx_schedule (user_id, scheduled_start, scheduled_end)
) ENGINE=InnoDB;

CREATE TABLE boards (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        name VARCHAR(100) NOT NULL,
                        color_code VARCHAR(7) DEFAULT '#1d2125' COMMENT 'Màu nền hoặc chủ đề của board',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE board_columns (
                         id INT AUTO_INCREMENT PRIMARY KEY,
                         board_id INT NOT NULL,
                         name VARCHAR(50) NOT NULL,
                         position INT DEFAULT 0 COMMENT 'Thứ tự sắp xếp từ trái sang phải',
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
                         INDEX idx_board_position (board_id, position)
) ENGINE=InnoDB;

ALTER TABLE tasks
    DROP COLUMN status, -- Loại bỏ enum cũ để dùng column_id
    ADD COLUMN column_id INT AFTER user_id,
    ADD COLUMN position INT DEFAULT 0 AFTER column_id,
    ADD FOREIGN KEY (column_id) REFERENCES board_columns(id) ON DELETE SET NULL;

-- Index bổ sung để load Board cực nhanh
CREATE INDEX idx_user_column ON tasks (user_id, column_id);
