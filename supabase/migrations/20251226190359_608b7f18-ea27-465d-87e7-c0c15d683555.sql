-- Create email_verification_codes table for storing OTP codes
CREATE TABLE public.email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for fast lookups
CREATE INDEX idx_email_verification_lookup 
  ON public.email_verification_codes(user_id, email, code);

-- Enable RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_verification_codes
CREATE POLICY "Users can view their own codes"
  ON public.email_verification_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own codes"
  ON public.email_verification_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add email_verified columns to student_verifications
ALTER TABLE public.student_verifications 
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;