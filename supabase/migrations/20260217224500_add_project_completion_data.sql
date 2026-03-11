-- Add completion_data column to user_projects table
ALTER TABLE user_projects
ADD COLUMN completion_data JSONB DEFAULT NULL;

-- Add completion_requested status check constraint if not already covered (assuming status is a string, but good to document)
-- The status column is text, so no enum update needed unless we want to enforce it. 
-- Existing statuses: open, in_progress, completed, cancelled. 
-- New status: completion_requested.
