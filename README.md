# IronLog MVP

IronLog is an all-in-one fitness companion that consolidates workout planning, nutrition tracking, body metrics, and guided AI periodization into a single platform.

## Monorepo Structure

This project uses a monorepo setup:
- `/apps/mobile`: The React Native (Expo) frontend application.
- `/apps/api`: The Express.js backend API with Prisma ORM.

## Tech Stack
- **Mobile**: Expo, Expo Router, Zustand (State), WatermelonDB (Offline Database), NativeWind (Styling).
- **API**: Express.js, TypeScript, Prisma (PostgreSQL).
- **Services**: SQLite (local DB), Ollama (AI Features, local LLM). No Redis required.

## Getting Started

### API (Backend)
1. Navigate to `/apps/api`
2. Run `npm install`
3. Copy `.env.example` to `.env` and set your connection strings.
4. Run `npx prisma generate` and `npx prisma db push`
5. Start the server (configuration for dev script coming soon)

### Mobile (Frontend)
1. Navigate to `/apps/mobile`
2. Run `npm install`
3. Start the Expo bundler: `npx expo start`
