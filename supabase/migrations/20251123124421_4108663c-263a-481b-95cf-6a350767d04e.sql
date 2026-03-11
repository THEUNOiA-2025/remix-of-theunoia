-- Add new columns to user_projects table for work requirements and portfolio projects
ALTER TABLE user_projects 
ADD COLUMN IF NOT EXISTS project_type text NOT NULL DEFAULT 'work_requirement',
ADD COLUMN IF NOT EXISTS budget numeric,
ADD COLUMN IF NOT EXISTS timeline text,
ADD COLUMN IF NOT EXISTS skills_required text[],
ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';

-- Add comment to explain project_type values
COMMENT ON COLUMN user_projects.project_type IS 'Type of project: work_requirement (posted by clients) or portfolio_project (completed work by freelancers)';

-- Add comment to explain status values
COMMENT ON COLUMN user_projects.status IS 'Status of work requirement: open, in_progress, or completed';

-- Create index on project_type and status for better query performance
CREATE INDEX IF NOT EXISTS idx_user_projects_project_type ON user_projects(project_type);
CREATE INDEX IF NOT EXISTS idx_user_projects_status ON user_projects(status);
CREATE INDEX IF NOT EXISTS idx_user_projects_type_status ON user_projects(project_type, status);

-- Update RLS policies to allow viewing work requirements by all authenticated users
CREATE POLICY "Anyone can view open work requirements" 
ON user_projects 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND project_type = 'work_requirement' 
  AND status = 'open'
);

-- Keep existing policy for users to view their own projects (all types)
-- This already exists, so no need to recreate