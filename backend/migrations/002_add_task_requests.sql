-- 002_add_task_requests.sql

-- Add task_requests table
CREATE TABLE task_requests (
    request_id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(user_id),
    supervisor_id INTEGER NOT NULL REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, denied
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add type and metadata to notifications table
ALTER TABLE notifications
ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'standard',
ADD COLUMN metadata JSONB;

-- Optional: Add an index on the new columns
CREATE INDEX idx_notifications_type ON notifications(type);
