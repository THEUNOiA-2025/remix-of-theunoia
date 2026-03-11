# Client System Documentation

This folder contains documentation about client-related backend requirements.

## Key Points

1. **Clients do NOT need credits.** They can post projects for free.
2. **Clients need to see freelancer profiles** when viewing bids on their projects.

---

## Issue 1: Credit System

Only freelancers need credits for certain actions (posting work requirements, placing bids, etc.).

### Current Status
- **Frontend:** Using `client_project` type as a workaround to bypass credit deduction
- **Backend:** Needs modification to skip credit deduction for clients

### Documentation
- [BACKEND-CHANGES-REQUIRED.md](./BACKEND-CHANGES-REQUIRED.md) - Detailed instructions

### Frontend Checklist (After Backend Fix)
- [ ] **PostProjectPage.tsx**: Change `'client_project'` → `'work_requirement'`
- [ ] **Client ProjectsPage.tsx**: Change `.in([...])` → `.eq("work_requirement")`
- [ ] **Freelancer ProjectsPage.tsx**: Change `.in([...])` → `.eq("work_requirement")`

---

## Issue 2: Bid Viewing (NEW - NEEDS MIGRATION)

### Problem
Clients cannot see freelancer names/profiles when viewing bids due to Row Level Security (RLS) policies blocking access to `user_profiles` table.

### Solution
A new migration has been created that adds an RPC function:

```
supabase/migrations/20260203120000_get_project_bids_with_profiles.sql
```

### To Deploy (REQUIRED)
Run the migration using Supabase CLI:
```bash
supabase db push
```
Or apply the SQL manually in Supabase Dashboard → SQL Editor.

### What the Function Does
- Creates `get_project_bids_with_profiles(_project_id UUID)` function
- Only allows project owners to fetch bids for their own projects
- Returns freelancer profile info (name, picture) with each bid
- Uses SECURITY DEFINER to bypass RLS safely

### After Migration
Freelancer names will automatically appear in the client's bid list - the frontend code is already updated to use this function.

---

## Quick Reference

| User Type  | Post Projects | Credits Needed |
|------------|---------------|----------------|
| Client     | ✅ Yes        | ❌ No (FREE)   |
| Freelancer | ✅ Yes        | ✅ Yes (10)    |
