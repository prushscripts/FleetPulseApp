import { supabase } from '@/lib/supabase'

/** Resolves company_id: user_metadata → profiles.company_id */
export async function getCompanyId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const metaId = user.user_metadata?.company_id as string | null
  if (metaId) return metaId

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.company_id) return profile.company_id as string

  return null
}
