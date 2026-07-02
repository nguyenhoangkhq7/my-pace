UPDATE goals
SET status = 'In Progress'
WHERE parent_goal_id IS NOT NULL AND status = 'Freeze';
