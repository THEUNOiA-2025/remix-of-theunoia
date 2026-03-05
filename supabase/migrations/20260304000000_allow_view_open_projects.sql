-- Add policy to allow anyone to view open projects
CREATE POLICY "Anyone can view open projects"
ON public.user_projects
FOR SELECT
USING (status = 'open');

-- Add policy to allow users to view their own projects
CREATE POLICY "Users can view their own projects"
ON public.user_projects
FOR SELECT
USING (auth.uid() = user_id);
