# 🏋️ IronLog — All-in-One Fitness Companion

> Your AI-powered personal trainer, nutritionist, and coach — all in one free app.

IronLog is a **free, offline-first mobile fitness app** (iOS + Android) that consolidates everything a gym-goer needs into a single platform: AI-generated workout plans, nutrition tracking, body metrics, strength progression, gamification, and an in-app AI coach. Total infrastructure cost at MVP: **$0/month**.

---

## 📱 Features

### 🤖 AI-Powered Training
- **AI Workout Plan Generator** — Describe your goals, equipment, and schedule; Gemini 2.0 Flash builds you a fully structured program (Push/Pull/Legs, Upper/Lower, Full Body, etc.) with sets, reps, rest periods, and RPE targets
- **AI Auto-Periodization** — After every session, the AI reviews your performance and suggests progressive overload, deload weeks, or volume progression automatically
- **AI Fitness Chatbot** — A context-aware in-app coach (knows your program, recent sessions, calories, and body weight) that answers any fitness or nutrition question in real time
- **AI Calorie Scanner** *(optional)* — Photograph a meal; AI identifies foods, estimates macros, and waits for your confirmation before logging
- **AI Form Checker** *(optional)* — Record a set; AI analyses joint angles and returns a form score (0–100) with per-body-segment feedback

### 💪 Workout Logging
- Full **Active Workout Mode** with animated 3D exercise illustrations, rest timer, and custom numeric keyboard
- **Set types**: Normal, Warmup (excluded from PRs), and Failure (flags for deload detection)
- **Timed exercise mode** for planks, wall sits, and holds — countdown timer replaces the reps input
- Swipe to delete sets, copy weight/reps to all following sets, shuffle or swap exercises mid-workout
- **Add Past Workouts** — retroactively log sessions for any previous date
- Workout Summary with per-exercise breakdown and AI suggestions for next session

### 🍽️ Nutrition Tracking
- TDEE calculator (Mifflin-St Jeor) with auto macro split, fully overridable
- Food logging via **USDA FoodData Central search**, barcode scanner (Open Food Facts), or manual entry
- Logs for any past or present date; meal slots: Breakfast, Lunch, Dinner, Snacks
- Weekly nutrition summary and calorie distribution charts

### 📊 Body & Strength Tracking
- **Weight Log** — daily entries, goal weight, % to goal ring, trend chart with moving average
- **Body Measurements** — Chest, Waist, Hips, Arms (L/R), Thighs (L/R), Calves (L/R), Neck, Body Fat %
- **Progress Photos** — Front / Side / Back angle slots with timeline comparison
- **Strength Progression Charts** — Best Set Weight, Estimated 1RM (Epley formula), and Total Volume over time
- **Strength Standards** — Compare your 1RM against Beginner / Novice / Intermediate / Advanced / Elite benchmarks for Bench, Squat, Deadlift, OHP, and Barbell Row
- BMI auto-calculated from your latest weight and profile height

### 🏆 Gamification
- **XP & Rank System** — 12 rank tiers from Rookie upward; earn XP by completing workouts (+50), setting PRs (+25), and maintaining streaks (+10/week)
- **Trophy Case** — 12 trophies across Streak, Workouts, Milestones, and Special categories
- **PR Celebration** — Full-screen confetti overlay mid-workout with a shareable PNG card
- **Daily Streak** — One grace day per week before your streak resets; milestone badges at 7, 30, 60, 100, and 365 days

### 📈 Insights
- **Muscle Heatmap** — Front + back body diagram with a red gradient by training volume (shareable image)
- **Muscle Balance Radar Chart** — 7 muscle groups visualised (requires 3+ logged)
- Workout stats: Volume, Calories Burned, Workout Time, Sessions
- Equipment distribution and calorie-by-meal-slot pie charts

### 🔗 Platform Integrations
- **Apple Health** (iOS) — sync workouts out, import body weight in
- **Google Fit** (Android) — same bidirectional sync
- **Home Screen Widget** — streak, calories, and next workout at a glance
- Apple Watch / Wear OS — V2 roadmap

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo (single codebase, iOS + Android) |
| Local DB | WatermelonDB (SQLite, offline-first) |
| Backend | Node.js + Express.js + TypeScript |
| Hosting | Render free tier + cron-job.org keep-alive |
| Database | PostgreSQL via Supabase free tier |
| ORM | Prisma |
| Auth | Supabase Auth (Google OAuth + email/password) |
| File Storage | Supabase Storage (photos, videos, exports) |
| Cache | Upstash Redis (serverless, free tier) |
| AI (all features) | Google Gemini 2.0 Flash (free tier via Google AI Studio) |
| Food Database | USDA FoodData Central API (free, no key required) |
| Barcode Lookup | Open Food Facts API (free, open source) |
| Push Notifications | Expo Push Notifications |
| Analytics | PostHog free tier |
| Email | Resend free tier |
| Error Tracking | Sentry free tier |
| Builds + OTA | Expo EAS free tier |

**Total monthly infrastructure cost: $0**

---

> For deep technical architecture, 44-endpoint API catalog, data models, and security specifications, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 📂 Project Structure

```
Iron-Log/
├── apps/
│   ├── mobile/                  # React Native + Expo mobile application (Obsidian Kinetic)
│   │   ├── app/                 # Expo Router typed screens
│   │   │   ├── (tabs)/          # Workout (index), Nutrition, Achievements, Body, Insights
│   │   │   ├── onboarding/      # 4-step biometric, goal & AI plan onboarding
│   │   │   ├── program/         # Workout Plan Builder (Single Day, Full Week, AI Ingestion)
│   │   │   ├── workout/         # Live runner, rest timers, PR celebration, completion summary
│   │   │   ├── ai/              # Context-aware AI coach interactive chat
│   │   │   └── settings/        # Account controls, units, logout
│   │   ├── assets/              # App icons, splash, body svg regions & base PNG
│   │   ├── components/          # GlassCard UI kit, rest timers, SVG charts & heatmap
│   │   ├── constants/           # Obsidian Kinetic design tokens & theme
│   │   ├── services/            # Axios API client with dynamic LAN host & JWT auto-refresh
│   │   └── store/               # Zustand auth store backed by expo-secure-store
│   │
│   └── api/                     # Express.js 5 + TypeScript REST API
│       ├── prisma/              # Prisma schema, migrations, and ChunkItUp exercise seed data
│       ├── src/
│       │   ├── routes/          # 12 domain routers (auth, sessions, programs, ai, etc.)
│       │   ├── controllers/     # Express route handlers
│       │   ├── services/        # Business logic (Gemini, USDA, auth, user, PR detection)
│       │   ├── repositories/    # Prisma data access layer with ownership verification
│       │   ├── middleware/      # Auth, rate-limiting, error handling, validation
│       │   ├── validators/      # Zod request validation schemas
│       │   ├── utils/           # Structured AI JSON parsing, prompt guard, logger
│       │   └── index.ts         # Server boot, security headers & routing pipeline
│       └── tests/               # Vitest suite (streak, PR detection, prompt guard, aiJson)
│
└── packages/
    └── shared/                  # Monorepo shared TypeScript types, ranks, and XP rules
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- [EAS CLI](https://docs.expo.dev/eas/) — `npm install -g eas-cli`

You'll also need free accounts on:

- [Supabase](https://supabase.com/) — database, auth, and file storage
- [Google AI Studio](https://aistudio.google.com/) — Gemini API key
- [Upstash](https://upstash.com/) — serverless Redis
- [Render](https://render.com/) — API hosting
- [cron-job.org](https://cron-job.org/) — keep-alive ping

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ironlog.git
cd ironlog
```

---

### 2. Install Dependencies

**Backend (API):**
```bash
cd apps/api
npm install
```

**Mobile:**
```bash
cd apps/mobile
npm install
```

---

### 3. Set Up Environment Variables

#### Backend (`apps/api/.env`)

Create the file and fill in your values — **never commit this file**:

```bash
DATABASE_URL=              # Supabase PostgreSQL connection string
SUPABASE_URL=              # Supabase project URL
SUPABASE_SERVICE_KEY=      # Supabase service role key (server only)
SUPABASE_STORAGE_BUCKET=   # Storage bucket name
REDIS_URL=                 # Upstash Redis URL
GEMINI_API_KEY=            # Google AI Studio key (free at aistudio.google.com)
JWT_SECRET=                # Secret for signing JWT access tokens
JWT_REFRESH_SECRET=        # Separate secret for refresh tokens
USDA_API_KEY=              # Optional — some endpoints work without it
```

> **Security note:** `GEMINI_API_KEY` must stay server-side only. It should never appear in any mobile code or be bundled into the app.

#### Mobile (`apps/mobile/.env`)

```bash
EXPO_PUBLIC_API_URL=       # Your deployed Render API URL (or http://localhost:3000 locally)
```

---

### 4. Set Up the Database

Run Prisma migrations against your Supabase PostgreSQL instance:

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
```

To seed the database with the static exercise library and strength standards reference data:

```bash
npx prisma db seed
```

---

### 5. Run Locally

**Start the backend API:**
```bash
cd apps/api
npm run dev
```
The API will be available at `http://localhost:3000`. You can verify it's running by hitting the health endpoint:
```bash
curl http://localhost:3000/health
# → { "status": "ok", "timestamp": "..." }
```

**Start the mobile app:**
```bash
cd apps/mobile
npx expo start
```
Scan the QR code with the **Expo Go** app (iOS or Android), or press `i` for iOS Simulator / `a` for Android Emulator.

---

## ☁️ Deployment

### Backend — Render

1. Push the `apps/api` directory to a GitHub repository
2. Create a new **Web Service** on [Render](https://render.com/)
3. Connect your GitHub repo; set the build command to `npm install && npx prisma migrate deploy && npm run build` and the start command to `npm start`
4. Add all environment variables from `apps/api/.env` in the Render dashboard
5. After deployment, grab your Render URL (e.g. `https://ironlog-api.onrender.com`)

**Keep-alive setup (prevents Render free-tier spin-down):**
1. Go to [cron-job.org](https://cron-job.org/) and create a free account
2. Add a new cron job that hits `https://your-render-url.onrender.com/health` every **10 minutes**
3. Done — your API will never cold-start for users

---

### Mobile — Expo EAS

**Configure EAS:**
```bash
cd apps/mobile
eas build:configure
```

**Build for both platforms:**
```bash
eas build --platform all
```

**Submit to stores:**
```bash
eas submit --platform ios
eas submit --platform android
```

**Push an OTA update** (for JS-only changes, no store submission needed):
```bash
eas update --branch production --message "Fix nutrition log bug"
```

---

## 📖 How to Use

### Onboarding

When you first open IronLog, a 16-step onboarding flow collects your basics — name, DOB, height, weight, fitness goal, activity level, experience, equipment, training preferences, and any injuries. The app then generates a personalised AI workout plan and calorie targets before landing you on the home carousel.

### Home Carousel

Swipe left and right across 5 summary cards:
- **Workout Plan** — next workout, muscle targets, start button
- **Nutrition Plan** — calories remaining, macro bars, meal slots
- **Achievements** — rank badge, XP progress
- **Body** — current weight, goal ring, measurements
- **Insights** — muscle heatmap preview

### Logging a Workout

1. Tap the **Workout** tab → select your active plan → hit **Start Workout**
2. For each exercise: enter weight and reps (or use the countdown timer for timed exercises), then tap the checkmark to complete the set
3. The rest timer starts automatically — skip it anytime
4. If the AI has a progressive overload suggestion (e.g. "Try 62.5 kg today"), a gold banner appears above the set — tap to accept or dismiss
5. Hit **Finish** when done — you'll see a Workout Summary, XP celebration, and any new periodization suggestions for next session

### Logging Food

1. Tap the **Nutrition** tab → select a meal slot → **Add Food**
2. Search the USDA database, scan a barcode, use the AI photo scanner, or enter manually
3. Adjust the quantity and confirm — macros update immediately

### Tracking Body Metrics

Tap the **Body** tab to log your weight, body measurements, or progress photos. All entries support backdating — tap **Log Past Entry** to add data for any previous date.

### AI Chatbot

Tap the floating **purple bubble** (bottom right, any screen) to open the AI coach. It has access to your current program, recent sessions, today's nutrition, and body weight — so it can answer questions like:
- *"What should I eat post-workout?"*
- *"Can you suggest a substitute for cable flyes?"*
- *"Am I in a calorie deficit this week?"*

Free tier: 20 messages/day.

---

## 🔒 Security

- All routes except `/auth/*` and `/health` are protected by JWT middleware
- JWT access tokens expire after **15 minutes**; refresh tokens after **30 days**
- Refresh tokens are stored in **Expo SecureStore only** — never AsyncStorage
- Every database query includes a `WHERE user_id = req.user.id` guard — no cross-user data access is possible
- Rate limiting via Upstash Redis: 100 req/min per IP on public routes, 500 req/min per authenticated user
- AI endpoint daily limits: chatbot 20 messages, plan generation 5 plans, calorie scanner 20 scans, form checker 10 checks
- All file uploads are MIME-type validated server-side (5MB max for photos, 50MB for videos)
- HTTPS enforced on all Render endpoints with HSTS enabled

---

## 🗺️ Roadmap

| Feature | Status |
|---|---|
| AI workout plan generation | ✅ MVP |
| AI auto-periodization | ✅ MVP |
| AI fitness chatbot | ✅ MVP |
| AI calorie photo scanner | ✅ MVP |
| AI form checker | ✅ MVP |
| Manual workout program editor | ✅ MVP |
| Active workout mode | ✅ MVP |
| Nutrition logging (USDA + barcode + manual) | ✅ MVP |
| Body tracking (weight, measurements, photos) | ✅ MVP |
| Strength progression + 1RM estimator | ✅ MVP |
| Strength standards comparison | ✅ MVP |
| XP & rank system (12 tiers) | ✅ MVP |
| Trophy case (12 trophies) | ✅ MVP |
| PR celebration overlay | ✅ MVP |
| Muscle heatmap + radar chart | ✅ MVP |
| Offline-first (WatermelonDB) | ✅ MVP |
| Apple Health / Google Fit sync | ✅ MVP |
| Home screen widget | ✅ MVP |
| Retroactive logging (any past date) | ✅ MVP |
| Apple Watch / Wear OS | 🔜 V2 |
| Dynamic Island live activity | 🔜 V2 |
| Social features & public profiles | 🔜 Future |
| Coach marketplace | 🔜 Future |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request against `develop`

**Before submitting a PR, please make sure:**
- TypeScript compiles with no errors (`npm run type-check`)
- No `any` types — use `unknown` and narrow it
- All API routes have Zod validation on the request body
- Every DB query includes the `user_id` guard
- No Prisma calls outside of repository files
- No hardcoded colour values — use the design token constants

---

## 📄 License

[MIT](LICENSE)

---

<p align="center">Built with 🔴 and zero dollars a month.</p>
