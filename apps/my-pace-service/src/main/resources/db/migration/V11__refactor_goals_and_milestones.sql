-- Refactor goals: Add category_id, parent_goal_id, progress_pct
ALTER TABLE goals
    ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    ADD COLUMN parent_goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    ADD COLUMN progress_pct INT NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100);

CREATE INDEX idx_goals_category_id ON goals(category_id);
CREATE INDEX idx_goals_parent_goal_id ON goals(parent_goal_id);

-- Replace milestones table with milestone_goals
DROP TABLE milestones;

CREATE TABLE milestone_goals (
                                 goal_id UUID PRIMARY KEY REFERENCES goals(id) ON DELETE CASCADE,
                                 target_count INT NOT NULL CHECK (target_count > 0),
                                 current_count INT NOT NULL DEFAULT 0 CHECK (current_count >= 0)
);

-- Add accumulated_minutes to time_boxed_goals
ALTER TABLE time_boxed_goals
    ADD COLUMN accumulated_minutes INT NOT NULL DEFAULT 0 CHECK (accumulated_minutes >= 0);

-- Add task_type to tasks
ALTER TABLE tasks
    ADD COLUMN task_type VARCHAR(20) NOT NULL DEFAULT 'AD_HOC';
