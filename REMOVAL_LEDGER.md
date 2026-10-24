# IronLog Removal Ledger

This ledger tracks candidates for endpoint pruning, intentionally unused planned code, and client realignments.
Strict rule: **No endpoint or backend code is deleted without explicit human approval.**

---

## 1. Dead Endpoints Pruned in Phase 5 (Approved & Completed)

These 6 candidate items (7 endpoints) had 0 callers in the finished mobile app, were approved by the user, and were pruned with dedicated commits after verifying typecheck and tests.

| # | Method & Endpoint | Purpose / Origin | Frontend Callers | Complete Backend Files Modified | DB Model / Columns Touched | Phase 5 Status |
|---|---|---|:---:|---|---|---|
| 1 | `GET /exercises/shuffle` | Prototype exercise randomizer | 0 | `apps/api/src/routes/exercise.routes.ts`<br>`apps/api/src/controllers/exercise.controller.ts`<br>`apps/api/src/repositories/exercise.repository.ts` | None | **PRUNED** (`1066a9a`) |
| 2 | `POST /ai/feedback` | Prototype text feedback submission | 0 | `apps/api/src/routes/ai.routes.ts`<br>`apps/api/src/controllers/ai.controller.ts`<br>`apps/api/src/validators/ai.validator.ts`<br>`apps/api/src/utils/promptGuard.ts`<br>`apps/api/src/services/gemini.service.ts`<br>`apps/api/src/services/gemini.fallbacks.ts` | None | **PRUNED** (`d2dd287`) |
| 3 | `POST /ai/plan` | Duplicate route alias of `/ai/generate-plan` | 0 | `apps/api/src/routes/ai.routes.ts` | None | **PRUNED** (`68fdb48`) |
| 6 | `GET /gamification/trophies` | Standalone trophies query (mobile uses unified `GET /gamification`) | 0 | `apps/api/src/routes/gamification.routes.ts`<br>`apps/api/src/controllers/gamification.controller.ts` | `UserTrophy`, `Trophy` (reads only) | **PRUNED** (`11ee9dd`) |
| 7 | `POST /gamification/check-trophies` | Standalone manual trophy trigger (backend checks automatically on session finish) | 0 | `apps/api/src/routes/gamification.routes.ts`<br>`apps/api/src/controllers/gamification.controller.ts` | `UserTrophy` (writes unlocked trophies) | **PRUNED** (`fa4b9cd`) *(logic kept in repository)* |
| 8 | `GET /prs`<br>`GET /prs/recent` | Standalone personal record read routes | 0 | `apps/api/src/routes/pr.routes.ts`<br>`apps/api/src/controllers/pr.controller.ts`<br>`apps/api/src/index.ts` (`/prs` mount) | `PersonalRecord` (reads only) | **PRUNED** (`ed37656`) *(F4 detection code kept)* |

---

## 2. Intentionally Unused (Planned, to be implemented later)

Per user decision, **do not delete or modify any code, validators, env checks, or fallback strings for these endpoints**. Do not wire them into the redesigned screens. This section will also be added to `architecture.md` in Phase 8 so future audits do not flag them.

| # | Method & Endpoint | One-Line Reason | Complete Backend Files | DB Model / Columns Touched | Fail-Closed Check | Decision |
|---|---|---|---|---|---|---|
| 4 | `POST /ai/analyze` | Planned for future automated workout routine and periodization analysis in Insights/Coach. | `apps/api/src/routes/ai.routes.ts`<br>`apps/api/src/controllers/ai.controller.ts`<br>`apps/api/src/services/gemini.service.ts` (`analyzeRoutine`)<br>`apps/api/src/services/gemini.fallbacks.ts` (`routineAnalysis`, `routineAnalysisError`) | `AiPeriodizationSuggestion` (unwritten) | Safe demo fallback when Gemini is offline. | **KEEP (Planned)** |
| 5 | `POST /auth/google` | Planned for future Google Sign-in on mobile platforms; hardened in fix F10. | `apps/api/src/routes/auth.routes.ts`<br>`apps/api/src/controllers/auth.controller.ts`<br>`apps/api/src/validators/auth.validator.ts` (`googleAuthSchema`)<br>`apps/api/src/services/auth.service.ts` (`googleAuth`)<br>`apps/api/src/lib/env.ts` (`GOOGLE_CLIENT_ID`) | `User` (`email`, `name`, `password_hash: null`) | Verified: throws clean error (`Google sign-in is not configured on this server`) and returns 401/503 without crashing when `GOOGLE_CLIENT_ID` is unset. | **KEEP (Planned)** |

---

## 3. Pre-Phase 3 Technical Verifications

These 7 checks were verified against the codebase prior to starting screen migrations:

1. **Full onboarding payload before vs. after:**
   - *Before:* Sent 15 individual fields including manual `session_duration_min` and `activity_level`.
   - *After:* Sends `{ name, gender, age, height_cm, weight_kg, target_weight_kg, fitness_goal, experience_level, training_style, schedule_days_per_week, injuries, track_nutrition, daily_calorie_target }`.
2. **What `/ai/generate-plan` reads:**
   - Reads `fitness_goal`, `experience_level`, `schedule_days_per_week`, `training_style`, `selected_equipment`, `focus_areas`, `injuries`, and `session_duration_min` (defaults to 60). All supplied by the 4-step wizard.
3. **Where the calorie target comes from:**
   - Derived automatically from biometrics and goal (e.g. Lose Fat -> ~1,800 kcal; Build Muscle -> ~2,600 kcal) and confirmed on Step 4 before sending as `daily_calorie_target`.
4. **Whether body screen drops neck/body-fat:**
   - Neither old nor new UI has a neck input. The core 4 measurements (Chest, Arms, Waist, Thighs) are logged in the modal; Body Fat % is displayed in a dedicated stats card.
5. **Empty-state behavior of realigned endpoints:**
   - `GET /analytics/stats`: Returns zeros (`totalSessions: 0`, `prCount: 0`, `totalVolumeKg: 0`, etc.) without null pointer errors.
   - `GET /analytics/heatmap`: Returns all muscles with `intensity: 0`.
   - `GET /analytics/radar`: Returns 6 axes with `value: 0`.
   - `GET /analytics/equipment`: Returns items with `percentage: 0`.
   - `GET /body/weight`: Returns empty array; fallback defaults render clean placeholder chart.
   - `GET /sessions`: Returns `[]`; renders "No recent workouts yet" card.
6. **Whether `GET /sessions` is limited:**
   - Yes: `sessionRepository.getSessions` has `take: 20` and `orderBy: { started_at: 'desc' }`. Mobile slices top 3 for dashboard.
7. **Which Stitch screen is the 12th:**
   - Exactly 12 screen folders exist (excluding `obsidian_kinetic/` which contains `DESIGN.md`). The 12th screen is `session_complete_workout_summary` (`app/workout/summary.tsx`).
