-- Add 'project_posted' to credit_transaction_type enum
ALTER TYPE credit_transaction_type ADD VALUE IF NOT EXISTS 'project_posted';

-- Create trigger function to deduct credits when posting a project
CREATE OR REPLACE FUNCTION deduct_credits_for_project()
RETURNS TRIGGER AS $$
DECLARE
  current_balance INTEGER;
  credit_cost INTEGER := 10;
BEGIN
  -- Only deduct for work_requirement projects (not portfolio projects)
  IF NEW.project_type != 'work_requirement' THEN
    RETURN NEW;
  END IF;

  -- Get current balance
  SELECT balance INTO current_balance
  FROM freelancer_credits
  WHERE user_id = NEW.user_id
  FOR UPDATE;

  -- If no credit record exists, create one with 0 balance
  IF current_balance IS NULL THEN
    INSERT INTO freelancer_credits (user_id, balance)
    VALUES (NEW.user_id, 0);
    current_balance := 0;
  END IF;

  -- Check if user has sufficient credits
  IF current_balance < credit_cost THEN
    RAISE EXCEPTION 'Insufficient credits. You need % credits to post a task. Current balance: %', credit_cost, current_balance;
  END IF;

  -- Deduct credits
  UPDATE freelancer_credits
  SET balance = balance - credit_cost,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;

  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    reference_id,
    notes
  ) VALUES (
    NEW.user_id,
    -credit_cost,
    current_balance - credit_cost,
    'project_posted',
    NEW.id,
    'Credits deducted for posting task: ' || NEW.title
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for project creation
DROP TRIGGER IF EXISTS deduct_credits_on_project_insert ON user_projects;
CREATE TRIGGER deduct_credits_on_project_insert
  BEFORE INSERT ON user_projects
  FOR EACH ROW
  EXECUTE FUNCTION deduct_credits_for_project();

-- Create function to check if user has sufficient credits
CREATE OR REPLACE FUNCTION has_sufficient_credits(_user_id UUID, _required_credits INTEGER DEFAULT 10)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT balance INTO current_balance
  FROM freelancer_credits
  WHERE user_id = _user_id;

  IF current_balance IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN current_balance >= _required_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant initial credits (50) to all existing users who don't have credits yet
INSERT INTO freelancer_credits (user_id, balance)
SELECT up.user_id, 50
FROM user_profiles up
LEFT JOIN freelancer_credits fc ON fc.user_id = up.user_id
WHERE fc.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Log signup bonus for newly added users
INSERT INTO credit_transactions (user_id, amount, balance_after, transaction_type, notes)
SELECT fc.user_id, 50, 50, 'signup_bonus', 'Initial signup bonus credits'
FROM freelancer_credits fc
LEFT JOIN credit_transactions ct ON ct.user_id = fc.user_id AND ct.transaction_type = 'signup_bonus'
WHERE ct.id IS NULL;