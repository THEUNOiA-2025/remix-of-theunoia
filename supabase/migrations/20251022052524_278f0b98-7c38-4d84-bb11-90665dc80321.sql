-- Make profile fields nullable for progressive onboarding
ALTER TABLE public.user_profiles 
  ALTER COLUMN date_of_birth DROP NOT NULL,
  ALTER COLUMN gender DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL;

-- Add user_type field to track if user is student or non-student
ALTER TABLE public.user_profiles 
  ADD COLUMN user_type TEXT CHECK (user_type IN ('student', 'non-student'));

-- Add profile completion status
ALTER TABLE public.user_profiles 
  ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;