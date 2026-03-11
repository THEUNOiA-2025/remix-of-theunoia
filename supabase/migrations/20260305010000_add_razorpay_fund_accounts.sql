-- Migration: Add Razorpay Contact and Fund Account IDs to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS razorpay_contact_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_fund_account_id TEXT;
