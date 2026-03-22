-- Create freelancer_ratings table
CREATE TABLE public.freelancer_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.user_projects(id) ON DELETE CASCADE,
  freelancer_id uuid NOT NULL,
  client_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.freelancer_ratings ENABLE ROW LEVEL SECURITY;

-- Clients can insert ratings for projects they own
CREATE POLICY "Clients can insert ratings for their projects"
ON public.freelancer_ratings
FOR INSERT
WITH CHECK (
  auth.uid() = client_id AND
  EXISTS (
    SELECT 1 FROM public.user_projects
    WHERE id = project_id AND user_id = auth.uid()
  )
);

-- Freelancers can view ratings they received
CREATE POLICY "Freelancers can view their ratings"
ON public.freelancer_ratings
FOR SELECT
USING (auth.uid() = freelancer_id);

-- Clients can view ratings they gave
CREATE POLICY "Clients can view ratings they gave"
ON public.freelancer_ratings
FOR SELECT
USING (auth.uid() = client_id);