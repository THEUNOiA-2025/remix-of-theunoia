-- Enable RLS on colleges table
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read colleges (public reference data)
CREATE POLICY "Anyone can view colleges"
ON public.colleges
FOR SELECT
TO authenticated
USING (true);