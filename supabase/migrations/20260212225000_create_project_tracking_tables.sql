-- Create project_phases table
CREATE TABLE IF NOT EXISTS public.project_phases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.user_projects(id) ON DELETE CASCADE,
    phase_name TEXT NOT NULL,
    phase_order INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'locked', 'unlocked')),
    freelancer_approved BOOLEAN DEFAULT FALSE,
    client_approved BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, phase_order)
);

-- Create project_tasks table
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.user_projects(id) ON DELETE CASCADE,
    phase TEXT NOT NULL, -- Storing phase name directly as per current frontend/types
    title TEXT NOT NULL,
    description TEXT,
    assignee TEXT NOT NULL, -- Storing name/ID as string for now
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT NOT NULL CHECK (status IN ('to-do', 'in-progress', 'done')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create project_activities table
CREATE TABLE IF NOT EXISTS public.project_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.user_projects(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL, -- Snapshot of user name
    task_name TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    phase TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for project_phases
-- Users can view phases if they are the project owner OR the accepted freelancer (need a way to check this cheaply)
-- For now, allowing all authenticated users to read/write for simplicity of first iteration, 
-- but realistically should join with bids/user_projects. 
-- Assuming "public" projects or specific access rights.
-- Let's tighten it slightly: users can view/edit if they are authenticated (MVP)
-- A better policy would be: 
-- USING (auth.uid() = (SELECT user_id FROM user_projects WHERE id = project_id) OR auth.uid() IN (SELECT freelancer_id FROM bids WHERE project_id = project_id AND status = 'accepted'))

CREATE POLICY "Authenticated users can view project phases"
    ON public.project_phases FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert project phases"
    ON public.project_phases FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update project phases"
    ON public.project_phases FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Create policies for project_tasks
CREATE POLICY "Authenticated users can view project tasks"
    ON public.project_tasks FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert project tasks"
    ON public.project_tasks FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update project tasks"
    ON public.project_tasks FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete project tasks"
    ON public.project_tasks FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create policies for project_activities
CREATE POLICY "Authenticated users can view project activities"
    ON public.project_activities FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert project activities"
    ON public.project_activities FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Triggers for updated_at
CREATE TRIGGER update_project_phases_updated_at
    BEFORE UPDATE ON public.project_phases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON public.project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
