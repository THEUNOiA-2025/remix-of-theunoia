# Client Credit System - Backend Changes Required

## Overview

**Clients should NOT require credits to post projects.** The credit system should only apply to freelancers.

Currently, the database has a trigger that deducts 10 credits when ANY user posts a `work_requirement` project. This needs to be modified so that clients can post projects freely.

## Current Issue

The trigger `deduct_credits_for_project()` in migration file `20260106181627_1aabec5d-f25b-41b2-870c-3cdfed9cc370.sql` deducts credits for ALL users posting work requirements, regardless of whether they are a client or freelancer.

## Temporary Frontend Workaround

To allow testing, the frontend currently uses `project_type: 'client_project'` instead of `'work_requirement'` for client-posted projects. This bypasses the credit deduction trigger.

**Files using the workaround:**
- `src/pages/client/projects/PostProjectPage.tsx` - Posts with `project_type: 'client_project'`
- `src/pages/client/projects/ProjectsPage.tsx` - Fetches both `work_requirement` and `client_project` types
- `src/pages/freelancer/projects/ProjectsPage.tsx` - Browse includes both types

## Required Backend Changes

### Option 1: Modify the Trigger (Recommended)

Update the `deduct_credits_for_project()` function to check the user's `user_type` and skip credit deduction for clients:

```sql
CREATE OR REPLACE FUNCTION deduct_credits_for_project()
RETURNS TRIGGER AS $$
DECLARE
  current_balance INTEGER;
  credit_cost INTEGER := 10;
  user_role TEXT;
BEGIN
  -- Only deduct for work_requirement projects (not portfolio projects)
  IF NEW.project_type != 'work_requirement' THEN
    RETURN NEW;
  END IF;

  -- Check if user is a client - clients don't need credits
  SELECT user_type INTO user_role
  FROM user_profiles
  WHERE user_id = NEW.user_id;

  -- Skip credit deduction for clients
  IF user_role = 'client' THEN
    RETURN NEW;
  END IF;

  -- Rest of the existing credit deduction logic for freelancers...
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
```

### Option 2: Remove Trigger for Client Projects

If you want to keep `client_project` as a separate type, just ensure the trigger only fires for `work_requirement`:

The current trigger already does this:
```sql
IF NEW.project_type != 'work_requirement' THEN
  RETURN NEW;
END IF;
```

**If using Option 2, no backend changes needed** - just keep using `client_project` type for client posts.

## After Backend Changes - FRONTEND TODO

Once the backend team has modified the trigger to skip credit deduction for clients, the frontend needs these changes:

---

### Step 1: Update `src/pages/client/projects/PostProjectPage.tsx`

**Line ~97** - Change project_type back to `work_requirement`:

```typescript
// CHANGE FROM:
project_type: 'client_project',

// CHANGE TO:
project_type: 'work_requirement',
```

---

### Step 2: Update `src/pages/client/projects/ProjectsPage.tsx`

**Line ~89** - Change from `.in()` to `.eq()`:

```typescript
// CHANGE FROM:
.in("project_type", ["work_requirement", "client_project"])

// CHANGE TO:
.eq("project_type", "work_requirement")
```

---

### Step 3: Update `src/pages/freelancer/projects/ProjectsPage.tsx`

**Line ~273 and ~286** - Change from `.in()` to `.eq()`:

```typescript
// CHANGE FROM:
.in("project_type", ["work_requirement", "client_project"])

// CHANGE TO:
.eq("project_type", "work_requirement")
```

---

### Quick Summary Table

| File | Line | Change |
|------|------|--------|
| `src/pages/client/projects/PostProjectPage.tsx` | ~97 | `'client_project'` → `'work_requirement'` |
| `src/pages/client/projects/ProjectsPage.tsx` | ~89 | `.in([...])` → `.eq("work_requirement")` |
| `src/pages/freelancer/projects/ProjectsPage.tsx` | ~273, ~286 | `.in([...])` → `.eq("work_requirement")` |

## Summary

| User Type | Can Post Projects | Credits Required |
|-----------|-------------------|------------------|
| Client    | Yes               | **No** (FREE)    |
| Freelancer| Yes               | Yes (10 credits) |

## Files Reference

### Database Migration
- `supabase/migrations/20260106181627_1aabec5d-f25b-41b2-870c-3cdfed9cc370.sql`

### Frontend Files (using workaround)
- `src/pages/client/projects/PostProjectPage.tsx`
- `src/pages/client/projects/ProjectsPage.tsx`
- `src/pages/freelancer/projects/ProjectsPage.tsx`
