-- Create a function to get distinct college states efficiently
CREATE OR REPLACE FUNCTION public.get_college_states()
RETURNS TABLE(state text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT colleges.state
  FROM public.colleges
  WHERE colleges.is_active = true
  ORDER BY colleges.state;
$$;