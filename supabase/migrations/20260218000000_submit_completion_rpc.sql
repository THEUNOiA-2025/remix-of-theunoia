-- Secure RPC function to submit project completion
-- This bypasses RLS on the table update by using SECURITY DEFINER,
-- but enforces strict logic to ensure only the assigned freelancer can call it.

CREATE OR REPLACE FUNCTION submit_project_completion(
  p_project_id UUID,
  p_message TEXT,
  p_attachments JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_freelancer_id UUID;
BEGIN
  -- 1. Verify the executing user is the accepted freelancer for this project
  SELECT freelancer_id INTO v_freelancer_id
  FROM public.bids
  WHERE project_id = p_project_id 
  AND status = 'accepted'
  AND freelancer_id = auth.uid();

  IF v_freelancer_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized: You are not the accepted freelancer for this project.';
  END IF;

  -- 2. Update the project status and data
  UPDATE public.user_projects
  SET 
    status = 'completion_requested',
    completion_data = jsonb_build_object(
      'message', p_message,
      'attachments', p_attachments,
      'submitted_at', timezone('utc', now())
    )
  WHERE id = p_project_id;
  
  -- Check if update happened (optional, but good for debugging)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found or update failed.';
  END IF;

END;
$$;
