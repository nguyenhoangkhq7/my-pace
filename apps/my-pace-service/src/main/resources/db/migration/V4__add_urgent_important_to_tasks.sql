-- Add is_urgent and is_important
ALTER TABLE tasks ADD COLUMN is_urgent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN is_important BOOLEAN NOT NULL DEFAULT FALSE;

-- Drop quadrant
ALTER TABLE tasks DROP COLUMN quadrant;
