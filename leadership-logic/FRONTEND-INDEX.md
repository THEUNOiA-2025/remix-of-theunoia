# Leadership Logic – Frontend Index

Quick reference for where this logic is implemented in the frontend.

| Logic | File(s) |
|-------|--------|
| Client search bar + dropdown (by role/skills, top 10) | `src/components/DashboardLayout.tsx` (client search state, `fetchFreelancerSearch`, dropdown UI) |
| Freelancer dashboard popup (metric card on click) | `src/components/DashboardLayout.tsx` (Dialog, `selectedFreelancer`, `FreelancerDashboardCard`) |
| Leadership Board metric card (same as popup) | `src/components/FreelancerDashboardCard.tsx` |
| Freelancer Leadership Board page | `src/pages/freelancer/leadership/LeadershipPage.tsx` |
| Profile – Role and skills (source of role/skills for search) | `src/pages/freelancer/profile/EditProfilePage.tsx` (role input, skills; stored in localStorage and optionally `user_skills`) |
| Profile – display role and skills | `src/pages/freelancer/profile/ProfilePage.tsx` |

**Backend wiring:** When APIs are ready, plug them into:
- `DashboardLayout.tsx`: replace or extend `fetchFreelancerSearch` to call search-by-role/skills and return top 10; pass real dashboard data into `FreelancerDashboardCard` in the popup.
- `LeadershipPage.tsx`: fetch On-Time Delivery %, Overall Rating %, Successful/In Progress/Pending, and Quality of Work Mastery from backend (see LOGIC.md).
