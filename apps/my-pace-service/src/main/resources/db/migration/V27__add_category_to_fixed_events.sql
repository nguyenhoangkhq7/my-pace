-- V27: Add category_id to fixed_events and override_category_id to fixed_event_exceptions

ALTER TABLE fixed_events
    ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX idx_fixed_events_category_id ON fixed_events(category_id);

ALTER TABLE fixed_event_exceptions
    ADD COLUMN override_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
