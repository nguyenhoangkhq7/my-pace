-- Add task splitting attributes (Reclaim-style task scheduling)
ALTER TABLE tasks
ADD COLUMN is_splittable BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN min_chunk_minutes INT DEFAULT NULL,
ADD COLUMN max_daily_duration INT DEFAULT NULL;
