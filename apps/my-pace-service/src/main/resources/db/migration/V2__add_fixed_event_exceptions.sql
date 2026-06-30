-- ============================================================
-- V2: Add notes column to fixed_events + exception table
-- ============================================================

-- Add notes column to existing fixed_events table (missing from V1)
ALTER TABLE fixed_events ADD COLUMN IF NOT EXISTS notes TEXT;

-- ─── Fixed Event Exceptions ───────────────────────────────────────────────────
-- Stores per-occurrence overrides or soft-deletes for recurring series

CREATE TABLE fixed_event_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fixed_event_id UUID NOT NULL REFERENCES fixed_events(id) ON DELETE CASCADE,
    occurrence_date DATE NOT NULL,
    -- if is_deleted = TRUE, this occurrence is hidden (soft-deleted)
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    -- override fields (NULL means "use the series default")
    override_title VARCHAR(255),
    override_notes TEXT,
    override_start_time TIME,
    override_end_time TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (fixed_event_id, occurrence_date)
);

CREATE INDEX idx_fixed_event_exceptions_event_id ON fixed_event_exceptions(fixed_event_id);
CREATE INDEX idx_fixed_event_exceptions_date ON fixed_event_exceptions(occurrence_date);
