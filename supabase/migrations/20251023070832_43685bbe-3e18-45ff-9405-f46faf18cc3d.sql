-- Add verification_method column to student_verifications table
ALTER TABLE public.student_verifications 
ADD COLUMN verification_method text CHECK (verification_method IN ('email', 'document'));

-- Add pin_code column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN pin_code text;

-- Add rejection_reason column to student_verifications for future use
ALTER TABLE public.student_verifications 
ADD COLUMN rejection_reason text;