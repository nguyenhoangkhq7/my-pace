-- Add is_all_day column to fixed_events
ALTER TABLE fixed_events
ADD COLUMN is_all_day BOOLEAN DEFAULT FALSE NOT NULL;

-- Add override_is_all_day column to fixed_event_exceptions
ALTER TABLE fixed_event_exceptions
ADD COLUMN override_is_all_day BOOLEAN;
