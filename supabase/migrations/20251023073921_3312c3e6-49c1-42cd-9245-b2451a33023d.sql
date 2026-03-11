-- Create user_skills table
CREATE TABLE public.user_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

-- Enable RLS on user_skills
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_skills
CREATE POLICY "Users can view their own skills"
ON public.user_skills
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills"
ON public.user_skills
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
ON public.user_skills
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills"
ON public.user_skills
FOR DELETE
USING (auth.uid() = user_id);

-- Add new columns to user_profiles
ALTER TABLE public.user_profiles 
  ADD COLUMN bio TEXT,
  ADD COLUMN phone TEXT,
  ADD COLUMN website TEXT;

-- Create user_projects table
CREATE TABLE public.user_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  rating DECIMAL(2,1),
  client_feedback TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_projects
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_projects
CREATE POLICY "Users can view their own projects"
ON public.user_projects
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
ON public.user_projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.user_projects
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.user_projects
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on user_projects
CREATE TRIGGER update_user_projects_updated_at
BEFORE UPDATE ON public.user_projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();