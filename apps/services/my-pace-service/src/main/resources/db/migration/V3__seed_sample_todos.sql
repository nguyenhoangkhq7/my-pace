-- Seed demo data for testing the task/category screens.
-- This migration assumes user id = 1 already exists.

SET @user_id := 1;

INSERT INTO categories (user_id, name, preferred_start_time, preferred_end_time)
VALUES
    (@user_id, 'Work', '09:00:00', '17:30:00'),
    (@user_id, 'Personal', '18:00:00', '21:30:00'),
    (@user_id, 'Health', '06:00:00', '08:00:00');

INSERT INTO tasks (
    user_id,
    category_id,
    parent_id,
    title,
    position,
    status,
    is_done,
    is_important,
    energy_required,
    estimated_minutes,
    due_date,
    created_at
)
VALUES
    (
        @user_id,
        (SELECT id FROM categories WHERE user_id = @user_id AND name = 'Work' LIMIT 1),
        NULL,
        'Review weekly plan',
        65536.0,
        'TODO',
        FALSE,
        TRUE,
        2,
        30,
        TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 0 DAY), '10:00:00'),
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:15:00')
    ),
    (
        @user_id,
        (SELECT id FROM categories WHERE user_id = @user_id AND name = 'Work' LIMIT 1),
        NULL,
        'Prepare dashboard wireframe',
        65535.0,
        'DOING',
        FALSE,
        TRUE,
        3,
        90,
        TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00'),
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '09:00:00')
    ),
    (
        @user_id,
        (SELECT id FROM categories WHERE user_id = @user_id AND name = 'Work' LIMIT 1),
        NULL,
        'Send client follow-up email',
        65534.0,
        'TODO',
        FALSE,
        FALSE,
        2,
        20,
        TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:30:00'),
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:10:00')
    ),
    (
        @user_id,
        (SELECT id FROM categories WHERE user_id = @user_id AND name = 'Work' LIMIT 1),
        NULL,
        'Refactor auth module',
        65533.0,
        'TODO',
        FALSE,
        TRUE,
        3,
        120,
        TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 4 DAY), '16:30:00'),
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '13:00:00')
    ),
    (
        @user_id,
        (SELECT id FROM categories WHERE user_id = @user_id AND name = 'Personal' LIMIT 1),
        NULL,
        'Grocery shopping',
        65532.0,
        'TODO',
        FALSE,
        FALSE,
        1,
        45,
        TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:00:00'),
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '18:00:00')
    ),
    (
        @user_id,
        (SELECT id FROM categories WHERE user_id = @user_id AND name = 'Personal' LIMIT 1),
        NULL,
        'Call mom',
        65531.0,
        'DONE',
        TRUE,
        FALSE,
        1,
        15,
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '20:00:00'),
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '20:00:00')
    ),
    (
        @user_id,
        (SELECT id FROM categories WHERE user_id = @user_id AND name = 'Health' LIMIT 1),
        NULL,
        'Morning walk',
        65530.0,
        'TODO',
        FALSE,
        FALSE,
        2,
        30,
        TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '06:30:00'),
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '06:30:00')
    ),
    (
        @user_id,
        (SELECT id FROM categories WHERE user_id = @user_id AND name = 'Health' LIMIT 1),
        NULL,
        'Stretching routine',
        65529.0,
        'TODO',
        FALSE,
        FALSE,
        1,
        20,
        TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '07:00:00'),
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '06:45:00')
    ),
    (
        @user_id,
        (SELECT id FROM categories WHERE user_id = @user_id AND name = 'Personal' LIMIT 1),
        NULL,
        'Pay electricity bill',
        65528.0,
        'IN_REVIEW',
        FALSE,
        TRUE,
        2,
        10,
        TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '18:30:00'),
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '21:15:00')
    ),
    (
        @user_id,
        (SELECT id FROM categories WHERE user_id = @user_id AND name = 'Work' LIMIT 1),
        NULL,
        'Plan next week goals',
        65527.0,
        'TODO',
        FALSE,
        TRUE,
        3,
        40,
        TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 6 DAY), '17:00:00'),
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '17:30:00')
    );

INSERT INTO task_details (task_id, description, attachments_json, updated_at)
SELECT id, 'Review current week work and prepare next actions.', NULL, CURRENT_TIMESTAMP
FROM tasks
WHERE user_id = @user_id AND title = 'Review weekly plan';

INSERT INTO task_details (task_id, description, attachments_json, updated_at)
SELECT id, 'Turn rough ideas into a clean dashboard layout for the next build.', '["figma://dashboard-wireframe"]', CURRENT_TIMESTAMP
FROM tasks
WHERE user_id = @user_id AND title = 'Prepare dashboard wireframe';

INSERT INTO task_details (task_id, description, attachments_json, updated_at)
SELECT id, 'Send a short update email with the current status and next milestone.', NULL, CURRENT_TIMESTAMP
FROM tasks
WHERE user_id = @user_id AND title = 'Send client follow-up email';

INSERT INTO task_details (task_id, description, attachments_json, updated_at)
SELECT id, 'Focus on JWT and task-related refactor items first.', NULL, CURRENT_TIMESTAMP
FROM tasks
WHERE user_id = @user_id AND title = 'Refactor auth module';

INSERT INTO task_details (task_id, description, attachments_json, updated_at)
SELECT id, 'Buy the weekly groceries and keep the list short.', NULL, CURRENT_TIMESTAMP
FROM tasks
WHERE user_id = @user_id AND title = 'Grocery shopping';

INSERT INTO task_details (task_id, description, attachments_json, updated_at)
SELECT id, 'Walk at a comfortable pace for a light energy boost.', NULL, CURRENT_TIMESTAMP
FROM tasks
WHERE user_id = @user_id AND title = 'Morning walk';

INSERT INTO task_details (task_id, description, attachments_json, updated_at)
SELECT id, 'Quick notes for next week goals and priorities.', NULL, CURRENT_TIMESTAMP
FROM tasks
WHERE user_id = @user_id AND title = 'Plan next week goals';

