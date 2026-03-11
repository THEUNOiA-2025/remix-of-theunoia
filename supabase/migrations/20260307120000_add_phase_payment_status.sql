-- Add payment_status to project_phases
ALTER TABLE public.project_phases 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'pending_verification'));

-- Ensure any existing phases are handled (assuming they are already started for now)
-- You might want to default them to 'paid' if the project is already in progress,
-- but for a clean migration we stick with the default.
