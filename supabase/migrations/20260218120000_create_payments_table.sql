
-- Create payments table to track Razorpay transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.user_projects(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'captured', 'failed', 'refunded')),
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- RLS Policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow users to view payments for their own projects (either as client or freelancer)
CREATE POLICY "Users can view payments for their projects"
ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_projects up
    WHERE up.id = payments.project_id
    AND (up.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.bids b
      WHERE b.project_id = up.id
      AND b.freelancer_id = auth.uid()
      AND b.status = 'accepted'
    ))
  )
);

-- Edge functions will use service role key to insert/update, so no specific insert policy for authed users needed if we stick to that pattern.
-- However, if we want to allow direct insert from authenticated client (not recommended for payments), we'd add it here.
-- sticking to service_role for updates ensures integrity.
