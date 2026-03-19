import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Session } from '@supabase/supabase-js'
import { View, ActivityIndicator } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { colors } from '@/constants/colors'
import { supabase } from '@/lib/supabase'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
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

  // session is intentionally unused for now (routing happens in app/index.tsx)
  void session

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(manager)" />
        <Stack.Screen name="(driver)" />
      </Stack>
    </GestureHandlerRootView>
  )
}

