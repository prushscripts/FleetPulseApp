import Constants from 'expo-constants'

type PublicExtra = {
  EXPO_PUBLIC_SUPABASE_URL?: string
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string
  EXPO_PUBLIC_WEB_URL?: string
}

function extra(): PublicExtra {
  return (Constants.expoConfig?.extra ?? {}) as PublicExtra
}

/** Supabase URL — from Metro-inlined env or app.config.js `extra`. */
export function getSupabaseUrl(): string {
  const v =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL) ||
    extra().EXPO_PUBLIC_SUPABASE_URL ||
    ''
  return String(v).trim()
}

/** Supabase anon key — from Metro-inlined env or app.config.js `extra`. */
export function getSupabaseAnonKey(): string {
  const v =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
    extra().EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  return String(v).trim()
}

export function getWebUrlFromEnv(): string {
  const v =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_WEB_URL) ||
    extra().EXPO_PUBLIC_WEB_URL ||
    ''
  return String(v).trim()
}
