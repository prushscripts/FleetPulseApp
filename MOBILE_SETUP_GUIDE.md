# FleetPulse Mobile — Setup Guide

## Prerequisites
- Node.js v18+ (nodejs.org)
- Expo Go on iPhone (App Store) / Android (Play Store)
- Expo account (expo.dev — free)
- Apple Developer account ($99/year) for App Store (later)
- Google Play account ($25 one-time) for Play Store (later)

## Step 1 — Install CLI tools
```bash
npm install -g expo-cli
npm install -g eas-cli
```

## Step 2 — Open the project
```bash
cd "c:\Users\James\Desktop\FleetPulseApp"
npm install
```

## Step 3 — Environment variables
Create `.env` in the `FleetPulseApp` root (see `.env.example`):
```bash
EXPO_PUBLIC_SUPABASE_URL=same_as_web_app
EXPO_PUBLIC_SUPABASE_ANON_KEY=same_as_web_app
EXPO_PUBLIC_WEB_URL=https://your-nextjs-fleetpulse-url.vercel.app
```

Use the **same Supabase project** as your web app (copy from your web app’s `.env.local`).

`EXPO_PUBLIC_WEB_URL` must be the live **FleetPulse Next.js** URL so the mobile app can call `/api/driver-report-issue` (with your session token) and `/api/notifications/create` after failed inspections.

## Step 3b — Push notifications (optional)
Run `add-push-token.sql` (project root) in the Supabase SQL editor to add `profiles.push_token`, then rebuild the app after granting notification permission on device.

## Step 4 — Run on your phone

**Same Wi‑Fi as your PC (simplest — no tunnel):**
```bash
cd FleetPulseApp
npx expo start
```
Then press `s` to switch connection, or run:
```bash
npm run start:lan
```
Scan the QR code with the Expo Go app.

**Tunnel** (different network / strict Wi‑Fi): `@expo/ngrok` is included as a **project** devDependency (`npm install`). Do **not** rely on a global install. Then:
```bash
npm run start:tunnel
```

If Metro env vars look wrong after editing `.env`, restart with a clean cache:
```bash
npx expo start --clear
```

## Step 5 — Login to Expo
```bash
eas login
```

## Step 6 — Configure EAS
```bash
eas build:configure
```

## Step 7 — Build for TestFlight
```bash
eas build --platform ios --profile preview
```

## Step 8 — Build for Play Store
```bash
eas build --platform android --profile preview
```

## Step 9 — Submit to App Store
```bash
eas submit --platform ios
```

## Troubleshooting
- Metro fails: `npx expo start --clear`
- Module not found: `npm install`
- Supabase fails: verify `.env` values match web app
- App won’t load on phone: ensure phone + computer are on the same Wi‑Fi

## Verify
After setup run:
```bash
npx expo start
```
You should see a loading spinner then redirect to the login screen.

