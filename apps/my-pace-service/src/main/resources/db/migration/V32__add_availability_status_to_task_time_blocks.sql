-- Migration to add availability_status column to task_time_blocks table
ALTER TABLE task_time_blocks
    ADD COLUMN availability_status VARCHAR(20) NOT NULL DEFAULT 'FREE'
    CHECK (availability_status IN ('BUSY', 'FREE'));
