-- Migration: Add function to get project bids with freelancer profiles
-- This function allows project owners to see bids on their projects with freelancer info
-- Uses SECURITY DEFINER to bypass RLS while ensuring only project owners can access

CREATE OR REPLACE FUNCTION get_project_bids_with_profiles(_project_id UUID)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  freelancer_id UUID,
  amount NUMERIC,
  proposal TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  freelancer_first_name TEXT,
  freelancer_last_name TEXT,
  freelancer_profile_picture_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_owner_id UUID;
BEGIN
  -- Get the project owner
  SELECT user_id INTO v_project_owner_id
  FROM user_projects
  WHERE user_projects.id = _project_id;

  -- Verify the caller is the project owner
  IF v_project_owner_id IS NULL OR v_project_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You are not the owner of this project';
  END IF;

  -- Return bids with freelancer profile info
  RETURN QUERY
  SELECT 
    b.id,
    b.project_id,
    b.freelancer_id,
    b.amount,
    b.proposal,
    b.status::TEXT,
    b.created_at,
    b.updated_at,
    up.first_name AS freelancer_first_name,
    up.last_name AS freelancer_last_name,
    up.profile_picture_url AS freelancer_profile_picture_url
  FROM bids b
  LEFT JOIN user_profiles up ON up.user_id = b.freelancer_id
  WHERE b.project_id = _project_id
  ORDER BY b.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_project_bids_with_profiles(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_project_bids_with_profiles IS 'Returns bids for a project with freelancer profile info. Only accessible by the project owner.';
