-- Community backend foundation:
-- - canonical community_key
-- - verification audit fields
-- - OTP hardening columns
-- - secure storage policies
-- - community RPCs

CREATE OR REPLACE FUNCTION public.normalize_community_name(input_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(regexp_replace(lower(trim(coalesce(input_name, ''))), '\s+', ' ', 'g'), '');
$$;

CREATE OR REPLACE FUNCTION public.compute_community_key(
  p_college_id UUID,
  p_institute_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  normalized_name TEXT;
BEGIN
  IF p_college_id IS NOT NULL THEN
    RETURN 'college:' || p_college_id::TEXT;
  END IF;

  normalized_name := public.normalize_community_name(p_institute_name);
  IF normalized_name IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN 'manual:' || normalized_name;
END;
$$;

ALTER TABLE public.student_verifications
  ADD COLUMN IF NOT EXISTS community_key TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE public.user_projects
  ADD COLUMN IF NOT EXISTS community_key TEXT;

ALTER TABLE public.email_verification_codes
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMPTZ;

UPDATE public.student_verifications
SET community_key = public.compute_community_key(college_id, institute_name)
WHERE community_key IS NULL;

UPDATE public.user_projects
SET community_key = public.compute_community_key(community_college_id, timeline)
WHERE is_community_task = true
  AND community_key IS NULL;

CREATE OR REPLACE FUNCTION public.set_student_verification_community_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.community_key := public.compute_community_key(NEW.college_id, NEW.institute_name);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_project_community_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_community_task THEN
    NEW.community_key := public.compute_community_key(NEW.community_college_id, NEW.timeline);
  ELSE
    NEW.community_key := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_student_verification_community_key ON public.student_verifications;
CREATE TRIGGER trg_set_student_verification_community_key
  BEFORE INSERT OR UPDATE OF college_id, institute_name
  ON public.student_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_student_verification_community_key();

DROP TRIGGER IF EXISTS trg_set_project_community_key ON public.user_projects;
CREATE TRIGGER trg_set_project_community_key
  BEFORE INSERT OR UPDATE OF is_community_task, community_college_id, timeline
  ON public.user_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_project_community_key();

CREATE INDEX IF NOT EXISTS idx_student_verifications_community_key_status
  ON public.student_verifications (community_key, verification_status);

CREATE INDEX IF NOT EXISTS idx_user_projects_community_key_status
  ON public.user_projects (community_key, status)
  WHERE is_community_task = true;

CREATE INDEX IF NOT EXISTS idx_bids_project_status
  ON public.bids (project_id, status);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_active_lookup
  ON public.email_verification_codes (user_id, email, created_at DESC)
  WHERE verified_at IS NULL AND invalidated_at IS NULL;

DROP POLICY IF EXISTS "Admins can view all ID cards" ON storage.objects;
CREATE POLICY "Admins can view all ID cards"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-id-cards'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE OR REPLACE FUNCTION public.resolve_my_community_key()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_key TEXT;
BEGIN
  SELECT sv.community_key
    INTO resolved_key
  FROM public.student_verifications sv
  WHERE sv.user_id = auth.uid()
    AND sv.verification_status = 'approved'
  ORDER BY sv.updated_at DESC NULLS LAST
  LIMIT 1;

  RETURN resolved_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_student_verification_submission(
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT,
  p_institute_email TEXT,
  p_enrollment_id TEXT,
  p_college_id UUID,
  p_institute_name TEXT,
  p_id_card_url TEXT,
  p_email_verified BOOLEAN,
  p_verification_method TEXT
)
RETURNS public.student_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_row public.student_verifications;
  v_institute_name TEXT := NULLIF(trim(coalesce(p_institute_name, '')), '');
  v_institute_email TEXT := NULLIF(lower(trim(coalesce(p_institute_email, ''))), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF coalesce(trim(p_first_name), '') = '' OR coalesce(trim(p_last_name), '') = '' THEN
    RAISE EXCEPTION 'First and last name are required';
  END IF;

  IF p_college_id IS NULL AND v_institute_name IS NULL THEN
    RAISE EXCEPTION 'Either college_id or institute_name is required';
  END IF;

  IF coalesce(v_institute_email, '') = '' AND coalesce(p_id_card_url, '') = '' THEN
    RAISE EXCEPTION 'Institute email or ID card is required';
  END IF;

  UPDATE public.user_profiles
  SET
    first_name = trim(p_first_name),
    last_name = trim(p_last_name),
    phone = NULLIF(trim(coalesce(p_phone, '')), ''),
    updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO public.student_verifications (
    user_id,
    college_id,
    institute_name,
    institute_email,
    enrollment_id,
    id_card_url,
    verification_status,
    verification_method,
    email_verified,
    email_verified_at,
    reviewed_by,
    reviewed_at,
    rejection_reason
  )
  VALUES (
    v_user_id,
    p_college_id,
    v_institute_name,
    v_institute_email,
    NULLIF(trim(coalesce(p_enrollment_id, '')), ''),
    NULLIF(trim(coalesce(p_id_card_url, '')), ''),
    'pending',
    NULLIF(trim(coalesce(p_verification_method, '')), ''),
    coalesce(p_email_verified, false),
    CASE WHEN coalesce(p_email_verified, false) THEN now() ELSE NULL END,
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    college_id = EXCLUDED.college_id,
    institute_name = EXCLUDED.institute_name,
    institute_email = EXCLUDED.institute_email,
    enrollment_id = EXCLUDED.enrollment_id,
    id_card_url = EXCLUDED.id_card_url,
    verification_status = 'pending',
    verification_method = EXCLUDED.verification_method,
    email_verified = EXCLUDED.email_verified,
    email_verified_at = EXCLUDED.email_verified_at,
    reviewed_by = NULL,
    reviewed_at = NULL,
    rejection_reason = NULL,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_community_member_settings(
  p_institute_email TEXT,
  p_enrollment_id TEXT
)
RETURNS public.student_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_row public.student_verifications;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.student_verifications
  SET
    institute_email = NULLIF(lower(trim(coalesce(p_institute_email, ''))), ''),
    enrollment_id = NULLIF(trim(coalesce(p_enrollment_id, '')), ''),
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Verification record not found';
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_student_verification(
  p_verification_id UUID,
  p_action TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS public.student_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_target_status public.verification_status;
  v_row public.student_verifications;
BEGIN
  IF v_user_id IS NULL OR NOT public.has_role(v_user_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can review verifications';
  END IF;

  IF lower(trim(coalesce(p_action, ''))) = 'approve' THEN
    v_target_status := 'approved';
  ELSIF lower(trim(coalesce(p_action, ''))) = 'reject' THEN
    v_target_status := 'rejected';
  ELSE
    RAISE EXCEPTION 'Action must be approve or reject';
  END IF;

  UPDATE public.student_verifications
  SET
    verification_status = v_target_status,
    verified_at = CASE WHEN v_target_status = 'approved' THEN now() ELSE verified_at END,
    reviewed_by = v_user_id,
    reviewed_at = now(),
    rejection_reason = CASE WHEN v_target_status = 'rejected' THEN NULLIF(trim(coalesce(p_rejection_reason, '')), '') ELSE NULL END,
    updated_at = now()
  WHERE id = p_verification_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Verification record not found';
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_community_context()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('verification', NULL);
  END IF;

  SELECT jsonb_build_object(
      'verification',
      to_jsonb(sv) || jsonb_build_object(
        'college',
        CASE
          WHEN c.id IS NULL THEN NULL
          ELSE jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'short_name', c.short_name,
            'city', c.city,
            'state', c.state
          )
        END
      )
    )
  INTO v_result
  FROM public.student_verifications sv
  LEFT JOIN public.colleges c ON c.id = sv.college_id
  WHERE sv.user_id = v_user_id
  ORDER BY sv.updated_at DESC NULLS LAST
  LIMIT 1;

  RETURN coalesce(v_result, jsonb_build_object('verification', NULL));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_community_dashboard(
  p_status TEXT DEFAULT 'all',
  p_category TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_community_key TEXT;
  v_members JSONB := '[]'::jsonb;
  v_tasks JSONB := '[]'::jsonb;
  v_leaderboard JSONB := '[]'::jsonb;
  v_stats JSONB := '{}'::jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT sv.community_key
    INTO v_community_key
  FROM public.student_verifications sv
  WHERE sv.user_id = v_user_id
    AND sv.verification_status = 'approved'
  ORDER BY sv.updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_community_key IS NULL THEN
    RETURN jsonb_build_object(
      'community_key', NULL,
      'members', '[]'::jsonb,
      'tasks', '[]'::jsonb,
      'leaderboard', '[]'::jsonb,
      'stats', jsonb_build_object(
        'totalMembers', 0,
        'totalEarned', 0,
        'activeProjects', 0,
        'completedTasks', 0
      )
    );
  END IF;

  WITH accepted AS (
    SELECT
      b.freelancer_id,
      b.amount,
      up.id AS project_id,
      up.status AS project_status
    FROM public.bids b
    JOIN public.user_projects up ON up.id = b.project_id
    WHERE b.status = 'accepted'
      AND up.is_community_task = true
      AND up.community_key = v_community_key
  ),
  member_stats AS (
    SELECT
      freelancer_id,
      COALESCE(SUM(CASE WHEN project_status = 'completed' THEN amount ELSE 0 END), 0) AS total_earned,
      COALESCE(COUNT(*) FILTER (WHERE project_status = 'completed'), 0) AS tasks_completed
    FROM accepted
    GROUP BY freelancer_id
  ),
  members_raw AS (
    SELECT
      sv.user_id,
      up.first_name,
      up.last_name,
      up.bio,
      up.profile_picture_url,
      COALESCE(ms.total_earned, 0) AS total_earned,
      COALESCE(ms.tasks_completed, 0) AS tasks_completed
    FROM public.student_verifications sv
    JOIN public.user_profiles up ON up.user_id = sv.user_id
    LEFT JOIN member_stats ms ON ms.freelancer_id = sv.user_id
    WHERE sv.verification_status = 'approved'
      AND sv.community_key = v_community_key
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(members_raw) ORDER BY total_earned DESC, tasks_completed DESC, first_name ASC), '[]'::jsonb)
    INTO v_members
  FROM members_raw;

  WITH tasks_raw AS (
    SELECT
      up.id,
      up.title,
      up.description,
      up.budget,
      up.category,
      up.subcategory,
      up.bidding_deadline,
      up.cover_image_url,
      up.user_id,
      up.created_at,
      up.status,
      up.skills_required,
      COALESCE(COUNT(b.id), 0)::INT AS applicant_count,
      jsonb_build_object(
        'first_name', upp.first_name,
        'last_name', upp.last_name,
        'profile_picture_url', upp.profile_picture_url
      ) AS user_profiles
    FROM public.user_projects up
    JOIN public.user_profiles upp ON upp.user_id = up.user_id
    LEFT JOIN public.bids b ON b.project_id = up.id
    WHERE up.is_community_task = true
      AND up.community_key = v_community_key
      AND (
        lower(coalesce(p_status, 'all')) = 'all'
        OR (lower(p_status) = 'open' AND lower(coalesce(up.status, '')) = 'open')
        OR (lower(p_status) = 'in_progress' AND lower(coalesce(up.status, '')) IN ('in_progress', 'in-progress', 'active'))
        OR (lower(p_status) = 'completed' AND lower(coalesce(up.status, '')) IN ('completed', 'done'))
      )
      AND (
        lower(coalesce(p_category, 'all')) = 'all'
        OR coalesce(up.category, '') = p_category
      )
    GROUP BY up.id, upp.first_name, upp.last_name, upp.profile_picture_url
    ORDER BY up.created_at DESC
    LIMIT GREATEST(p_limit, 1)
    OFFSET GREATEST(p_offset, 0)
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(tasks_raw)), '[]'::jsonb)
    INTO v_tasks
  FROM tasks_raw;

  WITH leaderboard_raw AS (
    SELECT
      m.user_id,
      m.first_name,
      m.last_name,
      m.profile_picture_url,
      m.tasks_completed,
      m.total_earned,
      ROW_NUMBER() OVER (ORDER BY m.total_earned DESC, m.tasks_completed DESC, m.first_name ASC) AS rank
    FROM (
      SELECT
        sv.user_id,
        up.first_name,
        up.last_name,
        up.profile_picture_url,
        COALESCE(SUM(CASE WHEN pr.status = 'completed' THEN b.amount ELSE 0 END), 0) AS total_earned,
        COALESCE(COUNT(*) FILTER (WHERE pr.status = 'completed' AND b.status = 'accepted'), 0) AS tasks_completed
      FROM public.student_verifications sv
      JOIN public.user_profiles up ON up.user_id = sv.user_id
      LEFT JOIN public.bids b ON b.freelancer_id = sv.user_id AND b.status = 'accepted'
      LEFT JOIN public.user_projects pr ON pr.id = b.project_id
      WHERE sv.verification_status = 'approved'
        AND sv.community_key = v_community_key
        AND (pr.id IS NULL OR (pr.is_community_task = true AND pr.community_key = v_community_key))
      GROUP BY sv.user_id, up.first_name, up.last_name, up.profile_picture_url
    ) m
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(leaderboard_raw) ORDER BY rank), '[]'::jsonb)
    INTO v_leaderboard
  FROM leaderboard_raw;

  SELECT jsonb_build_object(
    'totalMembers', COALESCE((SELECT COUNT(*) FROM public.student_verifications sv WHERE sv.verification_status = 'approved' AND sv.community_key = v_community_key), 0),
    'totalEarned', COALESCE((SELECT SUM(b.amount) FROM public.bids b JOIN public.user_projects up ON up.id = b.project_id WHERE b.status = 'accepted' AND up.status = 'completed' AND up.is_community_task = true AND up.community_key = v_community_key), 0),
    'activeProjects', COALESCE((SELECT COUNT(*) FROM public.user_projects up WHERE up.is_community_task = true AND up.community_key = v_community_key AND lower(coalesce(up.status, '')) IN ('open', 'in_progress', 'in-progress', 'active')), 0),
    'completedTasks', COALESCE((SELECT COUNT(*) FROM public.user_projects up WHERE up.is_community_task = true AND up.community_key = v_community_key AND lower(coalesce(up.status, '')) IN ('completed', 'done')), 0)
  )
  INTO v_stats;

  RETURN jsonb_build_object(
    'community_key', v_community_key,
    'members', v_members,
    'tasks', v_tasks,
    'leaderboard', v_leaderboard,
    'stats', v_stats
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_my_community_key() TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_student_verification_submission(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_community_member_settings(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_student_verification(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_community_context() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_dashboard(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
