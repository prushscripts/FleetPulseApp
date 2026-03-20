import { useEffect, useRef } from 'react'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { supabase } from '@/lib/supabase'

const IS_EXPO_GO = Constants.appOwnership === 'expo'

/**
 * Request notification permission and store Expo push token on profiles.
 * Dynamic-imports `expo-notifications` so its import-time side effects never run in Expo Go.
 * Requires `push_token` column — see FleetPulseApp/supabase/add-push-token.sql
 */
export function useManagerPushRegistration(userId: string | undefined) {
  const done = useRef(false)

  useEffect(() => {
    if (IS_EXPO_GO || !Device.isDevice || !userId || done.current) {
      return
    }

    const registerForPush = async () => {
      try {
        const Notifications = await import('expo-notifications')

        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }

        if (finalStatus !== 'granted') return

        const token = (await Notifications.getExpoPushTokenAsync()).data
        await supabase.from('profiles').update({ push_token: token }).eq('id', userId)
        done.current = true
      } catch (e) {
        console.log('Push registration skipped:', e)
      }
    }

    void registerForPush()
  }, [userId])
}
