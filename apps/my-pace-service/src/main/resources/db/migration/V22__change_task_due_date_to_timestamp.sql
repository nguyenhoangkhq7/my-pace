-- V22: Change due_date column type in tasks table from DATE to TIMESTAMP WITHOUT TIME ZONE
ALTER TABLE tasks ALTER COLUMN due_date TYPE TIMESTAMP WITHOUT TIME ZONE;
