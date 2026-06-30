-- ============================================================
-- V3: Daily Checkins for recalculating available time
-- ============================================================

CREATE TABLE daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL,
    checkin_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, checkin_date)
);

CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, checkin_date);
