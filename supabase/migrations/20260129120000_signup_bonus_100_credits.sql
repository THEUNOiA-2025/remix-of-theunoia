-- Signup bonus: grant 100 credits (was 50) to match FREE_TOKEN_POLICY.SIGNUP.
-- Affects new freelancers when freelancer_access.has_access becomes true.

CREATE OR REPLACE FUNCTION public.grant_initial_credits_on_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.has_access = TRUE AND (OLD.has_access IS NULL OR OLD.has_access = FALSE) THEN
    -- Insert or update credits: 100 free tokens on signup/verification
    INSERT INTO public.freelancer_credits (user_id, balance)
    VALUES (NEW.user_id, 100)
    ON CONFLICT (user_id) DO UPDATE SET balance = freelancer_credits.balance + 100;

    -- Log the transaction (amount 100)
    INSERT INTO public.credit_transactions (
      user_id,
      amount,
      balance_after,
      transaction_type,
      notes
    ) VALUES (
      NEW.user_id,
      100,
      (SELECT balance FROM public.freelancer_credits WHERE user_id = NEW.user_id),
      'signup_bonus',
      'Signup bonus: 100 free tokens'
    );
  END IF;
  RETURN NEW;
END;
$$;
