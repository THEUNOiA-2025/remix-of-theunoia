-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view projects they bid on" ON public.user_projects;

-- Create a security definer function to check if user has bid on a project
-- This bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION public.user_has_bid_on_project(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bids
    WHERE bids.project_id = _project_id
    AND bids.freelancer_id = _user_id
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can view projects they bid on"
ON public.user_projects
FOR SELECT
USING (public.user_has_bid_on_project(id, auth.uid()));