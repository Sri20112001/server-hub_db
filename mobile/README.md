# Server Hub — Android Mobile App

Native Android companion for the Server Hub web application.

## Stack

- React Native + Expo (SDK 52)
- TypeScript
- NativeWind (Tailwind CSS for React Native)
- Expo Router (file-based navigation)
- Axios + TanStack Query (server state)
- Zustand (auth + biometric client state)
- Expo SecureStore (JWT token storage)
- Expo Local Authentication (biometric lock)

## Design

Colors and typography are extracted directly from the web client's CSS tokens
(`client/src/index.css`). The app uses the **Cyberdeck Night** dark theme by
default, matching the web app's dark mode.

## Setup

```bash
cd mobile
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL to your Server Hub backend
npm install
npx expo start
```

## Authentication

The backend returns a JWT on login (`/server-hub/api/auth/login`). The token is
stored in Expo SecureStore and sent as `Authorization: Bearer <token>` on every
request. The backend already supports this header fallback alongside cookies.

Token expiry is 24h. On 401, the user is redirected to the login screen.

## Push notifications

After login the app asks for notification permission (once) and registers its
Expo push token with the backend (`POST /server-hub/api/push-tokens`,
refreshed on every launch; removed on logout). Alert firings, threshold
crossings, and deploy/backup failures then arrive as system pushes — tapping
one opens the in-app notification center. Foreground pushes render as a
banner with sound (`app/_layout.tsx`).

Requirements and limits:

- Physical device only — simulators/emulators silently skip registration.
- Production builds need an EAS project ID in `app.json`
  (`expo.extra.eas.projectId`); without it token fetch fails and the app
  carries on without push.
- Push delivery follows the backend notification settings
  (`notify_enabled` master switch + per-event toggles); the push channel
  itself defaults to on and can be switched off server-side.
- `EXPO_PUBLIC_*` values are baked into the bundle — never put secrets there
  (the push token is per-device and registered at runtime, not build time).

## Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout (QueryClient, fonts, auth hydration)
│   ├── index.tsx            # Splash redirect
│   ├── (auth)/
│   │   └── login.tsx
│   └── (app)/
│       ├── _layout.tsx      # Bottom tab navigation
│       ├── index.tsx        # Dashboard
│       ├── fleet/index.tsx  # All ships with search + filter
│       ├── projects/
│       │   ├── index.tsx    # Project list
│       │   └── [id].tsx     # Project detail + actions
│       ├── deployments/index.tsx
│       ├── logs/index.tsx
│       └── settings/index.tsx
├── src/
│   ├── api/                 # Axios modules (client, auth, dashboard, projects, logs)
│   ├── components/          # Reusable UI components
│   ├── stores/              # Zustand stores (auth, biometric)
│   ├── theme/               # Color tokens from web app
│   ├── types/               # TypeScript types mirrored from web client
│   └── utils/               # Format utilities
```

## Backend API

All endpoints are consumed from the existing Server Hub backend. No new
endpoints were added. The mobile app uses:

- `POST /server-hub/api/auth/login`
- `GET  /server-hub/api/auth/me`
- `POST /server-hub/api/auth/logout`
- `PUT  /server-hub/api/auth/password`
- `GET  /server-hub/api/dashboard`
- `GET  /server-hub/api/projects`
- `GET  /server-hub/api/projects/:id`
- `GET  /server-hub/api/projects/:id/services`
- `GET  /server-hub/api/projects/:id/deployments`
- `POST /server-hub/api/projects/:id/start|stop|restart`
- `GET  /server-hub/api/logs`

## Android Build

```bash
# Development APK
npx eas build --platform android --profile development

# Production AAB
npx eas build --platform android --profile production
```
