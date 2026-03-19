# FleetPulse Mobile — Phase 2: Auth + Manager Home

Phase 1 is complete and app loads in Expo Go.
Now build the login screen and manager home dashboard.

═══════════════════════════════════════════════════════
LOGIN SCREEN — app/(auth)/login.tsx
═══════════════════════════════════════════════════════

Full screen login matching web app aesthetic.
Dark background (#0A0F1E).

Layout (top to bottom, centered):
- FleetPulse logo text (large, font-bold, white)
- Small blue underline accent below logo
- "Welcome back" heading
- "Sign in to your fleet dashboard" subtitle
- Email input
- Password input with show/hide toggle
- Sign in button (full width, blue)
- "New to FleetPulse? Create an account" link
- Error message (red, below button if error)

Particle/star background:
Use a simple animated background with 20-30 small 
white dots randomly positioned, slowly pulsing opacity.
Use Animated API from React Native.

On submit:
const { error } = await supabase.auth.signInWithPassword({
  email, password
})
if (error) show error message
if success:
  const role = session.user.user_metadata?.role
  if role === 'driver' → router.replace('/(driver)')
  else → router.replace('/(manager)')

Show loading spinner inside button while signing in.
Add haptic feedback on button press.

Input styles:
{
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: 'white',
  padding: 16,
  fontSize: 15,
  marginBottom: 12,
}

Focus state: borderColor changes to rgba(59,130,246,0.6)

═══════════════════════════════════════════════════════
AUTH LAYOUT — app/(auth)/_layout.tsx
═══════════════════════════════════════════════════════

import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: '#0A0F1E' }
    }} />
  )
}

═══════════════════════════════════════════════════════
MANAGER TAB NAVIGATOR — app/(manager)/_layout.tsx
═══════════════════════════════════════════════════════

Bottom tab navigator with 5 tabs:
Home | Health | Vehicles | Drivers | Inspections

import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'

const tabs = [
  { name: 'index', title: 'Home', 
    icon: 'home', activeIcon: 'home' },
  { name: 'health', title: 'Health', 
    icon: 'pulse-outline', activeIcon: 'pulse' },
  { name: 'vehicles/index', title: 'Vehicles', 
    icon: 'car-outline', activeIcon: 'car' },
  { name: 'drivers/index', title: 'Drivers', 
    icon: 'people-outline', activeIcon: 'people' },
  { name: 'inspections/index', title: 'Inspections', 
    icon: 'clipboard-outline', activeIcon: 'clipboard' },
]

Tab bar style:
tabBarStyle: {
  backgroundColor: '#0A0F1E',
  borderTopColor: 'rgba(255,255,255,0.06)',
  borderTopWidth: 1,
  paddingBottom: 8,
  paddingTop: 8,
  height: 64,
}
tabBarActiveTintColor: colors.accent (#3B82F6)
tabBarInactiveTintColor: '#475569'

═══════════════════════════════════════════════════════
MANAGER HOME — app/(manager)/index.tsx
═══════════════════════════════════════════════════════

Fetch from Supabase on load:
1. Get current user + profile (company_id, nickname)
2. Get vehicles for company
3. Get open issues for company

Calculate:
- totalCount = vehicles.length
- activeCount = vehicles.filter(v => v.status === 'active')
- overdueCount = vehicles where mileage > oil_change_due
- inShopCount = vehicles where status === 'in_shop'

Layout (ScrollView with RefreshControl):

HEADER:
Time-based greeting: Good morning/afternoon/evening
"{nickname || 'Manager'}"
Subtitle: "Here's your fleet today"
Date: formatted nicely (Tuesday, March 18)

KPI CARDS (2x2 grid):
Each card: Card component, rounded-2xl, p-4
- Large number (font-mono, 32px, colored)
- Small label below (text-slate-500, 12px uppercase)

Cards:
[Total — white] [Active — emerald]
[Oil Due — amber] [In Shop — blue]

ALERTS SECTION:
Title: "Active Alerts" with warning icon
Show vehicles where mileage > oil_change_due
Max 5 rows. Each row:
- Left red border (2px)
- Truck number (font-mono, bold, white)
- "Oil overdue · {overdueMiles.toLocaleString()} mi"
- Tap → navigate to vehicles/{id}
If 0 alerts: show green checkmark + "All clear"

QUICK ACTIONS:
Three buttons in a row:
[ Add Vehicle ] [ Log Service ] [ Inspection ]
ghost style, small, with icons

Use Skeleton components while loading.
Pull to refresh reloads all data.