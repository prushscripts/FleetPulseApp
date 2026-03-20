import { getWebUrlFromEnv } from '@/lib/env'

/** Next.js FleetPulse deployment URL (no trailing slash), e.g. https://your-app.vercel.app */
export function getWebBaseUrl(): string {
  return getWebUrlFromEnv().replace(/\/$/, '')
}
