-- V25: Add sticky_notes table for user sticky notes feature

CREATE TABLE sticky_notes (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL DEFAULT 'Untitled Note',
    content       TEXT NOT NULL DEFAULT '',
    color         VARCHAR(50) NOT NULL DEFAULT 'amber',
    is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,
    is_minimized  BOOLEAN NOT NULL DEFAULT FALSE,
    is_visible    BOOLEAN NOT NULL DEFAULT TRUE,
    position_x    INT NOT NULL DEFAULT 120,
    position_y    INT NOT NULL DEFAULT 120,
    width         INT NOT NULL DEFAULT 280,
    height        INT NOT NULL DEFAULT 280,
    z_index       INT NOT NULL DEFAULT 1,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sticky_notes_user_id ON sticky_notes(user_id);
