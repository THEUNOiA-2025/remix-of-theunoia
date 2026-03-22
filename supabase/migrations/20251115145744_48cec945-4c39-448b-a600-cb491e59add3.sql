-- Create bid status enum
CREATE TYPE public.bid_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.user_projects(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  proposal TEXT NOT NULL,
  status bid_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Freelancers can view their own bids
CREATE POLICY "Users can view their own bids"
ON public.bids
FOR SELECT
USING (auth.uid() = freelancer_id);

-- Project owners can view bids on their projects
CREATE POLICY "Project owners can view bids on their projects"
ON public.bids
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_projects
    WHERE user_projects.id = bids.project_id
    AND user_projects.user_id = auth.uid()
  )
);

-- Users can insert their own bids
CREATE POLICY "Users can insert their own bids"
ON public.bids
FOR INSERT
WITH CHECK (auth.uid() = freelancer_id);

-- Project owners can update bid status
CREATE POLICY "Project owners can update bids"
ON public.bids
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_projects
    WHERE user_projects.id = bids.project_id
    AND user_projects.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_bids_updated_at
BEFORE UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();