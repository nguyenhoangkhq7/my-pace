-- Migration to add is_locked column to task_time_blocks table
ALTER TABLE task_time_blocks
    ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE;
