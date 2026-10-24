# Dead API Calls & Mobile Caller Audit (Step 4.1)

Generated at Phase 4 (Step 4.1) after completing the redesign of all 11 mobile screens against the Obsidian Kinetic design system and realigned backend endpoints.

---

## 1. Mobile Client Export Audit (`apps/mobile/services/api.ts`)

`apps/mobile/services/api.ts` exports:
- `API_URL`: Resolved server base URL. Used in `api.ts` interceptors for token refresh.
- `api`: Root Axios client instance with auth interceptors. Used directly by every screen via `api.get(...)`, `api.post(...)`, `api.put(...)`.

**Result:** There are NO dead exported helper functions or custom query hooks in `services/api.ts`. All mobile network requests are issued directly through `api.<method>` from screen components.

---

## 2. Active Mobile API Endpoints (Live Call Sites)

| Endpoint | Method | Mobile Caller File(s) | Purpose |
|---|---|---|---|
| `/auth/login` | POST | `apps/mobile/app/login.tsx` | User login |
| `/auth/register` | POST | `apps/mobile/app/register.tsx` | User registration |
| `/auth/refresh` | POST | `apps/mobile/services/api.ts` | 401 token refresh interceptor (F8) |
| `/auth/logout` | POST | `apps/mobile/app/settings/index.tsx` | Logout with `refreshToken` invalidation (F13) |
| `/users/profile` | GET | `apps/mobile/app/(tabs)/index.tsx`, `apps/mobile/app/settings/index.tsx` | Fetch user profile & biometrics |
| `/users/profile` | PUT | `apps/mobile/app/onboarding/index.tsx` | Save onboarding profile biometrics & goals |
| `/exercises` | GET | `apps/mobile/app/workout/active.tsx`, `apps/mobile/app/program/builder.tsx` | Exercise library lookup (F9 invariant preserved) |
| `/programs/active` | GET | `apps/mobile/app/(tabs)/index.tsx` | Active training program lookup |
| `/programs/full` | POST | `apps/mobile/app/program/builder.tsx` | Save newly created training routine |
| `/sessions` | GET | `apps/mobile/app/(tabs)/index.tsx` | Workout history / recent workouts query |
| `/sessions` | POST | `apps/mobile/app/workout/active.tsx` | Start new workout session |
| `/sessions/:id/sets` | POST | `apps/mobile/app/workout/active.tsx` | Log completed exercise set |
| `/sessions/:id/finish` | PUT | `apps/mobile/app/workout/active.tsx` | Finalize session and trigger trophies |
| `/nutrition/daily/:date` | GET | `apps/mobile/app/(tabs)/index.tsx`, `apps/mobile/app/(tabs)/nutrition.tsx` | Daily nutrition breakdown & calorie summary |
| `/nutrition/search?q=...` | GET | `apps/mobile/app/(tabs)/nutrition.tsx` | USDA food search query |
| `/nutrition/log` | POST | `apps/mobile/app/(tabs)/nutrition.tsx` | Log consumed food meal |
| `/body/weight` | GET | `apps/mobile/app/(tabs)/body.tsx` | Weight history chart query |
| `/body/weight` | POST | `apps/mobile/app/(tabs)/body.tsx`, `apps/mobile/app/onboarding/index.tsx` | Log body weight measurement |
| `/body/measurement` | POST | `apps/mobile/app/(tabs)/body.tsx` | Log circumferences (Chest, Arms, Waist, Thighs) |
| `/ai/chat` | POST | `apps/mobile/app/ai/chat.tsx` | AI Coach conversational query (F5 limit preserved) |
| `/ai/generate-plan` | POST | `apps/mobile/app/onboarding/index.tsx` | Background routine generation after onboarding |
| `/ai/parse-plan` | POST | `apps/mobile/app/program/builder.tsx` | AI workout document/image OCR parser (F5 limit preserved) |
| `/gamification` | GET | `apps/mobile/app/(tabs)/index.tsx`, `apps/mobile/app/(tabs)/achievements.tsx`, `apps/mobile/app/workout/summary.tsx` | XP, rank, level, streaks, and unlocked trophy case |
| `/analytics/stats` | GET | `apps/mobile/app/(tabs)/insights.tsx` | High-level analytics stats summary |
| `/analytics/heatmap?period=...` | GET | `apps/mobile/app/(tabs)/insights.tsx` | Muscle intensity heatmap data |
| `/analytics/radar` | GET | `apps/mobile/app/(tabs)/insights.tsx` | Kinetic muscle radar chart data |
| `/analytics/equipment` | GET | `apps/mobile/app/(tabs)/insights.tsx` | Equipment usage breakdown |
| `/equipment` | POST | `apps/mobile/app/onboarding/index.tsx` | Set gym equipment profile |

---

## 3. Re-Verification of Candidates in Removal Ledger (Step 4.1)

### A. Candidate Removal Endpoints (Rows 1-3, 6-8) — Verified 0 Mobile Callers

| Row # | Method & Endpoint | Mobile Callers Found | Details |
|---|---|:---:|---|
| **1** | `GET /exercises/shuffle` | **0** | Never called by mobile. Exercise list is retrieved via `GET /exercises` and searched/shuffled client-side if needed. |
| **2** | `POST /ai/feedback` | **0** | Prototype feedback endpoint. No mobile screen contains a feedback submission flow. |
| **3** | `POST /ai/plan` | **0** | Redundant route alias pointing to `aiController.generatePlan`. The mobile onboarding flow explicitly calls `POST /ai/generate-plan`. |
| **6** | `GET /gamification/trophies` | **0** | Redundant standalone endpoint. The mobile client queries `GET /gamification`, which returns the user profile, rank, XP, streaks, and full trophy list in a single unified payload. |
| **7** | `POST /gamification/check-trophies` | **0** | Standalone manual check route. In production, trophies are evaluated automatically when finishing a workout via `PUT /sessions/:id/finish`. Client does not call this route. |
| **8** | `GET /prs` & `GET /prs/recent` | **0** | The mobile client displays PR celebrations inside the active workout and summary screen from the set response and session state. The standalone read routes under `/prs` have 0 mobile callers. |

### B. Intentionally Unused / Planned Endpoints (Rows 4, 5) — Verified KEEP

| Row # | Method & Endpoint | Status | Decision & Guardrails |
|---|---|---|---|
| **4** | `POST /ai/analyze` | Planned | **KEEP**: Planned for future routine periodization analysis. Do NOT delete or modify. Unwired in UI. |
| **5** | `POST /auth/google` | Planned | **KEEP**: Hardened in audit fix F10. Planned for future Google Sign-In. Fails closed safely if `GOOGLE_CLIENT_ID` is unset. Unwired in UI. |

---

## 4. Other Uncalled Backend Endpoints (Framework / Internal / CRUD)

These endpoints currently have 0 mobile callers, but represent standard backend resources, internal jobs, or admin tools. They are **NOT** in the removal ledger and must **NOT** be deleted:
- `GET /health` (Internal health check / orchestrator probes)
- `POST /exercises/` (Admin exercise catalog management)
- `GET /exercises/:id` (Direct exercise detail query)
- `GET /programs/`, `GET /programs/:id`, `POST /programs/`, `POST /programs/day`, `PUT /programs/:id`, `PUT /programs/:id/activate`, `DELETE /programs/:id` (Extended program management CRUD)
- `GET /sessions/:id` (Direct session detail query)
- `GET /nutrition/daily` (Daily nutrition without date parameter)
- `GET /equipment/`, `PUT /equipment/:id/active` (Extended equipment profile queries)
- `POST /cron/streaks` (Cron job for automated streak recalculation)
