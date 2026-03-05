-- 1. Restore the trigger to deduct 10 credits when placing a bid
CREATE OR REPLACE FUNCTION public.deduct_credits_for_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  credit_cost INTEGER := 10;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM public.freelancer_credits
  WHERE user_id = NEW.freelancer_id
  FOR UPDATE;

  -- Check if user has credits record
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits. You need % credits to place a bid.', credit_cost;
  END IF;

  -- Check if sufficient credits
  IF current_balance < credit_cost THEN
    RAISE EXCEPTION 'Insufficient credits. You have % credits but need % to place a bid.', current_balance, credit_cost;
  END IF;

  -- Deduct credits
  new_balance := current_balance - credit_cost;
  
  UPDATE public.freelancer_credits
  SET balance = new_balance, updated_at = now()
  WHERE user_id = NEW.freelancer_id;

  -- Log the transaction
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    reference_id,
    notes
  ) VALUES (
    NEW.freelancer_id,
    -credit_cost,
    new_balance,
    'bid_placed',
    NEW.id,
    'Credits deducted for bid on project'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deduct_credits_on_bid ON public.bids;
CREATE TRIGGER deduct_credits_on_bid
  BEFORE INSERT ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_credits_for_bid();

-- 2. Give 100 credits to all existing users
UPDATE public.freelancer_credits
SET balance = 100;

-- Optionally, insert a row for anyone who didn't have one before
INSERT INTO public.freelancer_credits (user_id, balance)
SELECT id, 100 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 3. Create a trigger that gives 100 free credits IMMEDIATELY upon user creation
CREATE OR REPLACE FUNCTION public.grant_initial_credits_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We insert the starting 100 credits for every new user. 
  -- We don't wait for verification.
  INSERT INTO public.freelancer_credits (user_id, balance)
  VALUES (NEW.id, 100)
  ON CONFLICT (user_id) DO NOTHING;

  -- Log the initial signup transaction transaction
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    notes
  ) VALUES (
    NEW.id,
    100,
    100,
    'signup_bonus',
    'Free 100 credits provided upon account creation.'
  );

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_initial_credits_on_signup();

-- Clean up the old verification-based trigger, since we now grant on creation.
DROP TRIGGER IF EXISTS grant_credits_on_freelancer_verification ON public.freelancer_access;
DROP FUNCTION IF EXISTS public.grant_initial_credits_on_verification();
