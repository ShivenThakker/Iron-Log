# IronLog System Architecture & Technical Specification

> **Status**: Verified & Production-Aligned  
> **Repository**: [Iron-Log](https://github.com/ShivenThakker/Iron-Log)  
> **Last Updated**: Current Active Milestone  
> **Monorepo Structure**: npm workspaces (`apps/mobile`, `apps/api`, `packages/shared`)

---

## 1. Executive Summary & Product Scope

IronLog is a high-performance, dark-mode fitness tracking ecosystem combining structured strength progression, flexible workout customization, multimodal AI coaching (Google Gemini 2.5 Flash), macro nutrition tracking, and motivating RPG-style gamification.

The platform is designed around three pillars:
1. **Frictionless Logging & Planning**: Athletes can either build custom single-day routines that repeat weekly, plan entire 7-day splits at once, or feed raw workout sheets, Google Docs, Apple Notes, or whiteboard photos/screenshots directly to Gemini 2.5 Flash for automatic parsing.
2. **Real-Time Guidance & Progressive Overload**: Live rest timers, superset tracking, 1RM estimations via Epley/Brzycki formulas, and automated PR detection with instant visual rewards.
3. **Intelligent Motivation & Analytics**: Volume heatmaps across muscle groups, radar balance charts, XP-based rank progression (Rookie to Mythic), and conversational AI coaching.

---

## 2. Monorepo Topology

```
Iron-Log/
├── apps/
│   ├── api/                    # Express + TypeScript REST API
│   │   ├── prisma/             # Schema, migrations & exercise seed data
│   │   ├── src/
│   │   │   ├── controllers/    # HTTP request/response handlers
│   │   │   ├── lib/            # Prisma client singleton & Redis client
│   │   │   ├── middleware/     # Auth, validation, rate-limiting, error handling
│   │   │   ├── repositories/   # Prisma data access layer
│   │   │   ├── routes/         # Domain endpoint definitions
│   │   │   ├── services/       # Business logic (Gemini 2.5, Auth, USDA, PR detection)
│   │   │   ├── utils/          # Pino logger, custom AppError classes
│   │   │   ├── validators/     # Zod request validation schemas
│   │   │   └── index.ts        # Server entry & middleware pipeline
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

## 3. Technology Stack & Runtime Specifications

| Layer | Technology | Version / Configuration | Purpose |
|---|---|---|---|
| **Runtime (Backend)** | Node.js | `>= 20.x` (LTS) | CommonJS, TypeScript 5.9.x compiled via `tsc` |
| **Server Framework** | Express | `^5.2.1` | REST API with Helmet, CORS, Pino, and Zod |
| **ORM / Database Access** | Prisma | `^7.5.0` | Client generation, query building, schema migrations |
| **Local Dev Database** | SQLite via `better-sqlite3` | `^12.8.0` with `@prisma/adapter-better-sqlite3` | Zero-dependency local prototyping (`dev.db`) |
| **Production Database** | PostgreSQL (Supabase) | PostgreSQL 16+ | Production database with row security and connection pooling |
| **Cache & Rate Limiting** | Upstash Redis | `@upstash/redis` `^1.39.0` | USDA food search caching, IP & auth rate limiting |
| **AI Engine** | Google Gemini 2.5 Flash | `@google/generative-ai` `^0.24.1` | Multimodal workout parsing (doc/screenshot), routine analysis, coaching |
| **Mobile Framework** | Expo / React Native | Expo `~54.0.33`, React Native `0.81.5`, React `19.1.0` | New Architecture enabled (`newArchEnabled: true`) |
| **Mobile Navigation** | Expo Router | `~6.0.23` | File-based typed routing (`typedRoutes: true`) |
| **Mobile State** | TanStack React Query + Zustand | React Query `^5.104`, Zustand `^5.0.15` | Server cache with auto-invalidation, persisted auth |
| **Local Device Storage** | Expo SecureStore & WatermelonDB | SecureStore `^58.0.2`, WatermelonDB `^0.28.0` | Offline-first sync, JWT keychain storage |
| **Vision & Camera** | Expo Image Picker | `~16.0.6` | Image & screenshot capture with base64 conversion |
| **Styling & Charts** | Custom Glassmorphism + React Native SVG | `react-native-svg` `15.12.1`, `phosphor-react-native` | Dark cyberpunk aesthetic with 60fps animations |

---

## 4. Database Schema & Data Models (Prisma Reference)

The schema defines **24 core models** covering user profiles, training programs, exercise tracking, nutrition, gamification, and AI interactions:

### 4.1 Identity & User Profiles
- **`User`**: Core account entity. Stores authentication credentials (`password_hash`), biometric profile (`height_cm`, `date_of_birth`, `gender`, `unit_system`), and fitness settings (`fitness_goal`, `activity_level`, `experience_level`, `schedule_days_per_week`, `session_duration_min`).
- **`EquipmentProfile`**: Captures user equipment access (e.g. Full Commercial Gym, Dumbbells Only, Home Barbell).

### 4.2 Body Tracking & Measurements
- **`BodyWeightLog`**: User weight check-ins with timestamps and notes.
- **`WeightGoal`**: Target weight setpoint.
- **`BodyMeasurement`**: Circumference measurements (chest, waist, arms, thighs, neck, body fat percentage).

### 4.3 Training Programs & Split Structure
- **`WorkoutProgram`**: Top-level routine split (`user_id`, `name`, `difficulty`, `goal`, `schedule_days_per_week`, `is_active`, `is_ai_generated`).
- **`WorkoutDay`**: Individual training day in a program (e.g. "Monday - Chest & Triceps", `sort_order`).
- **`WorkoutDayExercise`**: Exercise scheduled in a day with prescriptions: `target_sets`, `target_reps` (e.g. "8-12"), `target_weight_kg`, `rest_seconds`, `superset_group_id`, `sort_order`.
- **`Exercise`**: Comprehensive exercise library (muscle groups, equipment, instructions, thumbnail URLs) supporting custom user-created exercises (`is_custom`, `created_by_user_id`).

### 4.4 Live Workout Execution & Records
- **`WorkoutSession`**: Logged workout event (`started_at`, `finished_at`, `duration_seconds`, `calories_burned`, `rating`, `notes`).
- **`ExerciseSet`**: Individual set performed (`set_number`, `set_type` ['normal', 'warmup', 'dropset', 'failure', 'amrap'], `reps`, `weight_kg`, `rpe`).
- **`PersonalRecord`**: Milestone PRs per exercise with computed `estimated_1rm_kg` using Brzycki / Epley formulas.

### 4.5 Nutrition Tracking
- **`NutritionGoal`**: Daily targets for calories, protein, carbs, fats, and water intake.
- **`FoodLogEntry`**: Meal logs tagged by `meal_slot` (breakfast, lunch, dinner, snack) with USDA FDC IDs, macro breakdown, and weight in grams.

### 4.6 Gamification Engine
- **`UserXp`**: Total XP and current level.
- **`XpTransaction`**: Audit log of XP awards (completed workouts, logging streaks, PR achievements).
- **`UserTrophy`**: Unlocked achievements.
- **`Streak`**: Consecutive active workout streak days.

### 4.7 AI Integration Records
- **`AiPlanGeneration`**: Raw prompt snapshot and model response history.
- **`AiPeriodizationSuggestion`**: Weight and rep progression recommendations generated by Gemini.
- **`ChatbotConversation`**: Multi-turn dialogue history with IronLog AI.

---

## 5. End-to-End Data Flow & Network Pipeline

### 5.1 Backend Pipeline (`apps/api/src/index.ts`)

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
  ├── 7. Domain Router Binding:
  │      ├── /auth         ── authRoutes         (Login, Register, Refresh, OAuth)
  │      ├── /users        ── userRoutes         (Profile management)
  │      ├── /exercises    ── exerciseRoutes     (Library search & custom creation)
  │      ├── /programs     ── programRoutes      (Active program, splits, day plans)
  │      ├── /sessions     ── sessionRoutes      (Live set logging & session finish)
  │      ├── /nutrition    ── nutritionRoutes    (Food search & macro logs)
  │      ├── /body         ── bodyRoutes         (Weight & measurements)
  │      ├── /ai           ── aiRoutes           (Gemini 2.5 Flash parsing, coach chat)
  │      ├── /gamification ── gamificationRoutes (XP, ranks, trophies, streaks)
  │      ├── /analytics    ── analyticsRoutes    (Heatmaps, radars, stats)
  │      ├── /equipment    ── equipmentRoutes    (Gym gear profiles)
  │      ├── /prs          ── prRoutes           (PR records)
  │      └── /cron         ── cronRoutes         (Protected background automation)
  │
  └── 8. errorHandler                           (Central AppError translation & 500 safety)
```

### 5.2 Dynamic Mobile-to-Backend Resolution (`apps/mobile/services/api.ts`)

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

---

## 6. Workout Program Builder Architecture

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
Updates specific day in           Atomically creates complete       Gemini 2.5 Flash extracts
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

### 6.1 Gemini 2.5 Flash Multimodal Parser
- **Endpoint**: `POST /ai/parse-plan`
- **Input**: `{ text?: string, imageBase64?: string, mimeType?: string }`
- **Model**: `gemini-2.5-flash` with 1M context window and multimodal vision.
- **Output**: Validated JSON adhering to the `ParsedWorkoutPlan` interface, automatically creating or linking exercises to the database.

---

## 7. Status of Graphify Architectural Audit & Deviations

| # | Graphify Finding | System Reality & Architectural Resolution | Status |
|---|---|---|---|
| **1** | Repository depends on service (`nutrition.repository` → `usda.service`) | The nutrition repository caches USDA searches. Architectural roadmap: extract to a unified `FoodSearchService` that orchestrates both local Prisma and external USDA APIs. | Planned |
| **2** | Controller bypasses data layer (`ai.controller` → `prisma`) | User context enrichment for AI coaching reads directly from Prisma. Moving to a dedicated `AiContextService` in Phase 3. | Planned |
| **3** | Route accesses DB directly (`cron.routes` → `prisma`) | Background maintenance (streaks, weekly resets) was placed directly in the route. Migrating logic into a `CronService`. | Planned |
| **4** | Service layer skipped in 9 controllers | Simple CRUD controllers route directly to repositories to avoid redundant boilerplate. Complex domains (`auth`, `ai`, `session/PR`) use full service orchestration. | By Design |
| **5** | Cross-module repository coupling | PR detection and session finalization trigger XP transactions in `gamification.repository`. Event-driven emitter planned for Phase 3. | Acceptable |
| **6** | Inconsistent validation | Zod validation schemas are enforced on user input routes (`auth`, `program`, `session`, `nutrition`, `body`). Validation being extended to remaining routes. | In Progress |
| **7** | Inconsistent error model | `utils/errors.ts` defines `AppError` subclasses. Controllers are standardizing on throwing `AppError` for global middleware interception. | In Progress |
| **8** | Overlapping responsibility (`setWeightGoal`) | Consolidating all weight operations under `body.repository.ts`. | Planned |
| **9** | Undeclared dependency: `axios` in API | **Resolved**: Added `"axios": "^1.13.6"` to `apps/api/package.json`. | **RESOLVED** |
| **10** | Unprotected route surface (`cron.routes.ts`) | **Resolved & Clarified**: Protected via shared secret header (`x-cron-secret` matching `process.env.CRON_SECRET`), designed for serverless cron invocation (GitHub Actions / Render cron). | **CLARIFIED** |
| **11** | Shared package underused by mobile | Types and gamification constants (`RANKS`, `XP_RULES`) are shared. Screen types are being mapped directly to `@ironlog/shared`. | In Progress |
| **12** | Local WatermelonDB not wired | WatermelonDB schema and models are scaffolded in `apps/mobile/database/` for offline-first sync. Active sync adapter is scheduled for Phase 5. | By Design |
| **13** | Orphaned template files | Leftover template files cleaned up during Phase 0 scaffolding. | **RESOLVED** |
| **14** | Fixtures embedded in screens | Fallback mock data in screens serves as graceful degradation when the backend is offline or unseeded. | By Design |

---

## 8. Deployment & Environment Strategy

### 8.1 API Deployment (Render)
- Configured in `render.yaml` as web service `ironlog-api`.
- Build command: `npm install && npm run build --workspace=api`
- Start command: `npm run start --workspace=api`
- Environment Variables required:
  - `DATABASE_URL`: Supabase PostgreSQL pooled connection URL.
  - `JWT_SECRET` & `JWT_REFRESH_SECRET`: Secure cryptographic strings.
  - `GEMINI_API_KEY`: Google AI Studio API key.
  - `GEMINI_MODEL`: `gemini-2.5-flash` (or override).
  - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis instance.
  - `CRON_SECRET`: Secret key for `/cron` endpoints.

### 8.2 Mobile Deployment (Expo EAS)
- Configured via `app.json` for iOS and Android builds.
- Dynamic environment variable: `EXPO_PUBLIC_API_URL` targeting deployed Render URL in production, or auto-detecting LAN IP in development.
