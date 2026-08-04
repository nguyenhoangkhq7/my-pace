-- V30: Add availability_status to fixed_events and override_availability_status to fixed_event_exceptions

ALTER TABLE fixed_events
    ADD COLUMN availability_status VARCHAR(20) NOT NULL DEFAULT 'BUSY'
    CHECK (availability_status IN ('BUSY', 'FREE'));

ALTER TABLE fixed_event_exceptions
    ADD COLUMN override_availability_status VARCHAR(20)
    CHECK (override_availability_status IN ('BUSY', 'FREE'));
