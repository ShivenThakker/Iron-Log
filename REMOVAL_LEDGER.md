# IronLog Removal Ledger

This ledger tracks removed UI elements, pruned API endpoints, trimmed schemas, and database dependencies according to `REDESIGN_PLAN.md` (Phase 1, Step 1.3).

**Decision Key:**
- `DELETE-ENDPOINT`: Dead endpoint with zero callers across the application. Safe to delete in Phase 5.
- `TRIM`: Endpoint or schema shared with kept features; prune unused fields or realign mismatched route paths.
- `KEEP`: Underlying feature/endpoint is retained (even if specific redundant UI shortcuts were dropped).
- `DB-LATER`: Database columns/tables only used by removed features; deferred to Phase 6.

---

## Ledger Entries

| # | Removed UI element / feature | Frontend code that called it | API endpoint(s) it used | Other callers of that endpoint? | Backend files (route / controller / repo / validator) | DB model / columns touched | Decision |
|---|---|---|---|---|---|---|---|
| 1 | **Exercise Shuffle** (prototype randomizer) | None (`grep -rn "shuffle" apps/mobile` returned 0 matches) | `GET /exercises/shuffle` | None | `apps/api/src/routes/exercise.routes.ts`<br>`apps/api/src/controllers/exercise.controller.ts` | None | `DELETE-ENDPOINT` |
| 2 | **AI Text Feedback** (prototype feedback submission) | None (`grep -rn "/ai/feedback" apps/mobile` returned 0 matches) | `POST /ai/feedback` | None | `apps/api/src/routes/ai.routes.ts`<br>`apps/api/src/controllers/ai.controller.ts`<br>`apps/api/src/validators/ai.validator.ts` | None | `DELETE-ENDPOINT` |
| 3 | **AI Plan Alias** (`/ai/plan` duplicate of `/ai/generate-plan`) | None (Mobile onboarding calls `POST /ai/generate-plan`) | `POST /ai/plan` | None | `apps/api/src/routes/ai.routes.ts` | None | `DELETE-ENDPOINT` |
| 4 | **AI Workout Analyze** (standalone analysis endpoint) | None (`grep -rn "/ai/analyze" apps/mobile` returned 0 matches) | `POST /ai/analyze` | None | `apps/api/src/routes/ai.routes.ts`<br>`apps/api/src/controllers/ai.controller.ts` | None | `DELETE-ENDPOINT` |
| 5 | **Google OAuth Sign-in** (app uses email/password auth) | None (`grep -rn "google" apps/mobile` returned 0 matches for auth) | `POST /auth/google` | None | `apps/api/src/routes/auth.routes.ts`<br>`apps/api/src/controllers/auth.controller.ts`<br>`apps/api/src/validators/auth.validator.ts` | `User.google_id` (kept in DB) | `DELETE-ENDPOINT` |
| 6 | **Standalone Trophies List** (trophies returned in `/gamification`) | None (Mobile reads `gamificationData.trophies` from `GET /gamification`) | `GET /gamification/trophies` | None | `apps/api/src/routes/gamification.routes.ts`<br>`apps/api/src/controllers/gamification.controller.ts` | None | `DELETE-ENDPOINT` |
| 7 | **Manual Check-Trophies Trigger** (trophies checked on session finish) | None (`grep -rn "check-trophies" apps/mobile` returned 0 matches) | `POST /gamification/check-trophies` | None | `apps/api/src/routes/gamification.routes.ts`<br>`apps/api/src/controllers/gamification.controller.ts` | None | `DELETE-ENDPOINT` |
| 8 | **Standalone Personal Record Routes** (PRs embedded in `/analytics/stats` & session finish) | None (`grep -rn "/prs" apps/mobile` returned 0 matches) | `GET /prs`<br>`GET /prs/recent` | None | `apps/api/src/routes/pr.routes.ts`<br>`apps/api/src/controllers/pr.controller.ts` | None | `DELETE-ENDPOINT` |
| 9 | **Dashboard 4-Shortcut Grid: "Active Session" button** | `apps/mobile/app/(tabs)/index.tsx:322` | Navigated to `/workout/active` | Kept: Today's Workout hero card "Start Workout" button | `apps/mobile/app/(tabs)/index.tsx` | None | `KEEP` |
| 10 | **Dashboard 4-Shortcut Grid: "AI Coach" button** | `apps/mobile/app/(tabs)/index.tsx:334` | Navigated to `/ai/chat` | Kept: Floating Action Button (FAB) on Dashboard & `POST /ai/chat` | `apps/mobile/app/(tabs)/index.tsx`<br>`apps/mobile/app/ai/chat.tsx` | None | `KEEP` |
| 11 | **16-Step Onboarding Granular Wizard** (consolidated to 4 steps) | `apps/mobile/app/onboarding/index.tsx` | `PUT /users/profile`<br>`POST /equipment`<br>`POST /body/weight`<br>`POST /ai/generate-plan` | All 4 endpoints called by Step 4 of the new Stitch onboarding | `apps/mobile/app/onboarding/index.tsx` | None | `KEEP` |
| 12 | **Mismatched Analytics Route Paths** in Mobile Insights | `apps/mobile/app/(tabs)/insights.tsx` | Called `/analytics/overview`, `/analytics/muscle-heatmap`, `/analytics/muscle-balance`, `/analytics/equipment-distribution` (404s) | Real endpoints are `/analytics/stats`, `/analytics/heatmap`, `/analytics/radar`, `/analytics/equipment` | `apps/mobile/app/(tabs)/insights.tsx` | None | `TRIM` |
| 13 | **Mismatched Body Route Paths** in Mobile Body | `apps/mobile/app/(tabs)/body.tsx` | Called `/body/weight/history`, `/body/measurements/history`, `/body/measurements` (404s) | Real endpoints are `GET /body/weight`, `POST /body/weight`, `POST /body/measurement` | `apps/mobile/app/(tabs)/body.tsx` | None | `TRIM` |
| 14 | **Mismatched Session History Route Path** in Mobile Dashboard | `apps/mobile/app/(tabs)/index.tsx` | Called `GET /sessions/history` (404) | Real endpoint is `GET /sessions` | `apps/mobile/app/(tabs)/index.tsx` | None | `TRIM` |
