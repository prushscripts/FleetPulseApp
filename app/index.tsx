import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import SplashScreen from '@/components/ui/SplashScreen'

export default function Index() {
  const [route, setRoute] = useState<string | null>(null)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session) {
        setRoute('/(auth)/login')
        return
      }
      let role = session.user.user_metadata?.role as string | undefined
      if (!role) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
        role = (p as { role?: string } | null)?.role ?? undefined
      }
      if (role === 'driver') setRoute('/(driver)')
      else setRoute('/(manager)')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  if (!route) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bgBase,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Redirect href={route as any} />
}
