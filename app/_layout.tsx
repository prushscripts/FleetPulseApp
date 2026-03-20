import { useEffect, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Session } from '@supabase/supabase-js'
import { View, ActivityIndicator } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { colors } from '@/constants/colors'
import { supabase } from '@/lib/supabase'

const IS_EXPO_GO = Constants.appOwnership === 'expo'

function NotificationRouting() {
  const router = useRouter()
  useEffect(() => {
    if (IS_EXPO_GO || !Device.isDevice) return

    let cancelled = false
    let subscription: { remove: () => void } | undefined

    void import('expo-notifications').then((Notifications) => {
      if (cancelled) return

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      })

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as { type?: string } | undefined
        if (data?.type === 'inspection_failed') {
          router.push('/(manager)/inspections')
        }
      })
    })

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [router])
  return null
}

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

  void session

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <NotificationRouting />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(manager)" />
        <Stack.Screen name="(driver)" />
      </Stack>
    </GestureHandlerRootView>
  )
}
