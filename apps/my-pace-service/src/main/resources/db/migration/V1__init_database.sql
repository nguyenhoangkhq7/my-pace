-- ============================================================
-- MyPACE Database Schema (reviewed)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       full_name VARCHAR(255) NOT NULL,
                       role VARCHAR(20) NOT NULL DEFAULT 'USER',
                       wake_time TIME,
                       sleep_time TIME,
                       buffer_pct INT NOT NULL DEFAULT 20 CHECK (buffer_pct BETWEEN 10 AND 30),
                       timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
                       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Goal System
CREATE TABLE goals (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                       title VARCHAR(255) NOT NULL,
                       goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('Time-boxed', 'Milestone', 'Binary')),
    -- Freeze = mặc định lúc tạo, chưa tính vào giới hạn 5 Active.
    -- In Progress = đang Active, chiếm 1 trong tối đa 5 slot (rule enforce ở Service, không phải DB).
                       status VARCHAR(50) NOT NULL DEFAULT 'Freeze'
                           CHECK (status IN ('Freeze', 'In Progress', 'Done', 'Archived')),
                       start_date DATE,
                       end_date DATE,
                       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- Index hỗ trợ đếm nhanh số Goal đang Active của 1 user (rule giới hạn 5)
CREATE INDEX idx_goals_user_status ON goals(user_id, status);

-- Time-boxed Goal: chỉ tồn tại khi goals.goal_type = 'Time-boxed'
-- accumulated_minutes để runtime SUM(tasks.actual_minutes); không cache ở MVP
-- để tránh rủi ro lệch số khi task done/undone nhiều lần.
CREATE TABLE time_boxed_goals (
                                  goal_id UUID PRIMARY KEY REFERENCES goals(id) ON DELETE CASCADE,
                                  target_minutes INT NOT NULL CHECK (target_minutes > 0),
                                  period_days INT NOT NULL CHECK (period_days > 0)
);

-- Milestone Goal: chỉ tồn tại khi goals.goal_type = 'Milestone'
CREATE TABLE milestones (
                            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                            goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
                            title VARCHAR(255) NOT NULL,
                            sort_order INT NOT NULL DEFAULT 0,
                            is_done BOOLEAN NOT NULL DEFAULT FALSE,
                            done_at TIMESTAMPTZ,
                            CHECK ((is_done = TRUE AND done_at IS NOT NULL) OR (is_done = FALSE AND done_at IS NULL))
);

-- Binary Goal: không cần bảng riêng — dùng thẳng goals.status (In Progress / Done)

-- 3. Tasks
CREATE TABLE tasks (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                       goal_id UUID REFERENCES goals(id) ON DELETE RESTRICT, -- Ngăn xóa cứng Goal nếu còn Task; flow thật dùng archive (UPDATE status), không DELETE
    -- Lưu ý: DB không thể tự chặn việc gán task vào Goal đang Freeze.
    -- Rule "Goal Freeze không cho tạo/liên kết task" phải validate ở tầng Service
    -- trước khi INSERT (kiểm tra goals.status = 'In Progress' trước khi cho phép set goal_id).
                       title VARCHAR(255) NOT NULL,
                       estimated_minutes INT NOT NULL CHECK (estimated_minutes > 0),
                       actual_minutes INT NOT NULL DEFAULT 0 CHECK (actual_minutes >= 0),
                       quadrant VARCHAR(2) NOT NULL CHECK (quadrant IN ('Q1', 'Q2', 'Q3', 'Q4')),
                       status VARCHAR(50) NOT NULL DEFAULT 'Backlog'
                           CHECK (status IN ('Backlog', 'Picked for Today', 'Done')),
                       due_date DATE,
                       notes TEXT,
                       done_at TIMESTAMPTZ,
                       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       CHECK ((status = 'Done' AND done_at IS NOT NULL) OR (status != 'Done' AND done_at IS NULL))
);

-- 4. Planning Engine
CREATE TABLE daily_plans (
                             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                             user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             plan_date DATE NOT NULL,
                             available_minutes INT NOT NULL CHECK (available_minutes >= 0),
                             is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
                             confirmed_at TIMESTAMPTZ,
                             UNIQUE (user_id, plan_date), -- Bắt buộc: mỗi user chỉ có 1 bản plan duy nhất mỗi ngày
                             CHECK ((is_confirmed = TRUE AND confirmed_at IS NOT NULL) OR (is_confirmed = FALSE AND confirmed_at IS NULL))
);

CREATE TABLE daily_plan_tasks (
                                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                  daily_plan_id UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
                                  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                                  is_mit BOOLEAN NOT NULL DEFAULT FALSE,
                                  sort_order INT NOT NULL DEFAULT 0,
                                  scheduled_start_time TIME,
                                  scheduled_end_time TIME,
                                  UNIQUE (daily_plan_id, task_id), -- Bắt buộc: một task không thể bị gán 2 lần vào cùng 1 ngày
                                  CHECK (
                                      scheduled_start_time IS NULL
                                          OR scheduled_end_time IS NULL
                                          OR scheduled_end_time > scheduled_start_time
                                      )
    -- Lưu ý: rule "tối đa 3 task có is_mit = TRUE mỗi daily_plan_id" (MYP-27)
    -- KHÔNG thể enforce bằng CHECK constraint thường (cần đếm theo nhóm).
    -- Phải validate ở tầng Service trước khi INSERT/UPDATE.
);

CREATE TABLE fixed_events (
                              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                              title VARCHAR(255) NOT NULL,
                              event_date DATE,
                              start_time TIME NOT NULL,
                              end_time TIME NOT NULL,
                              recurrence_type VARCHAR(50) NOT NULL DEFAULT 'NONE'
                                  CHECK (recurrence_type IN ('NONE', 'DAILY', 'WEEKLY', 'CUSTOM')),
                              recurrence_rule TEXT,
                              recurrence_end_date DATE,
                              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                              CHECK (end_time > start_time),
    -- Event không lặp lại bắt buộc phải có ngày cụ thể;
    -- event lặp lại thì event_date là ngày bắt đầu chuỗi (có thể NULL nếu áp dụng ngay)
                              CHECK (recurrence_type != 'NONE' OR event_date IS NOT NULL)
);

-- 5. Tạo Indexes (Tối ưu hiệu năng truy vấn)
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX idx_daily_plans_user_date ON daily_plans(user_id, plan_date);
CREATE INDEX idx_daily_plan_tasks_plan_id ON daily_plan_tasks(daily_plan_id);
CREATE INDEX idx_fixed_events_user_id ON fixed_events(user_id);
CREATE INDEX idx_fixed_events_date ON fixed_events(event_date);