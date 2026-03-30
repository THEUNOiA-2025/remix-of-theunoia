CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_verifications(phone);

-- Allow anonymous and authenticated read/write via service role only for security usually,
-- but we'll enable RLS and just use service_role key in edge functions.
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
