# IronLog

IronLog is an offline-first mobile fitness tracking application (iOS and Android) with a Node.js TypeScript API. It provides workout planning, set logging, nutrition tracking, body metrics, strength progression, and AI coaching.

---

## Features

### Workout planning and logging
- Program builder with support for custom weekly splits and automated routine parsing from raw text notes or workout sheet images using the Google Gemini API.
- Active workout runner with rest timer, set types (Normal, Warmup, Failure), and timed exercise countdown.
- Retroactive workout logging for previous dates.
- Workout completion summary with total volume, PR detection, and periodization suggestions.

### Nutrition tracking
- Daily nutrition targets with calorie and macro targets (protein, carbs, fats).
- Food search backed by local database and USDA FoodData Central API.
- Meal slot breakdown: Breakfast, Lunch, Dinner, Snacks.
- Daily logging history and remaining macro calculations.

### Body and strength tracking
- Daily bodyweight log with 7-day moving averages and goal progress.
- Circumference measurements (chest, waist, hips, arms, thighs, calves, neck) and body fat percentage tracking.
- Personal record (PR) tracking with estimated 1RM calculations.
- Strength standards reference comparisons across barbell lifts.

### Insights and gamification
- Muscle volume heatmap and radar balance visualizations.
- XP and rank system with milestone trophies.
- Weekly workout streaks with grace day tracking.

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo, Expo Router, TypeScript |
| Local database | WatermelonDB (SQLite, offline-first) |
| Backend API | Express 5, TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Authentication | JWT with HS256 (access token and refresh token rotation) |
| Cache | Upstash Redis |
| AI | Google Gemini API (`@google/genai`) |
| Food data | USDA FoodData Central API |

---

## Project structure

```
Iron-Log/
├── apps/
│   ├── mobile/                  # React Native and Expo mobile client
│   │   ├── app/                 # Expo Router typed screens
│   │   │   ├── (tabs)/          # Workout (index), Nutrition, Achievements, Body, Insights
│   │   │   ├── onboarding/      # Profile setup and goal onboarding
│   │   │   ├── program/         # Workout plan builder
│   │   │   ├── workout/         # Live workout runner
│   │   │   ├── ai/              # Coach interactive chat
│   │   │   └── settings/        # Account controls and units
│   │   ├── components/          # GlassCard UI kit, rest timers, charts, heatmap
│   │   ├── constants/           # Obsidian design tokens and theme
│   │   ├── services/            # Axios API client and offline set sync queue
│   │   └── store/               # Zustand auth store backed by expo-secure-store
│   │
│   └── api/                     # Express 5 and TypeScript REST API
│       ├── prisma/              # Schema, migrations, and exercise seed data
│       ├── src/
│       │   ├── routes/          # Domain routers
│       │   ├── controllers/     # Route handlers
│       │   ├── services/        # Business logic, Gemini integration, USDA, event bus
│       │   ├── repositories/    # Prisma data access layer with user ownership filters
│       │   ├── middleware/      # Auth, rate-limiting, error handling
│       │   ├── utils/           # Logger, error classes, prompt guard
│       │   └── index.ts         # Server entry point
│       └── tests/               # Vitest suite
│
└── packages/
    └── shared/                  # Shared TypeScript types, rank definitions, XP rules
```

---

## Getting started

### Prerequisites

- Node.js v18+
- npm v9+
- Expo CLI (`npm install -g expo-cli`)

External accounts needed:
- PostgreSQL instance (Supabase or local PostgreSQL)
- Google AI Studio API key (for Gemini)
- Upstash Redis instance (optional, falls back to in-memory store in development)

---

### 1. Clone the repository

```bash
git clone https://github.com/ShivenThakker/Iron-Log.git
cd Iron-Log
```

---

### 2. Install dependencies

From the monorepo root:

```bash
npm install
```

---

### 3. Environment variables

#### Backend (`apps/api/.env`)

Create `apps/api/.env`:

```bash
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=your_jwt_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_chars
GEMINI_API_KEY=your_gemini_api_key
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
USDA_API_KEY=
PORT=3000
NODE_ENV=development
```

#### Mobile (`apps/mobile/.env`)

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```

When testing on a physical mobile device, replace `localhost` with your machine's local network IP address.

---

### 4. Database setup

Generate Prisma client and run migrations:

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
```

---

### 5. Running locally

**Start the API:**

```bash
npm run dev --workspace=api
```

Health check:
```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"..."}
```

**Start the mobile application:**

```bash
npm run start --workspace=mobile
```

Press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with the Expo Go app.

---

### 6. Testing and typechecking

Run typecheck across all workspaces:

```bash
npm run typecheck
```

Run backend unit and integration tests:

```bash
npm test --workspace=api
```

---

## Security

- All endpoints except `/auth/*` and `/health` require valid Bearer JWT authentication.
- Access tokens expire in 15 minutes. Refresh tokens rotate every 30 days.
- Refresh tokens are stored in `expo-secure-store` on native devices, never plain storage.
- Every database query in repositories scopes to `user_id = req.user.id`.
- Request payloads validate against Zod schemas before reaching business logic.
- Gemini API key remains strictly server-side and is never exposed to mobile clients.

---

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m "feat: add feature description"`.
4. Run `npm run typecheck` and `npm test --workspace=api`.
5. Open a Pull Request.

---

## License

MIT
