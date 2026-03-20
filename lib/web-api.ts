import { supabase } from '@/lib/supabase'
import { getWebBaseUrl } from '@/lib/config'

export async function fetchWebWithAuth(path: string, init: RequestInit = {}) {
  const base = getWebBaseUrl()
  if (!base) {
    throw new Error('Set EXPO_PUBLIC_WEB_URL in .env to your FleetPulse web app URL')
  }
  const { data: { session } } = await supabase.auth.getSession()
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  return fetch(`${base}${path}`, { ...init, headers })
}

export async function postWebJson<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetchWebWithAuth(path, { method: 'POST', body: JSON.stringify(body) })
  const json = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || res.statusText || 'Request failed')
  }
  return json as T
}
