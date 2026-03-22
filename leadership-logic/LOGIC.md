# Leadership & Client Search – Logic (Backend / Frontend)

This document defines the logic for the Freelancer Leadership Board and client-side freelancer search. Use it for backend API design and frontend wiring.

---

## 1. Freelancer Leadership Board (Freelancer side)

**Where:** Freelancer’s Leadership Board page + same card shown in client popup when viewing a freelancer.

**Already from frontend:** Bio, profile picture (from profile).

**Must come from backend:**

### 1.1 Metric card – percentages

| Metric | Source | When it counts |
|--------|--------|----------------|
| **On-Time Delivery %** | Client ratings / backend | Only after **client has submitted a rating** for that freelancer (e.g. after project completion). |
| **Overall Rating %** | Client ratings / backend | Same: only when **client has entered their rating**. |

So: both percentages are **driven by client ratings**; backend aggregates and exposes them per freelancer. Do not count projects where the client has not yet rated.

### 1.2 Metric card – project counts

| Metric | Source | Logic |
|--------|--------|--------|
| **Successful** | Backend | Count of projects where this freelancer’s bid was accepted and project status = completed. (Can be implemented now; logic already exists on frontend via bids + `user_projects.status`.) |
| **In Progress** | Backend | Count where freelancer’s bid accepted and project status = in progress. |
| **Pending** | Backend | Count of this freelancer’s bids with status = pending. |

These three can be implemented now; frontend already uses similar logic (bids + project status).

### 1.3 Quality of Work Mastery (Timeliness, Innovation, Conduct, Accountability)

| Item | Source | When it counts |
|------|--------|----------------|
| Star ratings + progress bars | **Client side only** | Only after **client completes the project** and submits ratings for these dimensions. |

So: Quality of Work Mastery is **client-submitted ratings** after project completion. Backend stores and aggregates these per freelancer and exposes them for the Leadership Board and for the client-facing freelancer dashboard.

**Summary – Leadership Board:**

- Bio, profile picture: already from profile (frontend).
- On-Time Delivery %, Overall Rating %: from backend, based **only on client ratings** (count once client has rated).
- Successful / In Progress / Pending: from backend (can align with current bids + project status logic).
- Quality of Work Mastery: from backend, based **only on client ratings** after project completion.

---

## 2. Client-side search (search bar)

**Who:** Clients (non-student users).

**Behavior:** Client types in the search bar **by role/skills**, not by freelancer name.

- **Role:** Comes from **Profile → Edit Profile → Role** (e.g. “Frontend Developer”, “Backend Developer”, “Videographer”). Stored per user (e.g. `user_profiles` or `user_skills` / role field; currently role is in localStorage `profile_role_skills_${userId}` and optionally in DB).
- **Skills:** From Profile → Role and skills (same place). User can have one role and multiple skills.

**Search logic:**

- Client query (e.g. “frontend developer”, “videographer”) should match:
  - Freelancer **role** (e.g. “Frontend Developer”, “Videographer”),
  - and/or **skills** (e.g. “React”, “Video editing”).
- Backend returns **top 10 freelancers** matching that role/skills (e.g. by relevance or rating).
- Frontend shows dropdown: profile picture (left) + name (right). On click → open **freelancer dashboard popup**.

**Backend needs to support:**

- Search freelancers by **role** and/or **skills**.
- Return top 10 (e.g. by rating, completion count, or relevance).
- Expose at least: `user_id`, `first_name`, `last_name`, `profile_picture_url` (and optionally role/skills for display).

---

## 3. Client clicks a freelancer (e.g. “Videographer” → top 10 → click one)

**Flow:**

1. Client searches by role/skills (e.g. “videographer”) → **top 10** freelancers for that role.
2. Client clicks one freelancer in the dropdown.
3. **Popup opens** with that freelancer’s **dashboard** (same card as Leadership Board).

**Dashboard in popup – data source:**

- **All dashboard data** (On-Time Delivery %, Overall Rating %, Successful / In Progress / Pending, Quality of Work Mastery) must come from **backend**, for **that freelancer only**.
- So: same metrics as Leadership Board, but for the **viewed freelancer**; backend returns these when client is “viewing” a freelancer (e.g. by `freelancer_id` or `user_id`).

**Summary:**

- Search: by **role/skills** → top 10 from backend.
- On click: show **freelancer dashboard** in popup; data **from backend for that freelancer only** (same structure as Leadership Board metrics).

---

## 4. Frontend implementation status

| Piece | Status | Notes |
|-------|--------|--------|
| Leadership Board UI (metric card + Quality of Work Mastery) | Done | Uses mock data; ready to plug in backend. |
| Client search dropdown (by role/skills, top 10, avatar + name) | Done | Currently uses mock + optional backend; backend should provide search by role/skills. |
| Freelancer dashboard popup on click | Done | Shows same card; needs backend to supply real metrics per freelancer. |
| Successful / In Progress / Pending | Partially done | Logic on frontend (bids + project status); backend should own and expose. |
| On-Time Delivery % / Overall Rating % | Mock | Backend: aggregate from **client ratings only**. |
| Quality of Work Mastery | Mock | Backend: from **client ratings after project completion** only. |
| Search by role/skills (not name) | Partially done | Frontend can send query; backend must filter by **role** and **skills** and return top 10. |

---

## 5. Suggested backend APIs (for reference)

1. **GET /api/freelancers/search?q=videographer** (or similar)  
   - Filter by **role** and/or **skills** (not by name).  
   - Return top 10: `user_id`, `first_name`, `last_name`, `profile_picture_url`, optionally role/skills.

2. **GET /api/freelancers/:userId/leadership-dashboard** (or similar)  
   - Returns for that freelancer:  
     - `onTimeDeliveryPercent`, `overallRatingPercent` (from client ratings).  
     - `successful`, `inProgress`, `pending` (from bids + project status).  
     - Quality of Work Mastery (e.g. timeliness, innovation, conduct, accountability) from **client ratings after project completion**.

3. **Role/skills storage**  
   - Persist **role** (e.g. in `user_profiles` or a dedicated table) and **skills** (e.g. `user_skills` or same) so search can filter by them. Currently role/skills are in Edit Profile and partially in localStorage; backend should be source of truth.

---

*Last updated: for release; backend team to implement APIs and data as above.*
