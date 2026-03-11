-- Add default deny policies to prevent public read access

-- Add default deny PERMISSIVE policy for freelancer_access table
CREATE POLICY "Default deny all access to freelancer_access"
ON public.freelancer_access
FOR ALL
TO public
USING (false);

-- Add default deny PERMISSIVE policy for user_profiles table
CREATE POLICY "Default deny all access to user_profiles"
ON public.user_profiles
FOR ALL
TO public
USING (false);