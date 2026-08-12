-- =====================================================
-- V39: Add time_logs table for granular time tracking
-- =====================================================

-- 1. Create time_logs table
CREATE TABLE time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_block_id UUID REFERENCES task_time_blocks(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    logged_minutes INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_time_logs_time_block_id ON time_logs(time_block_id);
CREATE INDEX idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX idx_time_logs_user_started ON time_logs(user_id, started_at);

-- 2. Migrate existing completed blocks to time_logs
-- Preserve historical data before dropping columns
INSERT INTO time_logs (time_block_id, task_id, user_id, logged_minutes, started_at, ended_at, created_at)
SELECT
    ttb.id,
    ttb.task_id,
    t.user_id,
    COALESCE(ttb.actual_minutes, 0),
    COALESCE(ttb.completed_at, ttb.created_at),
    COALESCE(ttb.completed_at, ttb.created_at),
    COALESCE(ttb.completed_at, NOW())
FROM task_time_blocks ttb
JOIN tasks t ON t.id = ttb.task_id
WHERE ttb.is_completed = true AND ttb.actual_minutes > 0;

-- 3. Drop redundant columns from task_time_blocks
ALTER TABLE task_time_blocks DROP COLUMN IF EXISTS actual_minutes;
ALTER TABLE task_time_blocks DROP COLUMN IF EXISTS is_completed;
ALTER TABLE task_time_blocks DROP COLUMN IF EXISTS completed_at;
ALTER TABLE task_time_blocks DROP COLUMN IF EXISTS status_warning;
