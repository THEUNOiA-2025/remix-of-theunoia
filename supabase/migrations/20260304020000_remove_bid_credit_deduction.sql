-- Remove the trigger that deducts credits when placing a bid
DROP TRIGGER IF EXISTS tr_deduct_bid_credits ON public.bids;
DROP FUNCTION IF EXISTS deduct_bid_credits();
