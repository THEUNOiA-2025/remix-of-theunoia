-- Add RLS policy to allow admins to insert colleges
CREATE POLICY "Admins can insert colleges" 
ON public.colleges 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy to allow admins to update colleges
CREATE POLICY "Admins can update colleges" 
ON public.colleges 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy to allow admins to delete colleges
CREATE POLICY "Admins can delete colleges" 
ON public.colleges 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));