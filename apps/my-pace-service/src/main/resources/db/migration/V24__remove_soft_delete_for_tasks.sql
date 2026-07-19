-- V24: Remove soft-delete for tasks and clean up DB
DELETE FROM tasks WHERE is_deleted = true;
ALTER TABLE tasks DROP COLUMN is_deleted;
