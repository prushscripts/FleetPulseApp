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
Create `.env` in the `FleetPulseApp` root:
```bash
EXPO_PUBLIC_SUPABASE_URL=same_as_web_app
EXPO_PUBLIC_SUPABASE_ANON_KEY=same_as_web_app
```

Use the **same Supabase project** as your web app (copy from your web app’s `.env.local`).

## Step 4 — Run on your phone
```bash
npx expo start
```
Scan the QR code with the Expo Go app.

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

