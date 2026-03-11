-- Add foreign key constraint to bids.freelancer_id referencing user_profiles
-- This allows us to join and fetch freelancer profile information with bids

ALTER TABLE bids
ADD CONSTRAINT bids_freelancer_id_fkey 
FOREIGN KEY (freelancer_id) 
REFERENCES user_profiles(user_id) 
ON DELETE CASCADE;

-- Add index for better query performance when fetching bids with freelancer info
CREATE INDEX IF NOT EXISTS idx_bids_freelancer_id ON bids(freelancer_id);