-- V15: Add auto_create_task and default_session_minutes to goals table
ALTER TABLE goals ADD COLUMN auto_create_task BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE goals ADD COLUMN default_session_minutes INT;
