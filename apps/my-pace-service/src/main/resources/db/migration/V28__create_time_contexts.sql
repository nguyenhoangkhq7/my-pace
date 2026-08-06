CREATE TABLE time_contexts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_time_contexts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE time_context_slots (
    id UUID PRIMARY KEY,
    time_context_id UUID NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT fk_time_context_slots_context FOREIGN KEY (time_context_id) REFERENCES time_contexts(id) ON DELETE CASCADE
);

ALTER TABLE categories ADD COLUMN time_context_id UUID NULL;
ALTER TABLE categories ADD CONSTRAINT fk_categories_time_context FOREIGN KEY (time_context_id) REFERENCES time_contexts(id) ON DELETE SET NULL;
