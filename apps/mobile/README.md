# IronLog Mobile Client

React Native + Expo mobile application for IronLog, built with Expo Router and the Obsidian Kinetic design system.

## Getting Started

1. Install dependencies from the monorepo root:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npm run start --workspace=mobile
   ```

3. Open the app:
   - Press `a` for Android Emulator
   - Press `i` for iOS Simulator
   - Scan the QR code with Expo Go on a physical device connected to the same LAN

## Architecture & Styling

- **Routing**: Expo Router file-based typed routing (`app/`)
- **Design System**: Obsidian Kinetic dark theme (`constants/tokens.ts`, `constants/theme.ts`)
- **State & Caching**: TanStack React Query (`@tanstack/react-query`) + Zustand (`store/useAuthStore.ts`)
- **API Client**: Axios client (`services/api.ts`) with dynamic LAN host resolution and automatic JWT refresh
- **Icons**: Phosphor Icons (`components/ui/Icon.tsx`)
