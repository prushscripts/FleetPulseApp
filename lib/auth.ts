import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  await supabase.auth.signOut()
  router.replace('/(auth)/login')
}
