# IronLog Screen Map & Client Integration Spec

This document maps all Stitch designs to Expo Router routes, establishes screen integration order, documents frontend-only UI changes, and details client-to-backend response shape realignments.

---

## 1. Phase 3 Screen Implementation Sequence

The screens will be implemented in this exact sequence:

1. `apps/mobile/app/settings/index.tsx` *(Settings & User Profile)*
2. `apps/mobile/app/(tabs)/body.tsx` *(Body Composition & Progress)*
3. `apps/mobile/app/(tabs)/nutrition.tsx` *(Daily Nutrition & Macros)*
4. `apps/mobile/app/(tabs)/insights.tsx` *(Training Analytics & Biometrics)*
5. `apps/mobile/app/(tabs)/achievements.tsx` *(Rank, Trophy Case & XP)*
6. `apps/mobile/app/(tabs)/index.tsx` *(Workout Dashboard)*
7. `apps/mobile/app/workout/active.tsx` *(Active Workout Session)*
8. `apps/mobile/app/workout/summary.tsx` *(Workout Completion Summary)*
9. `apps/mobile/app/program/builder.tsx` *(Weekly Schedule & Split Builder)*
10. `apps/mobile/app/onboarding/index.tsx` *(4-Step Onboarding Flow)*
11. `apps/mobile/app/ai/chat.tsx` *(AI Coach Chat Interface)*

---

## 2. Complete Screen Map Table

| Stitch Screen Folder | Expo Route File | Existing Hooks / Services Maintained | Changes (New / Removed vs. Old) |
|---|---|---|---|
| `workout_dashboard_obsidian_volt` | `app/(tabs)/index.tsx` | `useQuery` (`/users/profile`, `/gamification`, `/nutrition/daily/:date`, `/sessions`, `/programs/active`), `useRouter` | **Changed:** Replaced 4-button quick shortcut row with 2-button matrix (`Plan Builder`, `Log Weight`). Preserves FAB for AI Coach. High-energy Volt play button for Today's Workout. Obsidian kinetic surface tokens. |
| `nutrition_daily_macros` | `app/(tabs)/nutrition.tsx` | `useQuery` (`/nutrition/daily/:date`, `/nutrition/search`), `useMutation` (`/nutrition/log`) | **Changed:** Circular calorie radial meter + macro progress bars (Protein, Carbs, Fats). Meal category cards (Breakfast, Lunch, Dinner, Snacks) with instant rapid item chips. Added Barcode Rapid Scan callout UI. |
| `body_progress_composition` | `app/(tabs)/body.tsx` | `useQuery` (`/body/weight`), `useMutation` (`/body/weight`, `/body/measurement`) | **Changed:** Weight trend chart with Volt glow, 7-day moving average, target weight reference. Structured measurement tiles (Chest, Arms, Waist, Thighs) with delta badges. Skeletal muscle & body fat composition stat cards. |
| `insights_training_analytics` | `app/(tabs)/insights.tsx` | `useQuery` (`/analytics/stats`, `/analytics/heatmap`, `/analytics/radar`, `/analytics/equipment`) | **Changed:** 2x2 Bento grid for Total Volume, Completed Sessions, Avg Duration, PRs. Dynamic muscle volume heatmap with front/back toggle. 6-axis muscular equilibrium score. Equipment distribution progress bars. Weekly AI coaching prompt. |
| `rank_trophy_case_xp` | `app/(tabs)/achievements.tsx` | `useQuery` (`/gamification`) | **Changed:** Tier status hero card (Rookie, Grinder, etc.) with XP progress track gauge. Category-based Trophy Case (Streak, Workouts, Milestones) with unlocked / locked card states. Reads all trophies from `gamificationData.trophies`. |
| `active_workout_streamlined_bold` | `app/workout/active.tsx` | `api.post('/sessions')`, `api.get('/exercises')`, `api.post('/sessions/:id/sets')`, `api.put('/sessions/:id/finish')`, `expo-haptics` | **Changed:** Tactical gym dial stepper modules for Weight (kg/lbs) and Reps with quick jump buttons (+/- 2.5, +/- 5 kg). Target effort styles (Regular, Warmup, Dropset, Failure) with RPE popover guide. Set pill strip with add/remove set affordance. Massive high-contrast Volt set completion button. Preserves F9 exercise ID lookup. |
| `session_complete_workout_summary` | `app/workout/summary.tsx` | `useLocalSearchParams`, `useRouter` | **Changed:** Radiant celebration icon, duration / volume / sets trio metrics, PR celebration card (+25 XP), streak & rank progress bar (+75 XP), exercise breakdown list, Share and Done Lifting actions. |
| `plan_builder_perfected_hybrid` | `app/program/builder.tsx` | `api.get('/exercises')`, `api.post('/ai/parse-plan')`, `api.post('/programs/full')`, `api.post('/programs/day')` | **Changed:** Day selector tabs (Mon–Sun) with rest day toggles, program rename inline, structured exercise cards with Volume (Sets), Target Reps, Recovery (Rest seconds), drag reorder, delete exercise, Add Exercise dashed button, Import plan CTA. Preserves F5 input limits. |
| `onboarding_1._baseline_biometrics_refined` | `app/onboarding/index.tsx` (Step 1) | `useRouter`, form state | **Changed:** Clean baseline biometrics: Name/Nickname, Biological sex selector (Male, Female, Other), Age stepper, Height stepper with cm/ft toggle, Current weight stepper with kg/lbs toggle. |
| `onboarding_2._goals_experience_refined` | `app/onboarding/index.tsx` (Step 2) | Form state | **Changed:** Primary goal selection (Build Muscle, Lose Fat, Get Stronger, Athletic Conditioning), target weight delta calculator, experience level selector (Beginner, Intermediate, Advanced). |
| `onboarding_3._training_equipment_refined` | `app/onboarding/index.tsx` (Step 3) | Form state | **Changed:** Weekly frequency (2-6 days), preferred split pills (PPL, Upper/Lower, Full Body, Arnold), available equipment chips, muscle focus pills, joint caution safeguards. |
| `onboarding_4._plan_summary_confirm_refined` | `app/onboarding/index.tsx` (Step 4) | `api.put('/users/profile')`, `api.post('/equipment')`, `api.post('/body/weight')`, `api.post('/ai/generate-plan')` | **Changed:** Athlete card summary, configuration breakdown bento, smart progression toggle switch, AI synthesis button. Consolidates 16 steps into a refined 4-step wizard. |
| *(No direct Stitch folder)* | `app/settings/index.tsx` | `useAuthStore`, `useQuery` (`/users/profile`), `api.post('/auth/logout')` | **Unchanged features:** Layout & styling updated with Obsidian Kinetic design tokens (`tokens.ts`), maintaining all profile info, unit preferences, notification toggles, and account deletion. Preserves F13 `refreshToken` on logout. |
| *(No direct Stitch folder)* | `app/ai/chat.tsx` | `api.post('/ai/chat')`, `useAuthStore` | **Kept:** Retains AI coach chat conversation interface, styled with dark obsidian theme tokens. Preserves F5 2,000 char limit. |
| *(No direct Stitch folder)* | `app/(tabs)/_layout.tsx` | Expo Router Tabs, `phosphor-react-native` | **Changed:** Updated bottom navigation icons, labels (Workout, Nutrition, Rank, Body, Insights), backdrop blur, and Volt active tint. |
| *(No direct Stitch folder)* | `app/_layout.tsx` | QueryClientProvider, fonts, Stack router | **Changed:** Space Grotesk font loading alongside Inter. Preserves F8 401 refresh interceptor. |
| *(No direct Stitch folder)* | `app/login.tsx` | `api.post('/auth/login')`, `useAuthStore` | **Kept:** Authentication entry screen styled with design tokens. |
| *(No direct Stitch folder)* | `app/register.tsx` | `api.post('/auth/register')`, `useAuthStore` | **Kept:** Registration entry screen styled with design tokens. |
| *(No direct Stitch folder)* | `app/index.tsx` | Root auth redirect | **Kept:** Session redirect logic intact. |
| *(No direct Stitch folder)* | `app/onboarding/_layout.tsx` | Stack router | **Kept:** Onboarding stack wrapper intact. |

---

## 3. Frontend-Only UI Removals (Moved from Ledger)

These were redundant UI shortcuts dropped in Stitch without affecting any backend endpoint:

1. **Dashboard Shortcut: "Active Session" Button**:
   - Dropped from the 4-button shortcut grid on the dashboard.
   - Replaced by the prominent Volt "Start Workout" button on the Today's Workout hero card.
   - The underlying active workout screen (`workout/active.tsx`) is fully maintained.
2. **Dashboard Shortcut: "AI Coach" Button**:
   - Dropped from the 4-button shortcut grid on the dashboard.
   - Replaced by the dedicated, pulsing Floating Action Button (FAB) in the bottom-right corner.
   - The underlying AI chat screen (`ai/chat.tsx`) and `POST /ai/chat` endpoint are fully maintained.

---

## 4. Client Realignments (Response Shape Comparisons)

The old frontend had typos and mismatched route paths that caused 404s, falling back to static dummy data. The table below compares what the real backend endpoints actually return versus what the new Stitch screens expect:

### A. Insights Tab (`apps/mobile/app/(tabs)/insights.tsx`)

| Metric | Real Backend Endpoint | Real Response Shape | Stitch Screen Expected Shape | Compatibility & Adapter Plan |
|---|---|---|---|---|
| **Stats Bento** | `GET /analytics/stats` | `{ totalSessions: number, prCount: number, totalSets: number, totalVolumeKg: number, avgSessionDurationMin: number, streak: number, longestStreak: number }` | • Total Volume (kg)<br>• Sessions Completed<br>• Avg Duration (min)<br>• PRs Set | **Exact 1-to-1 match.** Direct mapping: `totalVolumeKg`, `totalSessions`, `avgSessionDurationMin`, `prCount`. |
| **Heatmap** | `GET /analytics/heatmap?period=30` | `{ periodDays: number, totalWorkingSets: number, muscles: { Chest: { sets, volume_kg, intensity }, Back: { ... }, ... } }` | Muscle volume heatmap with Inactive, Moderate, and Peak Volume intensities | **Exact 1-to-1 match.** `intensity` is normalized 0.0–1.0, matching the 3 threshold colors. |
| **Radar** | `GET /analytics/radar` | `[ { axis: 'Chest', value: number, sets: number }, { axis: 'Back', ... }, ... ]` | 6-axis muscular equilibrium radar chart | **Exact 1-to-1 match.** 6 axes: Chest, Back, Shoulders, Arms, Legs, Core. |
| **Equipment** | `GET /analytics/equipment` | `[ { name: string, count: number, percentage: number }, ... ]` | Equipment distribution progress bars (Barbell %, Dumbbells %, Cables %, Machines %) | **Exact 1-to-1 match.** Direct list of equipment with calculated percentages. |

### B. Body Tab (`apps/mobile/app/(tabs)/body.tsx`)

| Action / Data | Real Backend Endpoint | Real Response Shape | Stitch Screen Expected Shape | Compatibility & Adapter Plan |
|---|---|---|---|---|
| **Weight History** | `GET /body/weight` | `{ history: { history: Array<{ id, weight_kg, logged_at, moving_avg_kg }>, currentWeight, startingWeight, goal }, goal }` | Current weight, delta vs 30d, 7-day moving avg line, goal weight reference line | **Compatible with adapter.** Client unwraps `res.data.history.history` for chart points and reads `currentWeight`, `startingWeight`, and `goal.goal_weight_kg`. |
| **Log Weight** | `POST /body/weight` | Request: `{ weight_kg: number }`<br>Response: `BodyWeightLog` | Number input modal submitting weight in kg | **Exact 1-to-1 match.** |
| **Log Measurement** | `POST /body/measurement` | Request: `{ chest_cm?: number, waist_cm?: number, left_arm_cm?: number, ... }`<br>Response: `BodyMeasurement` | Modal input for Chest, Arms, Waist, Thighs | **Exact 1-to-1 match.** Pass `{ chest_cm, left_arm_cm, waist_cm, left_thigh_cm }`. |

### C. Dashboard Sessions (`apps/mobile/app/(tabs)/index.tsx`)

| Action / Data | Real Backend Endpoint | Real Response Shape | Stitch Screen Expected Shape | Compatibility & Adapter Plan |
|---|---|---|---|---|
| **Recent Sessions** | `GET /sessions` | `Array<{ id, started_at, finished_at, duration_seconds, notes, exerciseSets: Array<{ weight_kg, reps }> }>` | Recent workout cards with date, duration in minutes, and total volume (kg) | **Compatible with adapter.** Total volume is calculated as `session.exerciseSets.reduce((sum, s) => sum + (s.weight_kg * s.reps), 0)`. |
