-- Delete old data as requested (it's development phase and structure has drastically changed)
TRUNCATE TABLE time_boxed_goals;

-- Drop old columns
ALTER TABLE time_boxed_goals
    DROP COLUMN target_minutes,
    DROP COLUMN period_days,
    DROP COLUMN accumulated_minutes;

-- Add new columns
ALTER TABLE time_boxed_goals
    ADD COLUMN duration_minutes INT NOT NULL DEFAULT 60,
    ADD COLUMN days_of_week VARCHAR(50) NOT NULL DEFAULT '1,2,3,4,5,6,7',
    ADD COLUMN prefer_time TIME;
