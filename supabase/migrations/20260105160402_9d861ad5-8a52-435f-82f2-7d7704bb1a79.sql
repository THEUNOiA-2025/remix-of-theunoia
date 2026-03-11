-- Create enum for transaction types
CREATE TYPE credit_transaction_type AS ENUM (
  'bid_placed',
  'admin_grant',
  'admin_deduct',
  'signup_bonus',
  'refund'
);

-- Create freelancer_credits table
CREATE TABLE public.freelancer_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_transactions table (audit log)
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  transaction_type credit_transaction_type NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.freelancer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for freelancer_credits
CREATE POLICY "Users can view their own credits"
  ON public.freelancer_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credits"
  ON public.freelancer_credits FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.credit_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Function to get freelancer credit balance
CREATE OR REPLACE FUNCTION public.get_freelancer_credit_balance(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT balance FROM public.freelancer_credits WHERE user_id = _user_id),
    0
  );
$$;

-- Function to check if user has sufficient credits for bidding
CREATE OR REPLACE FUNCTION public.has_sufficient_credits(_user_id UUID, _required_credits INTEGER DEFAULT 10)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT balance >= _required_credits FROM public.freelancer_credits WHERE user_id = _user_id),
    FALSE
  );
$$;

-- Trigger function to deduct credits when a bid is placed
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

-- Create trigger on bids table
CREATE TRIGGER deduct_credits_on_bid
  BEFORE INSERT ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_credits_for_bid();

-- Admin function to add/deduct credits (only callable by admins)
CREATE OR REPLACE FUNCTION public.admin_modify_credits(
  _target_user_id UUID,
  _amount INTEGER,
  _notes TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  trans_type credit_transaction_type;
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can modify credits';
  END IF;

  -- Get or create credits record
  SELECT balance INTO current_balance
  FROM public.freelancer_credits
  WHERE user_id = _target_user_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    -- Create new record
    INSERT INTO public.freelancer_credits (user_id, balance)
    VALUES (_target_user_id, 0);
    current_balance := 0;
  END IF;

  -- Calculate new balance
  new_balance := current_balance + _amount;
  
  -- Ensure balance doesn't go negative
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Cannot deduct more credits than available. Current balance: %', current_balance;
  END IF;

  -- Determine transaction type
  IF _amount > 0 THEN
    trans_type := 'admin_grant';
  ELSE
    trans_type := 'admin_deduct';
  END IF;

  -- Update balance
  UPDATE public.freelancer_credits
  SET balance = new_balance, updated_at = now()
  WHERE user_id = _target_user_id;

  -- Log the transaction
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    notes,
    created_by
  ) VALUES (
    _target_user_id,
    _amount,
    new_balance,
    trans_type,
    _notes,
    auth.uid()
  );

  RETURN new_balance;
END;
$$;

-- Initialize credits for existing verified freelancers
INSERT INTO public.freelancer_credits (user_id, balance)
SELECT fa.user_id, 50
FROM public.freelancer_access fa
WHERE fa.has_access = true
ON CONFLICT (user_id) DO NOTHING;

-- Log signup bonus for initialized users
INSERT INTO public.credit_transactions (user_id, amount, balance_after, transaction_type, notes)
SELECT fc.user_id, 50, 50, 'signup_bonus', 'Initial signup bonus credits'
FROM public.freelancer_credits fc
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_transactions ct 
  WHERE ct.user_id = fc.user_id
);

-- Create trigger to give new verified freelancers initial credits
CREATE OR REPLACE FUNCTION public.grant_initial_credits_on_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.has_access = TRUE AND (OLD.has_access IS NULL OR OLD.has_access = FALSE) THEN
    -- Insert or update credits
    INSERT INTO public.freelancer_credits (user_id, balance)
    VALUES (NEW.user_id, 50)
    ON CONFLICT (user_id) DO UPDATE SET balance = freelancer_credits.balance + 50;

    -- Log the transaction
    INSERT INTO public.credit_transactions (
      user_id,
      amount,
      balance_after,
      transaction_type,
      notes
    ) VALUES (
      NEW.user_id,
      50,
      (SELECT balance FROM public.freelancer_credits WHERE user_id = NEW.user_id),
      'signup_bonus',
      'Initial signup bonus credits on verification approval'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on freelancer_access
CREATE TRIGGER grant_credits_on_freelancer_verification
  AFTER INSERT OR UPDATE ON public.freelancer_access
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_initial_credits_on_verification();