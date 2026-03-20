# Phases 1–5 — Implementation status

All five phase specs in this folder are now implemented in the parent **FleetPulseApp** Expo project.

| Phase | Scope | Key files |
| ----- | ----- | --------- |
| **1** | Expo project, Supabase client, design tokens, UI primitives, routing | `lib/supabase.ts`, `constants/colors.ts`, `constants/theme.ts`, `components/ui/*`, `app/_layout.tsx`, `app/index.tsx`, `MOBILE_SETUP_GUIDE.md` |
| **2** | Login (particles, role routing), manager **tabs**: Home · Health · Vehicles · Drivers · Inspections | `app/(auth)/login.tsx`, `app/(manager)/_layout.tsx`, `app/(manager)/index.tsx` |
| **3** | Vehicles list (search, territory, sort, oil borders) + vehicle detail tabs | `app/(manager)/vehicles/*` |
| **4** | Driver home (vehicle, announcements, recent inspections, report issue), full pre-trip inspection flow | `app/(driver)/index.tsx`, `app/(driver)/inspection/[type].tsx`, `lib/driver-vehicle.ts`, `lib/inspection-items.ts` |
| **5** | Push token registration (manager home), notification tap routing, `eas.json`, App Store draft, SQL for `push_token` | `hooks/usePushRegistration.ts`, `app/_layout.tsx`, `eas.json`, `APP_STORE_LISTING.md`, `add-push-token.sql` |

## Required env

- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — same as web.
- `EXPO_PUBLIC_WEB_URL` — deployed Next.js FleetPulse base URL (no trailing slash), for:
  - `POST /api/driver-report-issue` with `Authorization: Bearer <access_token>`
  - `POST /api/notifications/create` after failed inspections (no auth on route today)

## Web change

- `app/api/driver-report-issue/route.ts` now accepts **Bearer** tokens from the mobile app (cookie session still works for web).

## Run on iPhone

```bash
cd FleetPulseApp
npm install
# copy .env.example → .env and fill values
npx expo start
```

Scan the QR code with **Expo Go**.
