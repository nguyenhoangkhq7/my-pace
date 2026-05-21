CREATE TABLE users (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       full_name VARCHAR(100) NOT NULL,
                       email VARCHAR(191) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       role VARCHAR(20) DEFAULT 'USER',
                       is_locked BOOLEAN DEFAULT FALSE,
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            name VARCHAR(100) NOT NULL,
                            preferred_start_time TIME NULL,
                            preferred_end_time TIME NULL,

                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            INDEX idx_user_category (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tasks (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       user_id INT NOT NULL,
                       category_id INT NULL,
                       parent_id INT NULL,
                       title VARCHAR(255) NOT NULL,
                       position DOUBLE DEFAULT 65536.0,
                       status VARCHAR(20) DEFAULT 'TODO',
                       is_done BOOLEAN DEFAULT FALSE,
                        is_important BOOLEAN DEFAULT FALSE,

                        energy_required TINYINT NOT NULL DEFAULT 2 COMMENT '1: LOW, 2: MEDIUM, 3: HIGH',
                       estimated_minutes SMALLINT,
                       due_date DATETIME NULL,
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                       FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                       FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE,

                       INDEX idx_user_todo_deadline (user_id, is_done, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE task_details (
                              task_id INT PRIMARY KEY,
                              description TEXT NULL,
                              attachments_json TEXT NULL,
                              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                              FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE scheduled_tasks (
                                 id INT AUTO_INCREMENT PRIMARY KEY,
                                 user_id INT NOT NULL,
                                 task_id INT NOT NULL,
                                 start_time DATETIME NOT NULL,
                                 end_time DATETIME NOT NULL,
                                 date_applied DATE NOT NULL,
                                 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                 FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE events (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        start_at DATETIME NOT NULL,
                        end_at DATETIME NOT NULL,
                        is_recurring BOOLEAN DEFAULT FALSE,
                        recurrence_rule VARCHAR(255) NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recurrence_events (
                                   id INT AUTO_INCREMENT PRIMARY KEY,
                                   user_id INT NOT NULL,
                                   event_id INT NOT NULL,
                                   start_at DATETIME NOT NULL,
                                   end_at DATETIME NOT NULL,
                                   is_cancelled BOOLEAN DEFAULT FALSE,
                                   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                   FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                                   INDEX idx_user_recurrence_range (user_id, start_at, end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE energy_checkins (
                                 id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                 user_id INT NOT NULL,
                                 energy_level INT NOT NULL,
                                 note VARCHAR(255) NULL,
                                 recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                 INDEX idx_user_energy_time (user_id, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;