# Graph Report - Iron-Log  (2026-10-16)

## Corpus Check
- 138 files · ~56,793 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 2, .prisma 1)

## Summary
- 735 nodes · 1487 edges · 53 communities (40 shown, 13 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Mobile UI & Onboarding
- Mobile Dependencies
- API Metadata
- Mobile Metadata
- App Configuration
- Session Management
- Gamification Constants
- Project Documentation
- API Dependencies
- Authentication Controller
- Root Project Config
- Equipment Management
- Database Client
- Mobile App Layout
- Local Storage
- Shared TS Config
- Mobile Maintenance
- API Dev Tools
- Nutrition Tracking
- Program Management
- API TS Config
- Shared Package
- Cache Layer
- Body Metrics
- Authentication Data
- User Data
- Authentication Logic
- AI Engine (Gemini)
- Error Handling
- UI Components
- API Infrastructure
- Mobile Build Scripts
- Analytics API
- Exercise Catalog
- Gamification API
- Body Metrics Data
- Visual Design
- Mobile TS Config
- API Build Scripts
- AI API
- User Profile API
- Analytics Data
- Gamification Data
- Program Data
- Equipment Data
- Exercise Data
- Nutrition Data
- Mobile Linting
- Mobile Dev Tools
- Data Seeding
- Global TS Config
- API Type Definitions

## God Nodes (most connected - your core abstractions)
1. `Text()` - 41 edges
2. `react-native` - 36 edges
3. `react` - 33 edges
4. `COLORS` - 32 edges
5. `express` - 31 edges
6. `Icon()` - 30 edges
7. `SPACING` - 26 edges
8. `RADIUS` - 25 edges
9. `Badge()` - 24 edges
10. `GlassCard()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `TabLayout()` --calls--> `Icon()`  [EXTRACTED]
  apps/mobile/app/(tabs)/_layout.tsx → apps/mobile/components/ui/Icon.tsx
- `RootLayout()` --calls--> `useAuthStore`  [EXTRACTED]
  apps/mobile/app/_layout.tsx → apps/mobile/store/useAuthStore.ts
- `LoginScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  apps/mobile/app/login.tsx → apps/mobile/store/useAuthStore.ts
- `RegisterScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  apps/mobile/app/register.tsx → apps/mobile/store/useAuthStore.ts
- `SettingsScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  apps/mobile/app/settings/index.tsx → apps/mobile/store/useAuthStore.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **AI Powered Features** — readme_ai_workout_plan_generator, readme_ai_auto_periodization, readme_ai_fitness_chatbot, readme_ai_calorie_scanner, readme_ai_form_checker [EXTRACTED 1.00]

## Communities (53 total, 13 thin omitted)

### Community 0 - "Mobile UI & Onboarding"
Cohesion: 0.05
Nodes (115): AiChatScreen(), ChatMessage, STARTER_PROMPTS, styles, styles, styles, COMMON_LIMITATIONS, DURATIONS (+107 more)

### Community 1 - "Mobile Dependencies"
Cohesion: 0.05
Nodes (38): dependencies, axios, @babel/plugin-proposal-decorators, expo, expo-constants, expo-font, @expo-google-fonts/inter, @expo-google-fonts/jetbrains-mono (+30 more)

### Community 2 - "API Metadata"
Cohesion: 0.07
Nodes (28): author, description, @ironlog/shared, typescript, keywords, license, main, name (+20 more)

### Community 3 - "Mobile Metadata"
Cohesion: 0.07
Nodes (28): @ironlog/shared, typescript, main, name, private, version, @babel/plugin-proposal-decorators, expo (+20 more)

### Community 4 - "App Configuration"
Cohesion: 0.07
Nodes (27): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, edgeToEdgeEnabled, package, predictiveBackGestureEnabled (+19 more)

### Community 5 - "Session Management"
Cohesion: 0.11
Nodes (13): addSet(), finishSession(), getSession(), getSessions(), startSession(), prRepository, sessionRepository, router (+5 more)

### Community 6 - "Gamification Constants"
Cohesion: 0.10
Nodes (14): Rank, RANKS, XP_RULES, RankTier, TrophyData, UserXpData, DailyNutritionSummary, MealSlot (+6 more)

### Community 7 - "Project Documentation"
Cohesion: 0.14
Nodes (20): IronLog, AI Auto-Periodization, AI Calorie Scanner, AI Fitness Chatbot, AI Form Checker, AI Workout Plan Generator, Body & Strength Tracking, Gamification (+12 more)

### Community 8 - "API Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, bcryptjs, better-sqlite3, cors, dotenv, express, google-auth-library, @google/generative-ai (+11 more)

### Community 9 - "Authentication Controller"
Cohesion: 0.18
Nodes (14): googleAuth(), login(), logout(), refresh(), register(), rateLimit(), requestTimestamps, authLimiter (+6 more)

### Community 10 - "Root Project Config"
Cohesion: 0.13
Nodes (14): allowScripts, better-sqlite3@12.8.0, esbuild@0.27.4, prisma@7.5.0, @prisma/engines@7.5.0, name, private, scripts (+6 more)

### Community 11 - "Equipment Management"
Cohesion: 0.26
Nodes (9): createEquipmentProfile(), getEquipmentProfiles(), setActiveEquipmentProfile(), getPersonalRecords(), getRecentPersonalRecords(), requireAuth(), router, router (+1 more)

### Community 12 - "Database Client"
Cohesion: 0.35
Nodes (3): globalForPrisma, prisma, @prisma/client

### Community 13 - "Mobile App Layout"
Cohesion: 0.18
Nodes (11): queryClient, RootLayout(), LoginScreen(), RegisterScreen(), AuthState, useAuthStore, @expo-google-fonts/inter, @expo-google-fonts/jetbrains-mono (+3 more)

### Community 14 - "Local Storage"
Cohesion: 0.23
Nodes (6): adapter, database, ExerciseSet, WorkoutSession, mySchema, @nozbe/watermelondb

### Community 15 - "Shared TS Config"
Cohesion: 0.15
Nodes (12): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, module, outDir, rootDir (+4 more)

### Community 16 - "Mobile Maintenance"
Cohesion: 0.17
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 17 - "API Dev Tools"
Cohesion: 0.18
Nodes (11): devDependencies, prisma, ts-node, tsx, @types/bcryptjs, @types/cors, @types/express, @types/jsonwebtoken (+3 more)

### Community 18 - "Nutrition Tracking"
Cohesion: 0.29
Nodes (7): addNutritionLog(), getDailyNutrition(), searchFood(), validate(), router, logNutritionSchema, zod

### Community 19 - "Program Management"
Cohesion: 0.31
Nodes (8): createProgram(), deleteProgram(), getProgram(), getPrograms(), updateProgram(), router, createProgramSchema, updateProgramSchema

### Community 20 - "API TS Config"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 21 - "Shared Package"
Cohesion: 0.18
Nodes (10): devDependencies, typescript, typescript, main, name, scripts, build, typecheck (+2 more)

### Community 22 - "Cache Layer"
Cohesion: 0.22
Nodes (7): memoryStore, redis, COMMON_FOODS, FoodItem, usdaService, axios, @upstash/redis

### Community 23 - "Body Metrics"
Cohesion: 0.36
Nodes (6): addMeasurement(), addWeightLog(), getWeightHistory(), router, logMeasurementSchema, logWeightSchema

### Community 24 - "Authentication Data"
Cohesion: 0.22
Nodes (5): authRepository, googleClient, bcryptjs, google-auth-library, jsonwebtoken

### Community 27 - "AI Engine (Gemini)"
Cohesion: 0.31
Nodes (3): ChatMessage, geminiService, @google/generative-ai

### Community 28 - "Error Handling"
Cohesion: 0.31
Nodes (4): AppError, BadRequestError, ForbiddenError, NotFoundError

### Community 29 - "UI Components"
Cohesion: 0.22
Nodes (5): IconMapping, IconSymbolName, MAPPING, expo-symbols, @expo/vector-icons

### Community 30 - "API Infrastructure"
Cohesion: 0.50
Nodes (4): app, errorHandler(), router, logger

### Community 31 - "Mobile Build Scripts"
Cohesion: 0.25
Nodes (8): scripts, android, ios, lint, reset-project, start, typecheck, web

### Community 32 - "Analytics API"
Cohesion: 0.48
Nodes (5): getEquipment(), getHeatmap(), getRadar(), getWorkoutStats(), router

### Community 33 - "Exercise Catalog"
Cohesion: 0.48
Nodes (5): createCustomExercise(), getAllExercises(), getExercise(), shuffleExercise(), router

### Community 34 - "Gamification API"
Cohesion: 0.43
Nodes (4): checkTrophies(), getGamificationProfile(), getTrophies(), router

### Community 37 - "Mobile TS Config"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, strict, extends, include, expo/tsconfig.base

### Community 38 - "API Build Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, start, test, typecheck

### Community 39 - "AI API"
Cohesion: 0.53
Nodes (4): analyzeWorkout(), chatCompletion(), generatePlan(), router

### Community 40 - "User Profile API"
Cohesion: 0.47
Nodes (4): getProfile(), updateProfile(), updateProfileSchema, router

### Community 47 - "Mobile Linting"
Cohesion: 0.40
Nodes (4): { defineConfig }, expoConfig, eslint, eslint-config-expo

### Community 48 - "Mobile Dev Tools"
Cohesion: 0.40
Nodes (5): devDependencies, eslint, eslint-config-expo, @types/react, typescript

### Community 50 - "Global TS Config"
Cohesion: 0.50
Nodes (3): compilerOptions, extends, expo/tsconfig.base

## Knowledge Gaps
- **47 isolated node(s):** `@ironlog/shared`, `better-sqlite3`, `pino-pretty`, `uuid`, `@types/bcryptjs` (+42 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 388 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `axios` connect `Cache Layer` to `Mobile UI & Onboarding`, `Mobile Metadata`?**
  _High betweenness centrality (0.355) - this node is a cross-community bridge._
- **What connects `@ironlog/shared`, `better-sqlite3`, `pino-pretty` to the rest of the system?**
  _47 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Mobile UI & Onboarding` be split into smaller, more focused modules?**
  _Cohesion score 0.05194358445132439 - nodes in this community are weakly interconnected._
- **Why does `express` connect `Equipment Management` to `Analytics API`, `Exercise Catalog`, `API Metadata`, `Gamification API`, `Session Management`, `AI API`, `User Profile API`, `Authentication Controller`, `Nutrition Tracking`, `Program Management`, `Body Metrics`, `API Infrastructure`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Should `Mobile Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Mobile Dependencies` to `Mobile Metadata`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `API Metadata` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._