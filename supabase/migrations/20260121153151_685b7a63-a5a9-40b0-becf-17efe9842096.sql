-- Add billing_address column to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN billing_address text;