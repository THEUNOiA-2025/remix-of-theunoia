-- Create the invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.user_projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.user_profiles(user_id) NOT NULL,
    freelancer_id UUID REFERENCES public.user_profiles(user_id) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    invoice_number TEXT UNIQUE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policies
-- Clients can view invoices where they are the client
CREATE POLICY "Clients can view their own invoices" ON public.invoices
    FOR SELECT
    USING (auth.uid() = client_id);

-- Freelancers can view invoices where they are the freelancer
CREATE POLICY "Freelancers can view their own invoices" ON public.invoices
    FOR SELECT
    USING (auth.uid() = freelancer_id);

-- Freelancers can create invoices (optional, depending on workflow)
CREATE POLICY "Freelancers can create invoices" ON public.invoices
    FOR INSERT
    WITH CHECK (auth.uid() = freelancer_id);

-- Only Admins or System can update status (simplification for now: let involved parties update if needed, but safe default is restricted)
-- For this MVP, let's allow clients to mark as paid (mock payment flow)
CREATE POLICY "Clients can update status of their invoices" ON public.invoices
    FOR UPDATE
    USING (auth.uid() = client_id); 
