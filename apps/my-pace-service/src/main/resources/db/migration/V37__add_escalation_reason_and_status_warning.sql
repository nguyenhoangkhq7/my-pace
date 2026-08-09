ALTER TABLE daily_plan_tasks ADD COLUMN escalation_reason VARCHAR(255);
ALTER TABLE task_time_blocks ADD COLUMN status_warning VARCHAR(255);
