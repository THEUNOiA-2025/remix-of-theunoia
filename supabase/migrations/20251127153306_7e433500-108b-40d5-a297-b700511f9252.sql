-- Create storage bucket for student ID cards
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-id-cards', 'student-id-cards', false)
ON CONFLICT (id) DO NOTHING;

-- Add id_card_url column to student_verifications table
ALTER TABLE public.student_verifications 
ADD COLUMN IF NOT EXISTS id_card_url TEXT;

-- Create RLS policies for student-id-cards bucket
CREATE POLICY "Users can upload their own ID cards"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-id-cards' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own ID cards"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-id-cards' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own ID cards"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'student-id-cards' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own ID cards"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-id-cards' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all ID cards for verification
CREATE POLICY "Admins can view all ID cards"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-id-cards'
  -- Add admin check here if you have admin roles
);