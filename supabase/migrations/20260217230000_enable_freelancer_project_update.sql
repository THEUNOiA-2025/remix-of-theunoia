-- Allow freelancers to update project status and completion_data
-- This is required for the completion submission workflow

-- Policy for updating user_projects
CREATE POLICY "Freelancers can update project status"
ON public.user_projects
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT freelancer_id 
    FROM public.bids 
    WHERE project_id = id AND status = 'accepted'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT freelancer_id 
    FROM public.bids 
    WHERE project_id = id AND status = 'accepted'
  )
);
