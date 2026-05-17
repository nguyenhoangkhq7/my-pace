CREATE TABLE users (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       full_name VARCHAR(100) NOT NULL,
                       email VARCHAR(191) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       role VARCHAR(20) DEFAULT 'USER',
                       is_locked BOOLEAN DEFAULT FALSE,
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

-- 4. Bảng Bảng (Boards)
CREATE TABLE boards (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        name VARCHAR(100) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Cột trong Bảng (Board Columns)
CREATE TABLE board_columns (
                               id INT AUTO_INCREMENT PRIMARY KEY,
                               board_id INT NOT NULL,
                               name VARCHAR(50) NOT NULL,
                               position INT DEFAULT 0 COMMENT 'Thứ tự sắp xếp từ trái sang phải',
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
                               INDEX idx_board_position (board_id, position)
) ENGINE=InnoDB;

-- 6. Danh sách Công việc (Tasks)
-- Đã tích hợp column_id và position, loại bỏ status
CREATE TABLE tasks (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       user_id INT NOT NULL,
                       column_id INT COMMENT 'Thay thế cho status bằng cách liên kết trực tiếp với cột của board',
                       position INT DEFAULT 0 COMMENT 'Vị trí của task trong cột',
                       context_id INT,
                       title VARCHAR(255) NOT NULL,
                       description TEXT,

    -- Logic năng lượng
                       energy_required INT DEFAULT 3 COMMENT 'Thang điểm 1-5',
                       impact_type VARCHAR(20) DEFAULT 'DRAIN',

    -- Ước tính & Thông tin thêm
                       estimated_minutes SMALLINT DEFAULT 30,
                       priority INT DEFAULT 1,
                       is_recurring BOOLEAN DEFAULT FALSE,
                       is_done BOOLEAN DEFAULT FALSE,
                       due_date DATETIME,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                       FOREIGN KEY (column_id) REFERENCES board_columns(id) ON DELETE SET NULL,
                       FOREIGN KEY (context_id) REFERENCES contexts(id) ON DELETE SET NULL,

    -- Index để load dữ liệu Board nhanh
                       INDEX idx_user_column (user_id, column_id)
) ENGINE=InnoDB;

-- 7. Quản lý quy luật lặp lại (Recurrence Rules)
CREATE TABLE task_recurrence (
                                 id INT AUTO_INCREMENT PRIMARY KEY,
                                 task_id INT NOT NULL,
                                 frequency VARCHAR(20) NOT NULL,
                                 days_of_week VARCHAR(20) COMMENT '0: Chủ nhật, 1-6: Thứ 2 đến Thứ 7',
                                 start_date DATE NOT NULL,
                                 repeat_until DATE NULL COMMENT 'Nếu NULL là lặp vô hạn',
                                 FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Nhật ký năng lượng (Check-ins)
CREATE TABLE energy_checkins (
                                 id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                 user_id INT NOT NULL,
                                 energy_level INT NOT NULL,
                                 alertness_level INT NOT NULL,
                                 note VARCHAR(255),
                                 recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Lịch trình thực tế (Time Blocks)
CREATE TABLE time_blocks (
                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                             user_id INT NOT NULL,
                             task_id INT NULL,
                             checkin_id BIGINT NULL,
                             block_type VARCHAR(20) NOT NULL,
                             is_locked BOOLEAN DEFAULT FALSE COMMENT 'TRUE: Không tự động dời lịch',
                             scheduled_start DATETIME NOT NULL,
                             scheduled_end DATETIME NOT NULL,
                             actual_start DATETIME NULL,
                             actual_end DATETIME NULL,
                             title_override VARCHAR(255),

                             FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                             FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                             FOREIGN KEY (checkin_id) REFERENCES energy_checkins(id) ON DELETE SET NULL,
                             INDEX idx_schedule (user_id, scheduled_start, scheduled_end)
) ENGINE=InnoDB;