# IronLog API Endpoints Snapshot (After Redesign & Backend Pruning)

Captured at Phase 5 after UI redesign and backend pruning on branch `ui-redesign`.
Total Express endpoints: **44** (43 router endpoints + 1 root health endpoint).
Router definitions matched `grep -rn "router\.\(get\|post\|put\|patch\|delete\)" apps/api/src`: **43**.

---

## 1. System / Health
Mounted directly in `apps/api/src/index.ts`:
- `GET /health` - `apps/api/src/index.ts:52`

## 2. Authentication (`/auth`)
File: `apps/api/src/routes/auth.routes.ts`
- `POST /auth/register` - `apps/api/src/routes/auth.routes.ts:12`
- `POST /auth/login` - `apps/api/src/routes/auth.routes.ts:13`
- `POST /auth/refresh` - `apps/api/src/routes/auth.routes.ts:14`
- `POST /auth/logout` - `apps/api/src/routes/auth.routes.ts:15`
- `POST /auth/google` - `apps/api/src/routes/auth.routes.ts:16` *(Intentionally unused / planned)*

## 3. Users (`/users`)
File: `apps/api/src/routes/user.routes.ts`
- `GET /users/profile` - `apps/api/src/routes/user.routes.ts:7`
- `PUT /users/profile` - `apps/api/src/routes/user.routes.ts:8`

## 4. Exercises (`/exercises`)
File: `apps/api/src/routes/exercise.routes.ts`
- `GET /exercises/` - `apps/api/src/routes/exercise.routes.ts:10`
- `POST /exercises/` - `apps/api/src/routes/exercise.routes.ts:11`
- `GET /exercises/:id` - `apps/api/src/routes/exercise.routes.ts:12`

## 5. Programs (`/programs`)
File: `apps/api/src/routes/program.routes.ts`
- `GET /programs/` - `apps/api/src/routes/program.routes.ts:20`
- `GET /programs/active` - `apps/api/src/routes/program.routes.ts:21`
- `POST /programs/full` - `apps/api/src/routes/program.routes.ts:22`
- `POST /programs/day` - `apps/api/src/routes/program.routes.ts:23`
- `PUT /programs/:id/activate` - `apps/api/src/routes/program.routes.ts:24`
- `POST /programs/` - `apps/api/src/routes/program.routes.ts:25`
- `GET /programs/:id` - `apps/api/src/routes/program.routes.ts:26`
- `PUT /programs/:id` - `apps/api/src/routes/program.routes.ts:27`
- `DELETE /programs/:id` - `apps/api/src/routes/program.routes.ts:28`

## 6. Workout Sessions (`/sessions`)
File: `apps/api/src/routes/session.routes.ts`
- `GET /sessions/` - `apps/api/src/routes/session.routes.ts:10`
- `POST /sessions/` - `apps/api/src/routes/session.routes.ts:11`
- `GET /sessions/:id` - `apps/api/src/routes/session.routes.ts:12`
- `POST /sessions/:id/sets` - `apps/api/src/routes/session.routes.ts:13`
- `PUT /sessions/:id/finish` - `apps/api/src/routes/session.routes.ts:14`

## 7. Nutrition (`/nutrition`)
File: `apps/api/src/routes/nutrition.routes.ts`
- `GET /nutrition/search` - `apps/api/src/routes/nutrition.routes.ts:10`
- `GET /nutrition/daily` - `apps/api/src/routes/nutrition.routes.ts:11`
- `GET /nutrition/daily/:date` - `apps/api/src/routes/nutrition.routes.ts:12`
- `POST /nutrition/log` - `apps/api/src/routes/nutrition.routes.ts:13`

## 8. Body Tracking (`/body`)
File: `apps/api/src/routes/body.routes.ts`
- `POST /body/weight` - `apps/api/src/routes/body.routes.ts:10`
- `GET /body/weight` - `apps/api/src/routes/body.routes.ts:11`
- `POST /body/measurement` - `apps/api/src/routes/body.routes.ts:12`

## 9. AI Engine (`/ai`)
File: `apps/api/src/routes/ai.routes.ts`
- `POST /ai/chat` - `apps/api/src/routes/ai.routes.ts:14`
- `POST /ai/analyze` - `apps/api/src/routes/ai.routes.ts:15` *(Intentionally unused / planned)*
- `POST /ai/generate-plan` - `apps/api/src/routes/ai.routes.ts:16`
- `POST /ai/parse-plan` - `apps/api/src/routes/ai.routes.ts:17`

## 10. Gamification & Trophies (`/gamification`)
File: `apps/api/src/routes/gamification.routes.ts`
- `GET /gamification/` - `apps/api/src/routes/gamification.routes.ts:8`

## 11. Analytics & Visualizations (`/analytics`)
File: `apps/api/src/routes/analytics.routes.ts`
- `GET /analytics/stats` - `apps/api/src/routes/analytics.routes.ts:8`
- `GET /analytics/heatmap` - `apps/api/src/routes/analytics.routes.ts:9`
- `GET /analytics/radar` - `apps/api/src/routes/analytics.routes.ts:10`
- `GET /analytics/equipment` - `apps/api/src/routes/analytics.routes.ts:11`

## 12. Equipment Management (`/equipment`)
File: `apps/api/src/routes/equipment.routes.ts`
- `GET /equipment/` - `apps/api/src/routes/equipment.routes.ts:12`
- `POST /equipment/` - `apps/api/src/routes/equipment.routes.ts:13`
- `PUT /equipment/:id/active` - `apps/api/src/routes/equipment.routes.ts:14`

## 13. Cron Jobs (`/cron`)
File: `apps/api/src/routes/cron.routes.ts`
- `POST /cron/streaks` - `apps/api/src/routes/cron.routes.ts:16`
