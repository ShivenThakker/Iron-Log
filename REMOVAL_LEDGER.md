# IronLog Removal Ledger

This ledger tracks candidates for endpoint pruning, feature deprecation, and database impact.
Strict rule: **No endpoint or backend code is deleted without explicit human approval.**

---

## 1. Dead Endpoints Found by Model (Requesting User Decision)

These endpoints exist in the backend codebase but have **zero callers** across the mobile frontend. They are categorized with complete backend files and database impacts for your review.

| # | Endpoint & Method | Purpose / Origin | Frontend Callers | Backend Files (Route / Controller / Service / Validator / Env) | DB Model / Columns Touched | Status & Recommendation |
|---|---|---|---|---|---|---|
| 1 | `GET /exercises/shuffle` | Prototype random exercise picker | None (`grep -rn "shuffle" apps/mobile` = 0) | `apps/api/src/routes/exercise.routes.ts`<br>`apps/api/src/controllers/exercise.controller.ts` | None | **Candidate for `DELETE-ENDPOINT`**.<br>*Model recommendation:* Delete (unused prototype). |
| 2 | `POST /ai/feedback` | Prototype text feedback submission (mapped `prompt` to `chatCompletion`) | None (`grep -rn "/ai/feedback" apps/mobile` = 0) | `apps/api/src/routes/ai.routes.ts`<br>`apps/api/src/controllers/ai.controller.ts`<br>`apps/api/src/validators/ai.validator.ts` (`textFeedbackSchema`)<br>`apps/api/src/services/gemini.service.ts` (`getTextFeedback`)<br>`apps/api/src/services/gemini.fallbacks.ts` (`textFeedback`) | None | **Candidate for `DELETE-ENDPOINT`**.<br>*Note:* `POST /ai/chat` remains the active coach endpoint. |
| 3 | `POST /ai/plan` | Duplicate route alias of `/ai/generate-plan` | None (Onboarding calls `POST /ai/generate-plan`) | `apps/api/src/routes/ai.routes.ts` | None | **Candidate for `DELETE-ENDPOINT`** (Route-only removal; handler `generatePlan` is shared with `/ai/generate-plan`). |
| 4 | `POST /ai/analyze` | Standalone routine analysis (returns 3 bullet suggestions) | None (`grep -rn "/ai/analyze" apps/mobile` = 0) | `apps/api/src/routes/ai.routes.ts`<br>`apps/api/src/controllers/ai.controller.ts`<br>`apps/api/src/services/gemini.service.ts` (`analyzeRoutine`)<br>`apps/api/src/services/gemini.fallbacks.ts` (`routineAnalysis`, `routineAnalysisError`) | None written directly.<br>*DB Impact Check:* `AiPeriodizationSuggestion` in `schema.prisma` is currently unwritten by this endpoint. | **ON HOLD (Pending User Decision)**.<br>*Question for User:* Do you want the Insights screen or AI coach to offer automated routine analysis, or should this endpoint be removed? |
| 5 | `POST /auth/google` | Google OAuth token verification | None (App uses email/password auth) | `apps/api/src/routes/auth.routes.ts`<br>`apps/api/src/controllers/auth.controller.ts`<br>`apps/api/src/validators/auth.validator.ts` (`googleAuthSchema`)<br>`apps/api/src/services/auth.service.ts` (`googleAuth`)<br>`apps/api/src/lib/env.ts` (`GOOGLE_CLIENT_ID`) | `User` (`email`, `name`, `password_hash` null) | **ON HOLD (Pending User Decision)**.<br>*Context:* Hardened in audit fix F10. Will you ever want Google sign-in on mobile, or delete it? |
| 6 | `GET /gamification/trophies` | Standalone trophies query | None (Mobile reads `gamificationData.trophies` from `GET /gamification`) | `apps/api/src/routes/gamification.routes.ts`<br>`apps/api/src/controllers/gamification.controller.ts` | `UserTrophy`, `Trophy` (reads only) | **Candidate for `DELETE-ENDPOINT`**.<br>*Confirmed:* `GET /gamification` returns all trophies for the Achievements tab. |
| 7 | `POST /gamification/check-trophies` | Standalone manual trophy evaluation trigger | None (`grep -rn "check-trophies" apps/mobile` = 0) | `apps/api/src/routes/gamification.routes.ts`<br>`apps/api/src/controllers/gamification.controller.ts` | `UserTrophy` (writes unlocked trophies) | **Candidate for `DELETE-ENDPOINT` (Route & Controller only)**.<br>*Confirmed:* Trophy evaluation logic in `gamification.repository.ts` is preserved for `finishSession`. |
| 8 | `GET /prs`<br>`GET /prs/recent` | Standalone personal record read endpoints | None (`grep -rn "/prs" apps/mobile` = 0) | `apps/api/src/routes/pr.routes.ts`<br>`apps/api/src/controllers/pr.controller.ts`<br>`apps/api/src/index.ts` (`app.use('/prs', prRoutes)`) | `PersonalRecord` (reads only) | **Candidate for `DELETE-ENDPOINT` (Read routes & mount only)**.<br>*Confirmed:* PR detection engine (`prDetection.ts`) and repository from fix F4 are preserved. |

---

## 2. Features Removed / Modified by User's Stitch Redesign

| # | Removed / Modified Feature | Frontend Caller | Target API Endpoint(s) | Other Callers? | Backend Files | DB Model / Columns Touched | Decision & Analysis |
|---|---|---|---|---|---|---|---|
| 9 | **16-Step Onboarding Clutter** (Refined to 4 steps in Stitch) | `apps/mobile/app/onboarding/index.tsx` | `PUT /users/profile`<br>`POST /equipment`<br>`POST /body/weight`<br>`POST /ai/generate-plan` | All 4 endpoints called by Step 4 of the new Stitch onboarding | `apps/api/src/controllers/user.controller.ts` | `User.session_duration_min`<br>`User.activity_level` | **KEEP (Backend intact)**.<br>*Validator & AI Coach Check:*<br>• `updateProfileSchema` has all fields optional.<br>• `User.session_duration_min` defaults to `60` in DB.<br>• AI coach only reads `name`, `fitness_goal`, and `experience_level`, which the 4-step wizard fully provides.<br>• No validator errors or missing required fields. |

---

## 3. Database Migration Protocol (Postgres vs SQLite)

- **Development:** Local API uses SQLite (`prisma/dev.db`).
- **Production:** Supabase uses PostgreSQL.
- **Rule:** `prisma migrate dev` output on SQLite **cannot** be deployed to Supabase Postgres.
- **Process:** Any future schema modifications in Phase 6 will follow the established protocol in `apps/api/prisma/manual/` (hand-crafted, vendor-neutral / Postgres-verified SQL, similar to `apps/api/prisma/manual/pr_unique_per_set.sql`).
- **Current status:** None of the entries above require database schema migrations.
