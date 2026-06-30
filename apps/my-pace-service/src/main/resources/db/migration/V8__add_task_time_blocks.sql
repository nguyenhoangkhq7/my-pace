-- V8: Add task_time_blocks table and remove old scheduling columns from daily_plan_tasks

-- 1. Create new table for time blocks (supports 1-N: one task can have multiple blocks after chunking)
CREATE TABLE task_time_blocks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    daily_plan_id   UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    part_index      INT NOT NULL DEFAULT 1,
    total_parts     INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time),
    CHECK (part_index >= 1),
    CHECK (total_parts >= 1),
    CHECK (part_index <= total_parts)
);

CREATE INDEX idx_task_time_blocks_task_id     ON task_time_blocks(task_id);
CREATE INDEX idx_task_time_blocks_plan_id     ON task_time_blocks(daily_plan_id);
CREATE INDEX idx_task_time_blocks_start_time  ON task_time_blocks(start_time);

-- 2. Drop old scheduling columns from daily_plan_tasks (Single Source of Truth)
ALTER TABLE daily_plan_tasks DROP COLUMN IF EXISTS scheduled_start_time;
ALTER TABLE daily_plan_tasks DROP COLUMN IF EXISTS scheduled_end_time;
