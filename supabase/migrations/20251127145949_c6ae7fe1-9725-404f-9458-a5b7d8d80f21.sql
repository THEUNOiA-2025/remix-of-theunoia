-- Add bidding_deadline column to user_projects table
ALTER TABLE public.user_projects 
ADD COLUMN bidding_deadline TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the column
COMMENT ON COLUMN public.user_projects.bidding_deadline IS 'Deadline for placing bids on this project. After this time, no new bids can be placed.';