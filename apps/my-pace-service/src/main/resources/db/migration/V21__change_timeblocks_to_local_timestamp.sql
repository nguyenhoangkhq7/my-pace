-- V21: Change start_time and end_time in task_time_blocks to local timestamp without timezone
ALTER TABLE task_time_blocks ALTER COLUMN start_time TYPE TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE task_time_blocks ALTER COLUMN end_time TYPE TIMESTAMP WITHOUT TIME ZONE;
