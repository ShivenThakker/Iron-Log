# IronLog system architecture and technical specification

> **Status**: Verified and production-aligned  
> **Repository**: [Iron-Log](https://github.com/ShivenThakker/Iron-Log)  
> **Monorepo Structure**: npm workspaces (`apps/mobile`, `apps/api`, `packages/shared`)

---

## 1. Executive summary and product scope

IronLog is an offline-first fitness tracking application providing strength progression, workout customization, AI coaching with Google Gemini, macro nutrition tracking, and gamification.

The platform is designed around three areas:
1. **Logging and planning**: Athletes can build custom single-day routines that repeat weekly, plan 7-day splits, or parse raw workout notes or whiteboard photos using the Google Gemini API.
2. **Guidance and progression**: Rest timers, 1RM estimations via Epley and Brzycki formulas, and automated PR detection with instant visual feedback.
3. **Analytics and gamification**: Volume heatmaps across muscle groups, radar balance charts, XP rank progression (Rookie to Mythic), and conversational AI coaching.

---

## 2. Monorepo topology

```
Iron-Log/
├── apps/
│   ├── api/                    # Express + TypeScript REST API
│   │   ├── prisma/             # Schema, migrations & exercise seed data
│   │   │   └── manual/         # Manual SQL migration scripts (pr_unique_per_set.sql)
│   │   ├── scripts/            # Helper & test scripts (check-ai-json.ts)
│   │   ├── src/
│   │   │   ├── controllers/    # HTTP request/response handlers
│   │   │   ├── lib/            # Prisma client, Redis client, env.ts boot validation
│   │   │   ├── middleware/     # Auth, validation, rate-limiting, error handling
│   │   │   ├── repositories/   # Prisma data access layer (ownership enforced)
│   │   │   ├── routes/         # Domain endpoint definitions
│   │   │   ├── services/       # Business logic (Gemini, Fallbacks, Auth, USDA, PR detection)
│   │   │   ├── utils/          # Pino logger, AppError classes, aiJson, promptGuard
│   │   │   ├── validators/     # Zod request validation schemas (auth, session, ai, etc.)
│   │   │   └── index.ts        # Server entry, boot verification & middleware pipeline
│   │   └── package.json
│   │
│   └── mobile/                 # React Native + Expo Mobile Application
│       ├── app/                # Expo Router file-based screens
│       │   ├── (tabs)/         # HomeDashboard, Nutrition, Body, Insights, Achievements
│       │   ├── program/        # Workout Plan Builder (Single Day, Full Week, AI Ingestion)
│       │   ├── workout/        # Active session runner & completion summary
│       │   ├── ai/             # AI Coach interactive chat
│       │   ├── settings/       # Profile, units, account controls
│       │   └── _layout.tsx     # Root stack layout, font loading & auth gate
│       ├── components/         # GlassCard UI kit, rest timers, SVG charts
│       ├── constants/          # Tokens (COLORS, SPACING, RADIUS, TYPOGRAPHY)
│       ├── database/           # WatermelonDB local offline models & schema
│       ├── services/           # Axios client with dynamic LAN IP detection
│       ├── store/              # Zustand auth & session store (Expo SecureStore)
│       └── package.json
│
└── packages/
    └── shared/                 # Shared TypeScript models, Rank & XP definitions
        ├── constants/          # RANKS, XP_RULES
        ├── types/              # User, Workout, Nutrition, Gamification contracts
        └── package.json
```

---

## 3. Technology stack and runtime specifications

| Layer | Technology | Version / Configuration | Purpose |
|---|---|---|---|
| **Runtime (Backend)** | Node.js | `>= 20.x` (LTS) | CommonJS, TypeScript 5.9.x compiled via `tsc` |
| **Server Framework** | Express | `^5.2.1` | REST API with Helmet, CORS, Pino, and Zod |
| **ORM / Database Access** | Prisma | `^7.5.0` | Client generation, query building, schema migrations |
| **Local Dev Database** | SQLite via `better-sqlite3` | `^12.8.0` with `@prisma/adapter-better-sqlite3` | Zero-dependency local prototyping (`dev.db`) |
| **Production Database** | PostgreSQL (Supabase) | PostgreSQL 16+ | Production database with row security and connection pooling |
| **Cache & Rate Limiting** | Upstash Redis | `@upstash/redis` `^1.39.0` | USDA food search caching, dynamic IP & auth rate limiting |
| **AI Engine** | Google Gemini (configured via `GEMINI_MODEL`, active default `gemini-2.5-flash`) | `@google/genai` `^2.31.0` (Official modern Google GenAI SDK) | Multimodal workout parsing (doc/screenshot), routine analysis, coaching |
| **Mobile Framework** | Expo / React Native | Expo `~54.0.37`, React Native `0.81.5`, React `19.1.0` | New Architecture enabled (`newArchEnabled: true`) |
| **Mobile Navigation** | Expo Router | `~6.0.24` | File-based typed routing (`typedRoutes: true`) |
| **Mobile State** | TanStack React Query + Zustand | React Query `^5.104`, Zustand `^5.0.15` | Server cache with auto-invalidation, persisted auth & refresh token |
| **Local Device Storage** | Expo SecureStore & WatermelonDB | SecureStore `~15.0.8`, WatermelonDB `^0.28.0` | Offline-first sync, JWT keychain storage |
| **Vision & Camera** | Expo Image Picker | `~17.0.11` | Image & screenshot capture with base64 conversion |
| **Styling & Charts** | Custom Glassmorphism + React Native SVG | `react-native-svg` `15.12.1`, `phosphor-react-native` | Dark cyberpunk aesthetic with 60fps animations |

---

## 4. Database schema and data models

The schema defines **24 core models** covering user profiles, training programs, exercise tracking, nutrition, gamification, and AI interactions:

### 4.1 Identity and user profiles
- **`User`**: Core account entity. Stores authentication credentials (`password_hash`), biometric profile (`height_cm`, `date_of_birth`, `gender`, `unit_system`), and fitness settings (`fitness_goal`, `activity_level`, `experience_level`, `schedule_days_per_week`, `session_duration_min`).
- **`EquipmentProfile`**: Captures user equipment access (e.g. Full Commercial Gym, Dumbbells Only, Home Barbell).

### 4.2 Body tracking and measurements
- **`BodyWeightLog`**: User weight check-ins with timestamps and notes.
- **`WeightGoal`**: Target weight setpoint.
- **`BodyMeasurement`**: Circumference measurements (chest, waist, arms, thighs, neck, body fat percentage).

### 4.3 Training programs and split structure
- **`WorkoutProgram`**: Top-level routine split (`user_id`, `name`, `difficulty`, `goal`, `schedule_days_per_week`, `is_active`, `is_ai_generated`).
- **`WorkoutDay`**: Individual training day in a program (e.g. "Monday - Chest & Triceps", `sort_order`).
- **`WorkoutDayExercise`**: Exercise scheduled in a day with prescriptions: `target_sets`, `target_reps` (e.g. "8-12"), `target_weight_kg`, `rest_seconds`, `superset_group_id`, `sort_order`.
- **`Exercise`**: Comprehensive exercise library (muscle groups, equipment, instructions, thumbnail URLs) supporting custom user-created exercises (`is_custom`, `created_by_user_id`).

### 4.4 Workout execution and records
- **`WorkoutSession`**: Logged workout event (`started_at`, `finished_at`, `duration_seconds`, `calories_burned`, `rating`, `notes`).
- **`ExerciseSet`**: Individual set performed (`set_number`, `set_type` ['normal', 'warmup', 'dropset', 'failure', 'amrap'], `reps`, `weight_kg`, `rpe`).
- **`PersonalRecord`**: Milestone PRs per exercise with required `weight_kg` and `reps`, composite unique rule `@@unique([user_id, exercise_id, weight_kg, reps])` to guarantee idempotency and eliminate race-condition duplicates, and computed `estimated_1rm_kg` using Brzycki / Epley formulas.

### 4.5 Nutrition tracking
- **`NutritionGoal`**: Daily targets for calories, protein, carbs, fats, and water intake.
- **`FoodLogEntry`**: Meal logs tagged by `meal_slot` (breakfast, lunch, dinner, snack) with USDA FDC IDs, macro breakdown, and weight in grams.

### 4.6 Gamification engine
- **`UserXp`**: Total XP and current level.
- **`XpTransaction`**: Audit log of XP awards (completed workouts, logging streaks, PR achievements).
- **`UserTrophy`**: Unlocked achievements.
- **`Streak`**: Consecutive active workout streak days.

### 4.7 AI integration records
- **`AiPlanGeneration`**: Raw prompt snapshot and model response history.
- **`AiPeriodizationSuggestion`**: Weight and rep progression recommendations generated by Gemini.
- **`ChatbotConversation`**: Multi-turn dialogue history with IronLog AI.

---

## 5. End-to-end data flow and network pipeline

### 5.1 Backend pipeline (`apps/api/src/index.ts`)

Every HTTP request traverses an ordered middleware sequence:
```
Request
  │
  ├── 1. helmet()                               (Security headers)
  ├── 2. cors()                                 (Cross-origin resource access)
  ├── 3. express.json({ limit: '15mb' })        (JSON parser with 15MB headroom for screenshots)
  ├── 4. express.urlencoded({ limit: '15mb' })  (URL form parser)
  ├── 5. logger.debug()                         (Pino request logging)
  ├── 6. rateLimit(60, 60000)                   (Global IP rate limiting)
  │
  ├── 7. Domain Router Binding (12 active domain routers):
  │      ├── /auth         ── authRoutes         (Login, Register, Refresh, OAuth)
  │      ├── /users        ── userRoutes         (Profile management)
  │      ├── /exercises    ── exerciseRoutes     (Library search & custom creation)
  │      ├── /programs     ── programRoutes      (Active program, splits, day plans)
  │      ├── /sessions     ── sessionRoutes      (Live set logging, PR detection via F4, session finish)
  │      ├── /nutrition    ── nutritionRoutes    (Food search & macro logs)
  │      ├── /body         ── bodyRoutes         (Weight & measurements)
  │      ├── /ai           ── aiRoutes           (Gemini parsing & coach chat, rate-limited to 10 req/min, Zod validation & prompt screening)
  │      ├── /gamification ── gamificationRoutes (XP, ranks, trophies, streaks)
  │      ├── /analytics    ── analyticsRoutes    (Heatmaps, radars, stats)
  │      ├── /equipment    ── equipmentRoutes    (Gym gear profiles)
  │      └── /cron         ── cronRoutes         (Protected background automation)
  │
  └── 8. errorHandler                           (Central AppError translation & 500 safety)
```

### 5.2 Dynamic mobile-to-backend resolution (`apps/mobile/services/api.ts`)

On physical mobile devices running Expo Go, `localhost` resolves to the phone's loopback interface, causing network timeouts. The API client uses dynamic host resolution:
```typescript
const resolveBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.105:8081"
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
};
```
The Express server explicitly binds to `0.0.0.0` to accept connections across all LAN interfaces.

### 5.3 Mobile token lifecycle and resilient session sync (`apps/mobile/services/api.ts`)

- **15-Minute Access Token Expiration**: To maintain short-lived access credentials without disrupting 45–90 minute workout sessions, Axios attaches an asynchronous response interceptor on HTTP 401 errors.
- **Automatic Token Refresh**: The client retrieves `refreshToken` from the hydrated Zustand `useAuthStore` (persisted via `expo-secure-store`), calls `POST /auth/refresh`, updates the auth store, and re-executes the original failed request seamlessly.
- **Token Revocation on Logout**: When logging out from the settings screen (`apps/mobile/app/settings/index.tsx`), the client sends `{ refreshToken }` to `POST /auth/logout`, enabling Upstash Redis to blacklist the token and prevent replay attacks.
- **Dynamic Workout Exercise ID Resolution**: In `apps/mobile/app/workout/active.tsx`, default workout sets dynamically resolve their exercise IDs against the database UUIDs returned by `GET /exercises`, preventing foreign-key constraints from failing during set logging.

---

## 6. Workout program builder architecture

The app provides three distinct pathways for workout plan generation and management via `apps/mobile/app/program/builder.tsx`:

```
                    ┌──────────────────────────────────────────────┐
                    │        Workout Plan Builder UI               │
                    │   (apps/mobile/app/program/builder.tsx)      │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
   [OPTION A]                        [OPTION B]                        [OPTION C]
Single Day Recurring               Full Week Split                 AI Document / Photo
         │                                 │                                 │
Pick Day (e.g. Mon)               Define Mon - Sun                 Paste doc / Apple Notes
Add Exercises, Sets, Reps         Active / Rest Days               OR Upload Screenshot
Toggle "Repeat Weekly"            Prescribe Volume & Targets       (expo-image-picker base64)
         │                                 │                                 │
         ▼                                 ▼                                 ▼
POST /programs/day                POST /programs/full               POST /ai/parse-plan
Updates specific day in           Atomically creates complete       Gemini extracts
active routine or creates split   program with days & exercises     structured JSON schema
         │                                 │                                 │
         └─────────────────────────────────┼─────────────────────────────────┘
                                           ▼
                            Database (Prisma Models)
                 WorkoutProgram ──▶ WorkoutDay ──▶ WorkoutDayExercise
                                           │
                                           ▼
                                Home Dashboard & Active Workout
```

### 6.1 Gemini multimodal parser
- **Endpoint**: `POST /ai/parse-plan`
- **Input**: `{ text?: string, imageBase64?: string, mimeType?: string }`
- **Model**: `gemini-2.5-flash` with 1M context window and multimodal vision.
- **Output**: Validated JSON adhering to the `ParsedWorkoutPlan` interface, automatically creating or linking exercises to the database.

---

## 7. Status of architectural audit and deviations

| # | Graphify Finding | System Reality & Architectural Resolution | Status |
|---|---|---|---|
| **1** | Repository depends on service (`nutrition.repository` → `usda.service`) | **Resolved**: Extracted food search orchestration into dedicated `FoodSearchService` (`apps/api/src/services/foodSearch.service.ts`), decoupling database operations from external API caching. | **RESOLVED** |
| **2** | Controller bypasses data layer (`ai.controller` → `prisma`) | User context enrichment for AI coaching reads directly from Prisma. Moving to a dedicated `AiContextService` in Phase 3. | Planned |
| **3** | Route accesses DB directly (`cron.routes` → `prisma`) | Background maintenance (streaks, weekly resets) was placed directly in the route. Migrating logic into a `CronService`. | Planned |
| **4** | Service layer skipped in 9 controllers | Simple CRUD controllers route directly to repositories to avoid redundant boilerplate. Complex domains (`auth`, `ai`, `session/PR`) use full service orchestration. | By Design |
| **5** | Cross-module repository coupling | **Resolved**: Introduced in-process typed `AppEventBus` (`apps/api/src/services/eventBus.ts`). Side effects (`session.finished`, `set.logged`) are dispatched asynchronously, eliminating tight coupling and reducing set latency. | **RESOLVED** |
| **6** | Inconsistent validation | Zod validation schemas are enforced on user input routes (`auth`, `program`, `session`, `nutrition`, `body`). Validation being extended to remaining routes. | In Progress |
| **7** | Inconsistent error model | `utils/errors.ts` defines `AppError` subclasses. Controllers are standardizing on throwing `AppError` for global middleware interception. | In Progress |
| **8** | Overlapping responsibility (`setWeightGoal`) | Consolidating all weight operations under `body.repository.ts`. | Planned |
| **9** | Undeclared dependency: `axios` in API | **Resolved**: Added `"axios": "^1.13.6"` to `apps/api/package.json`. | **RESOLVED** |
| **10** | Unprotected route surface (`cron.routes.ts`) | **Resolved & Hardened (Oct 2026)**: Protected via shared secret header (`x-cron-secret`). Fails closed with timing-safe comparison (`cronSecretMatches()`), preventing timing attacks and unauthorized invocations when secret is unset. | **RESOLVED** |
| **11** | Shared package underused by mobile | Types and gamification constants (`RANKS`, `XP_RULES`) are shared. Screen types are being mapped directly to `@ironlog/shared`. | In Progress |
| **12** | Local WatermelonDB not wired | WatermelonDB schema and models are scaffolded in `apps/mobile/database/` for offline-first sync. Active sync adapter is scheduled for Phase 5. | By Design |
| **13** | Orphaned template files | Leftover template files cleaned up during Phase 0 scaffolding. | **RESOLVED** |
| **14** | Fixtures embedded in screens | Fallback mock data in screens serves as graceful degradation when the backend is offline or unseeded. | By Design |

### 7.1 Security and resilience audit resolutions

| # | Finding & Subsystem | Architectural Fix & Verification | Status |
|---|---|---|---|
| **F1** | Default JWT Secret Fallback (`auth.middleware.ts`, `auth.service.ts`) | Removed all `dev_secret` fallbacks. Created boot-time settings validator (`apps/api/src/lib/env.ts`) halting the process if `JWT_SECRET` / `JWT_REFRESH_SECRET` are missing, shorter than 32 chars, or identical. Cron secret fails closed. | **RESOLVED** (Oct 2026) |
| **F2** | IDOR on Session & Entity Lookups (`session`, `equipment`, `program`, `exercise`) | Ownership verification enforced on `getSession`, `addSet`, `finishSession`, `setActiveProfile`, `saveDayPlan`, `updateProgram`, and custom exercise lookups. Unowned resources return HTTP 404 (`NotFoundError`). | **RESOLVED** (Oct 2026) |
| **F3** | Unhandled AI JSON Parsing (`gemini.service.ts`) | Created `apps/api/src/utils/aiJson.ts` with fenced markdown extraction and 200k char cap. Structured output validation via Zod `parsedWorkoutPlanSchema`. Explicit `responseMimeType: 'application/json'` and `maxOutputTokens: 8192`. Clean HTTP 502 (`AiResponseError`) on parsing or truncation failures. | **RESOLVED** (Oct 2026) |
| **F4** | Personal Record Race Condition (`schema.prisma`, `pr.repository.ts`, `prDetection.ts`) | Required `weight_kg` and `reps` on `PersonalRecord` with composite unique constraint `@@unique([user_id, exercise_id, weight_kg, reps])`. Wrapped insert and XP award in `prisma.$transaction`. Catches `P2002` duplicate errors idempotently returning `{ isNewPR: false }`. | **RESOLVED** (Oct 2026) |
| **F5** | Unscreened & Unbounded AI Inputs (`promptGuard.ts`, `ai.routes.ts`) | Enforced length caps (2,000 chars for coach/feedback, 20,000 for plan parsing, 10MB base64 images). NFKC normalization and control character stripping. Regex screening against prompt injection. System instruction separation and `<athlete_message>` / `<plan_text>` boundaries. Dedicated rate limit (10 req/min). Matching `maxLength` on mobile inputs. | **RESOLVED** (Oct 2026) |
| **F6** | Hardcoded AI Model in Source Code (`gemini.service.ts`) | Removed in-code model defaults. Required `GEMINI_MODEL` when `GEMINI_API_KEY` is present. Startup logging of active AI model via `index.ts`. Allows zero-code model migration from Render dashboard. | **RESOLVED** (Oct 2026) |
| **F7** | Decentralized AI Fallback Messages (`gemini.fallbacks.ts`) | Consolidated all offline demo mode responses and error fallbacks into `apps/api/src/services/gemini.fallbacks.ts` with typed helper `getFallbackResponse()`. | **RESOLVED** (Oct 2026) |
| **F8** | Mobile 401 Session Interruption (`apps/mobile/services/api.ts`) | Added Axios 401 response interceptor dynamically calling `/auth/refresh` using stored `refreshToken` in `useAuthStore`, persisting new tokens and replaying failed requests without interrupting live workouts. | **RESOLVED** (Oct 2026) |
| **F9** | Active Workout Foreign-Key ID Mismatch (`apps/mobile/app/workout/active.tsx`) | Default workout exercises previously used dummy string IDs (`bench-press-1`), causing set logging to fail foreign key checks. Now dynamically resolves against fetched database UUIDs from `/exercises`. | **RESOLVED** (Oct 2026) |
| **F10** | Unverified Google OAuth Signature Bypass (`auth.service.ts`) | Required `GOOGLE_CLIENT_ID` configuration for Google OAuth. Removed insecure unverified `jwt.decode` fallback that allowed arbitrary token forging. | **RESOLVED** (Oct 2026) |
| **F11** | Non-Idempotent Weekly Streak / XP Cron Reset (`cron.routes.ts`) | Protected Monday cron reset with `where: { week_reset_at: { lt: today } }` to prevent repeated cron triggers from wiping weekly user XP mid-day. | **RESOLVED** (Oct 2026) |
| **F12** | Profile Update Dropped Calorie Goal (`user.service.ts`) | Destructured `daily_calorie_target` was previously dropped. Wired to `nutritionRepository.setNutritionGoal(userId, { daily_calories })` to properly persist targets. | **RESOLVED** (Oct 2026) |
| **F13** | Unrevoked Refresh Tokens on Mobile Logout (`settings/index.tsx`) | Mobile logout previously sent empty payload. Now transmits `refreshToken` in `POST /auth/logout` so Redis can blacklist it against replay. | **RESOLVED** (Oct 2026) |
| **F14** | Duplicate XP on Session Finish Double-Tap (`session.repository.ts`) | Added idempotent check `if (existing.finished_at)` returning finished session summary immediately, stopping duplicate 50 XP awards and streak recalculations. | **RESOLVED** (Oct 2026) |
| **F15** | Program Creation Multi-Step Transactional Safety (`program.repository.ts`) | `createFullProgram` and `saveDayPlan` now wrap all program deactivations, day creations, and exercise insertions in `prisma.$transaction`. | **RESOLVED** (Oct 2026) |
| **F16** | Concurrency Race in Initial XP Awards (`gamification.repository.ts`) | Replaced check-then-write pattern in `getOrCreateUserXp` and `awardXp` with atomic `prisma.userXp.upsert`, eliminating `P2002` duplicate key errors. | **RESOLVED** (Oct 2026) |
| **F17** | False Positive Substring Checks on Secret Validation (`env.ts`) | Separated placeholder phrases from exact match keywords in `env.ts` so high-entropy secrets containing English substrings like `secret` are not rejected at startup. | **RESOLVED** (Oct 2026) |

### 7.2 Intentionally unused (planned) endpoints

These endpoints are intentionally retained in the codebase for future roadmap milestones. **Future audits must NOT flag them as dead code.** They are preserved with their validators, error handling, and fail-closed checks, but are unwired from the current mobile client:

| Method & Endpoint | Roadmap Purpose | Complete Implementation Files | DB Model / Columns Touched | Fail-Closed Check & Safeguards | Status |
|---|---|---|---|---|---|
| `POST /ai/analyze` | Planned for future automated workout routine and periodization analysis in Insights/Coach. | `apps/api/src/routes/ai.routes.ts`<br>`apps/api/src/controllers/ai.controller.ts`<br>`apps/api/src/services/gemini.service.ts` (`analyzeRoutine`)<br>`apps/api/src/services/gemini.fallbacks.ts` (`routineAnalysis`, `routineAnalysisError`) | `AiPeriodizationSuggestion` (unwritten) | Safe demo fallback responses when Gemini is offline or unconfigured. | **KEEP (Planned)** |
| `POST /auth/google` | Planned for future Google Sign-In on mobile platforms; hardened in fix F10. | `apps/api/src/routes/auth.routes.ts`<br>`apps/api/src/controllers/auth.controller.ts`<br>`apps/api/src/validators/auth.validator.ts` (`googleAuthSchema`)<br>`apps/api/src/services/auth.service.ts` (`googleAuth`)<br>`apps/api/src/lib/env.ts` (`GOOGLE_CLIENT_ID`) | `User` (`email`, `name`, `password_hash: null`) | Verified: throws clean error (`Google sign-in is not configured on this server`) and returns HTTP 401/503 without crashing when `GOOGLE_CLIENT_ID` is unset. | **KEEP (Planned)** |

### 7.3 Features and endpoints pruned during UI redesign

During the UI redesign to the Obsidian Kinetic design system, 6 candidate items (7 dead Express routes) with 0 callers in the completed mobile application were formally approved and pruned:

| # | Endpoint | Original Purpose | Pruning Details & Kept Logic | Commit |
|---|---|---|---|---|
| **1** | `GET /exercises/shuffle` | Prototype exercise randomizer | Removed route and controller handler; removed unused `findShuffle` from `exercise.repository.ts`. | `1066a9a` |
| **2** | `POST /ai/feedback` | Prototype feedback text submission | Removed route, `textFeedbackSchema` validator, and `FEEDBACK_PROMPT_MAX`. Consolidated offline coaching response under `coachChat` in `gemini.fallbacks.ts`. Kept all chat, parse-plan, and generate-plan logic. | `d2dd287` |
| **3** | `POST /ai/plan` | Duplicate route alias of `/ai/generate-plan` | Removed redundant alias from `ai.routes.ts`. Canonical endpoint `POST /ai/generate-plan` is active in onboarding. | `68fdb48` |
| **4** | `GET /gamification/trophies` | Standalone trophy case query | Removed route and handler. The mobile application queries `GET /gamification`, which returns the complete user profile, level, XP, streaks, and unlocked trophy case in a unified payload. | `11ee9dd` |
| **5** | `POST /gamification/check-trophies` | Standalone manual trophy trigger | Removed standalone manual trigger route and handler. The automated trophy unlocking evaluation logic in `gamification.repository.ts` (`checkAndUnlockTrophies`) is strictly preserved and triggered automatically when finalizing sessions via `PUT /sessions/:id/finish`. | `fa4b9cd` |
| **6** | `GET /prs`<br>`GET /prs/recent` | Standalone personal record read routes | Removed read routes, `pr.controller.ts`, and unmounted `/prs` in `index.ts`. All PR detection algorithms (`prDetection.ts`) and idempotent concurrency handling (`recordPersonalRecordOnce` with SQLite/Postgres `P2002` handling in `pr.repository.ts`, audit fix F4) are strictly preserved and executed when adding sets in `apps/mobile/app/workout/active.tsx`. | `ed37656` |

### 7.4 API endpoint map (44 endpoints)

Total Express endpoints: **44** (43 router endpoints + 1 root health endpoint).

- **Health (1)**: `GET /health`
- **Auth (5)**: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/google` *(Planned)*
- **Users (2)**: `GET /users/profile`, `PUT /users/profile`
- **Exercises (3)**: `GET /exercises/`, `POST /exercises/`, `GET /exercises/:id`
- **Programs (9)**: `GET /programs/`, `GET /programs/active`, `POST /programs/full`, `POST /programs/day`, `PUT /programs/:id/activate`, `POST /programs/`, `GET /programs/:id`, `PUT /programs/:id`, `DELETE /programs/:id`
- **Sessions (5)**: `GET /sessions/`, `POST /sessions/`, `GET /sessions/:id`, `POST /sessions/:id/sets`, `PUT /sessions/:id/finish`
- **Nutrition (4)**: `GET /nutrition/search`, `GET /nutrition/daily`, `GET /nutrition/daily/:date`, `POST /nutrition/log`
- **Body Tracking (3)**: `POST /body/weight`, `GET /body/weight`, `POST /body/measurement`
- **AI Engine (4)**: `POST /ai/chat`, `POST /ai/analyze` *(Planned)*, `POST /ai/generate-plan`, `POST /ai/parse-plan`
- **Gamification (1)**: `GET /gamification/`
- **Analytics (4)**: `GET /analytics/stats`, `GET /analytics/heatmap`, `GET /analytics/radar`, `GET /analytics/equipment`
- **Equipment (3)**: `GET /equipment/`, `POST /equipment/`, `PUT /equipment/:id/active`
- **Cron Automation (1)**: `POST /cron/streaks`

---

## 8. Deployment and environment strategy

### 8.1 API deployment (Render)
- Configured in `render.yaml` as web service `ironlog-api`.
- Build command: `npm install && npm run build --workspace=api`
- Start command: `npm run start --workspace=api`
- Environment Variables required (strictly validated at startup via `apps/api/src/lib/env.ts`):
  - `DATABASE_URL`: Supabase PostgreSQL pooled connection URL.
  - `JWT_SECRET` & `JWT_REFRESH_SECRET`: Secure cryptographic strings (minimum 32 characters, non-guessable, must be different from each other).
  - `CRON_SECRET`: Secret key for `/cron` endpoints (required in production; timing-safe check fails closed).
  - `GEMINI_API_KEY`: Google AI Studio API key.
  - `GEMINI_MODEL`: Model identifier (e.g. `gemini-2.5-flash`; required whenever `GEMINI_API_KEY` is set).
  - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis instance.
  - `PORT`: Server listen port (default 3000).
  - `NODE_ENV`: Runtime mode (`development` or `production`).

### 8.2 Mobile deployment (Expo EAS)
- Configured via `app.json` for iOS and Android builds.
- Dynamic environment variable: `EXPO_PUBLIC_API_URL` targeting deployed Render URL in production, or auto-detecting LAN IP in development.
