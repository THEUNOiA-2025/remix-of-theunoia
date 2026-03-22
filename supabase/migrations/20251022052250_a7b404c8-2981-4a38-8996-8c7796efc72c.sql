-- Create enum for student verification status
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create student verifications table
CREATE TABLE public.student_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institute_name TEXT NOT NULL,
  enrollment_id TEXT,
  institute_email TEXT,
  verification_status verification_status DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),
  CONSTRAINT email_or_enrollment_required CHECK (
    institute_email IS NOT NULL OR enrollment_id IS NOT NULL
  )
);

-- Create freelancer access table
CREATE TABLE public.freelancer_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  has_access BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for student_verifications
CREATE POLICY "Users can view their own verification"
  ON public.student_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification"
  ON public.student_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification"
  ON public.student_verifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for freelancer_access
CREATE POLICY "Users can view their own freelancer access"
  ON public.freelancer_access FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add update triggers
CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_student_verifications
  BEFORE UPDATE ON public.student_verifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_freelancer_access
  BEFORE UPDATE ON public.freelancer_access
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically grant freelancer access when student is verified
CREATE OR REPLACE FUNCTION public.grant_freelancer_access_on_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'approved' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'approved') THEN
    INSERT INTO public.freelancer_access (user_id, has_access, granted_at)
    VALUES (NEW.user_id, TRUE, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET has_access = TRUE, granted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-grant freelancer access
CREATE TRIGGER auto_grant_freelancer_access
  AFTER INSERT OR UPDATE ON public.student_verifications
  FOR EACH ROW EXECUTE FUNCTION public.grant_freelancer_access_on_verification();

-- Function to create default freelancer access entry
CREATE OR REPLACE FUNCTION public.create_default_freelancer_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.freelancer_access (user_id, has_access)
  VALUES (NEW.user_id, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create freelancer access on profile creation
CREATE TRIGGER create_freelancer_access_on_profile
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_freelancer_access();