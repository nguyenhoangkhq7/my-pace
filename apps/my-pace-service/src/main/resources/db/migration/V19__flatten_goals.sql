-- Add fields from time_boxed_goals directly into goals
ALTER TABLE goals ADD COLUMN duration_minutes INT;
ALTER TABLE goals ADD COLUMN days_of_week VARCHAR(50) DEFAULT '1,2,3,4,5,6,7';
ALTER TABLE goals ADD COLUMN prefer_time TIME;

-- Migrate existing data from time_boxed_goals before dropping it
UPDATE goals g
SET 
    duration_minutes = t.duration_minutes,
    days_of_week = t.days_of_week,
    prefer_time = t.prefer_time
FROM time_boxed_goals t
WHERE g.id = t.goal_id;

-- Now drop the child tables
DROP TABLE IF EXISTS time_boxed_goals;
DROP TABLE IF EXISTS milestone_goals;

-- Drop parent_goal_id from goals
ALTER TABLE goals DROP COLUMN parent_goal_id;
