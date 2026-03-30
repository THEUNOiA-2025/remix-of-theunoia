-- Update the invoices table to support phase payments and GST

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'phase_payment' CHECK (invoice_type IN ('phase_payment', 'advance_payment')),
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2);

-- Update existing rows if any to have amount = total_amount for consistency
UPDATE public.invoices SET 
    total_amount = amount,
    subtotal_amount = amount,
    gst_amount = 0
WHERE total_amount IS NULL;
