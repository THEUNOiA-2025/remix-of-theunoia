-- Allow users to view projects they have bid on (regardless of project status)
CREATE POLICY "Users can view projects they bid on"
ON public.user_projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bids
    WHERE bids.project_id = user_projects.id
    AND bids.freelancer_id = auth.uid()
  )
);