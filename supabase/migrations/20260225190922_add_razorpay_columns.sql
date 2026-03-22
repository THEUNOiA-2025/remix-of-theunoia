-- Add Razorpay payment tracking columns to the invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
