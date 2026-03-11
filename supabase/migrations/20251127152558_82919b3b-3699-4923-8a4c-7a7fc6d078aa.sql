-- Add category and subcategory columns to user_projects table
ALTER TABLE public.user_projects 
ADD COLUMN category TEXT,
ADD COLUMN subcategory TEXT;

-- Add index for better query performance on category filtering
CREATE INDEX idx_user_projects_category ON public.user_projects(category);
CREATE INDEX idx_user_projects_subcategory ON public.user_projects(subcategory);