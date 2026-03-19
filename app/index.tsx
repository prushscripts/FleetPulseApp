import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'

export default function Index() {
  const [route, setRoute] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setRoute('/(auth)/login')
        return
      }
      const role = session.user.user_metadata?.role
      if (role === 'driver') {
        setRoute('/(driver)')
      } else {
        setRoute('/(manager)')
      }
    })
  }, [])

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

  return <Redirect href={route as any} />
}

