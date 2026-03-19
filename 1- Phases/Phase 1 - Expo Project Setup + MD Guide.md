# FleetPulse Mobile App — Phase 1: Project Setup

Create a complete Expo React Native app for FleetPulse
that connects to the existing Supabase backend.

IMPORTANT: Also create a file called 
MOBILE_SETUP_GUIDE.md in the FleetPulseApp project root 
with step-by-step instructions for setting up and 
running the Expo app from scratch.

IMPORTANT: Create this as a SEPARATE project folder 
on the Desktop called FleetPulseApp — NOT inside the 
existing FleetPulse web app folder.

═══════════════════════════════════════════════════════
PART 1: CREATE THE EXPO PROJECT
═══════════════════════════════════════════════════════

In the terminal, from the Desktop, run:

npx create-expo-app FleetPulseApp --template blank-typescript
cd FleetPulseApp

Then install all required dependencies:

# Navigation
npx expo install expo-router
npx expo install react-native-safe-area-context
npx expo install react-native-screens
npx expo install expo-linking
npx expo install expo-constants
npx expo install expo-status-bar

# Supabase
npm install @supabase/supabase-js
npx expo install expo-secure-store
npx expo install @react-native-async-storage/async-storage
npm install react-native-url-polyfill

# Styling
npm install nativewind
npm install --save-dev tailwindcss

# Animations
npm install react-native-reanimated
npm install react-native-gesture-handler
npx expo install expo-blur

# Icons
npm install @expo/vector-icons

# Camera (for inspection photos)
npx expo install expo-camera
npx expo install expo-image-picker

# Notifications
npx expo install expo-notifications
npx expo install expo-device

# Haptics
npx expo install expo-haptics

# Other
npx expo install expo-web-browser

═══════════════════════════════════════════════════════
PART 2: PROJECT STRUCTURE
═══════════════════════════════════════════════════════

Create this exact folder structure:

FleetPulseApp/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (manager)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── health.tsx
│   │   ├── vehicles/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── drivers/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   └── inspections/
│   │       ├── index.tsx
│   │       └── [id].tsx
│   └── (driver)/
│       ├── _layout.tsx
│       ├── index.tsx
│       └── inspection/
│           └── [type].tsx
├── components/
│   ├── ui/
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── StatusDot.tsx
│   │   └── Skeleton.tsx
│   ├── vehicles/
│   ├── drivers/
│   └── inspections/
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   └── types.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useVehicles.ts
│   ├── useDrivers.ts
│   └── useInspections.ts
├── constants/
│   ├── colors.ts
│   └── theme.ts
├── assets/
│   ├── images/
│   └── fonts/
├── app.json
├── tailwind.config.js
├── babel.config.js
└── MOBILE_SETUP_GUIDE.md

═══════════════════════════════════════════════════════
PART 3: SUPABASE CLIENT
═══════════════════════════════════════════════════════

Create lib/supabase.ts:

import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import 'react-native-url-polyfill/auto'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string) =>
    SecureStore.deleteItemAsync(key),
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey, 
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)

Create .env file in FleetPulseApp root:
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

NOTE: Copy these exact values from the web app's 
.env.local file — same Supabase project.

═══════════════════════════════════════════════════════
PART 4: DESIGN TOKENS
═══════════════════════════════════════════════════════

Create constants/colors.ts:

export const colors = {
  bgBase: '#0A0F1E',
  bgSurface: '#0F1629',
  bgElevated: '#151D35',
  borderDefault: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.16)',
  accent: '#3B82F6',
  accentGlow: 'rgba(59,130,246,0.15)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  navy950: '#040810',
  navy900: '#0A0F1E',
  navy800: '#0F1629',
  navy700: '#151D35',
  navy600: '#1E2A4A',
}

Create constants/theme.ts:

export const theme = {
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
  },
  borderRadius: {
    sm: 8, md: 12, lg: 16, xl: 20, full: 999
  },
  fontSize: {
    xs: 10, sm: 12, base: 14, md: 16, 
    lg: 18, xl: 24, xxl: 32
  },
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    glow: {
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 0,
    }
  }
}

═══════════════════════════════════════════════════════
PART 5: ROOT LAYOUT + AUTH ROUTING
═══════════════════════════════════════════════════════

Create app/_layout.tsx:

import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import { View, ActivityIndicator } from 'react-native'
import { colors } from '@/constants/colors'
import { GestureHandlerRootView } from 
  'react-native-gesture-handler'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = 
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
      })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.bgBase,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }

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

Create app/index.tsx:

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
      <View style={{
        flex: 1,
        backgroundColor: colors.bgBase,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }

  return <Redirect href={route as any} />
}

═══════════════════════════════════════════════════════
PART 6: BASE UI COMPONENTS
═══════════════════════════════════════════════════════

Create components/ui/Card.tsx:

import { View, ViewStyle } from 'react-native'
import { colors } from '@/constants/colors'

interface Props {
  children: React.ReactNode
  style?: ViewStyle
  variant?: 'default' | 'elevated' | 'glass'
}

export default function Card({ 
  children, style, variant = 'default' 
}: Props) {
  const styles = {
    default: {
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderWidth: 1,
      borderColor: colors.borderDefault,
      borderRadius: 16,
    },
    elevated: {
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.borderDefault,
      borderRadius: 16,
    },
    glass: {
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      borderRadius: 16,
    }
  }

  return (
    <View style={[styles[variant], style]}>
      {children}
    </View>
  )
}

Create components/ui/Button.tsx:

import { 
  TouchableOpacity, Text, ActivityIndicator,
  ViewStyle, TextStyle 
} from 'react-native'
import { colors } from '@/constants/colors'
import * as Haptics from 'expo-haptics'

interface Props {
  label: string
  onPress: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({
  label, onPress, variant = 'primary',
  loading, disabled, style, textStyle, size = 'md'
}: Props) {

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const baseStyle: ViewStyle = {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
    paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 24 : 16,
    opacity: disabled ? 0.5 : 1,
  }

  const variants = {
    primary: { backgroundColor: colors.accent },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.borderDefault,
    },
    danger: {
      backgroundColor: 'rgba(239,68,68,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.3)',
    }
  }

  const textColors = {
    primary: '#FFFFFF',
    ghost: colors.textSecondary,
    danger: colors.danger,
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[baseStyle, variants[variant], style]}
    >
      {loading
        ? <ActivityIndicator 
            color={textColors[variant]} size="small" />
        : <Text style={[{
            color: textColors[variant],
            fontSize: size === 'sm' ? 13 : 15,
            fontWeight: '600',
          }, textStyle]}>
            {label}
          </Text>
      }
    </TouchableOpacity>
  )
}

Create components/ui/Badge.tsx:

import { View, Text, ViewStyle } from 'react-native'

interface Props {
  label: string
  variant: 'success' | 'warning' | 'danger' | 
           'neutral' | 'info'
  style?: ViewStyle
}

export default function Badge({ label, variant, style }: Props) {
  const variants = {
    success: { bg: 'rgba(16,185,129,0.1)', 
               text: '#10B981' },
    warning: { bg: 'rgba(245,158,11,0.1)', 
               text: '#F59E0B' },
    danger:  { bg: 'rgba(239,68,68,0.1)',  
               text: '#EF4444' },
    neutral: { bg: 'rgba(100,116,139,0.1)', 
               text: '#94A3B8' },
    info:    { bg: 'rgba(59,130,246,0.1)', 
               text: '#3B82F6' },
  }

  return (
    <View style={[{
      backgroundColor: variants[variant].bg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    }, style]}>
      <Text style={{
        color: variants[variant].text,
        fontSize: 11,
        fontWeight: '600',
      }}>
        {label}
      </Text>
    </View>
  )
}

Create components/ui/Skeleton.tsx:

import { useEffect, useRef } from 'react'
import { Animated, ViewStyle } from 'react-native'

interface Props {
  width: number | string
  height: number
  borderRadius?: number
  style?: ViewStyle
}

export default function Skeleton({
  width, height, borderRadius = 6, style
}: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7, duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3, duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View style={[{
      width: width as any,
      height,
      borderRadius,
      backgroundColor: 'rgba(255,255,255,0.08)',
      opacity,
    }, style]} />
  )
}

═══════════════════════════════════════════════════════
PART 7: APP.JSON CONFIGURATION
═══════════════════════════════════════════════════════

Replace app.json with:

{
  "expo": {
    "name": "FleetPulse",
    "slug": "fleetpulse",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "fleetpulse",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A0F1E"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.fleetpulse.app",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": 
          "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0A0F1E"
      },
      "package": "com.fleetpulse.app",
      "versionCode": 1
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-camera",
        {
          "cameraPermission": "FleetPulse needs camera access for vehicle inspection photos."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#3B82F6"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}

═══════════════════════════════════════════════════════
PART 8: TAILWIND + BABEL CONFIG
═══════════════════════════════════════════════════════

Create tailwind.config.js:

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040810',
          900: '#0A0F1E',
          800: '#0F1629',
          700: '#151D35',
          600: '#1E2A4A',
        },
        accent: '#3B82F6',
      }
    }
  },
  plugins: [],
}

Update babel.config.js:

module.exports = function(api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      'react-native-reanimated/plugin',
    ],
  }
}

═══════════════════════════════════════════════════════
PART 9: MOBILE SETUP GUIDE (MD file)
═══════════════════════════════════════════════════════

Create MOBILE_SETUP_GUIDE.md with these sections:

# FleetPulse Mobile — Setup Guide

## Prerequisites
- Node.js v18+ (nodejs.org)
- Expo Go on iPhone (App Store)
- Expo account (expo.dev — free)
- Apple Developer account ($99/year) for App Store
- Google Play account ($25 one-time) for Play Store

## Step 1 — Install CLI tools
npm install -g expo-cli
npm install -g eas-cli

## Step 2 — Open the project
cd Desktop/FleetPulseApp
npm install

## Step 3 — Environment variables
Create .env in FleetPulseApp root:
EXPO_PUBLIC_SUPABASE_URL=same_as_web_app
EXPO_PUBLIC_SUPABASE_ANON_KEY=same_as_web_app

## Step 4 — Run on your phone
npx expo start
Scan QR code with Expo Go app on iPhone

## Step 5 — Login to Expo
eas login

## Step 6 — Configure EAS
eas build:configure

## Step 7 — Build for TestFlight
eas build --platform ios --profile preview

## Step 8 — Build for Play Store
eas build --platform android --profile preview

## Step 9 — Submit to App Store
eas submit --platform ios

## Troubleshooting
- Metro fails: npx expo start --clear
- Module not found: npm install
- Supabase fails: check .env values match web app
- App won't load on phone: same WiFi as computer

═══════════════════════════════════════════════════════
PART 10: VERIFY
═══════════════════════════════════════════════════════

After setup run:
npx expo start

Scan QR code with Expo Go on iPhone.
App should load showing a loading spinner 
then redirect to login screen.

If it works, Phase 1 is complete.
Report any errors before moving to Phase 2.