# FleetPulse Mobile — Phase 4: Driver Portal

═══════════════════════════════════════════════════════
DRIVER LAYOUT — app/(driver)/_layout.tsx
═══════════════════════════════════════════════════════

Simple stack navigator, no tab bar.
Background: #0A0F1E

import { Stack } from 'expo-router'

export default function DriverLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#0A0F1E' },
      animation: 'slide_from_right',
    }} />
  )
}

═══════════════════════════════════════════════════════
DRIVER HOME — app/(driver)/index.tsx
═══════════════════════════════════════════════════════

On load, fetch:
1. Current user profile (nickname, company_id)
2. Driver record by user_id OR email
3. Assigned vehicle via assigned_vehicle_id
4. Active announcements for company
5. Recent inspections by this driver (last 5)

Use the same 4-method vehicle lookup as web:
Method 1: drivers.user_id = auth.uid()
Method 2: drivers.email = user.email
Method 3: vehicles.assigned_driver_id = auth.uid()
Method 4: profile company_id + email match

Layout (ScrollView):

HEADER:
"Hey {nickname} 👋" (large, white, bold)
"{weekday}, {date}" (small, slate-400)
Sign out button (top right, small)

ASSIGNED VEHICLE CARD (Card component):
Truck icon (blue)
Truck number (large, font-mono)
Year Make Model
Location badge

Stats row:
Mileage | Oil Status

If oil overdue: amber warning text
"Oil change overdue by {X} miles"

If no vehicle assigned:
Show amber warning card:
"No vehicle assigned"
"Contact your fleet manager"

INSPECTION BUTTON (large, prominent):
[ 🚛 Start Pre-Trip Inspection ]
Full width, blue, height 64, rounded-2xl
Only show if vehicle is assigned

REPORT ISSUE BUTTON:
[ ⚠ Report an Issue ]
Ghost style, full width, below inspection button

Tapping Report Issue opens a bottom sheet modal:
- Title input (required)
- Details textarea (optional)  
- Priority selector: Low | Medium | High
- Submit button
On submit: POST to /api/driver-report-issue
Show success toast then close sheet

ANNOUNCEMENTS SECTION:
"Announcements" heading
If none: "No active announcements" (muted)
Each announcement:
- Title (white, bold)
- Body (slate-400, smaller)
- Date (slate-600, tiny)

RECENT CHECK-INS:
"Recent Inspections" heading
Last 5 inspections submitted by this driver
Each row: date, status badge (Passed/Failed), truck number

═══════════════════════════════════════════════════════
INSPECTION FLOW — app/(driver)/inspection/[type].tsx
═══════════════════════════════════════════════════════

Always runs pre_trip regardless of [type] param.

Same 5-phase flow as web app:

PHASES: 'vehicle' | 'odometer' | 
        'checklist' | 'summary' | 'success'

CHECKLIST ITEMS (same as web — no under hood):
Exterior (6 items):
- Headlights & taillights working
- Turn signals & hazards working  
- Tires — no visible damage or low pressure
- No new body damage
- Mirrors clean and properly adjusted
- Windshield — no cracks or obstructions

Interior (6 items):
- Brakes feel normal
- Steering feels normal
- Horn works
- Seatbelt works
- No warning lights on dashboard
- Wipers working

PHASE: vehicle
Full screen centered:
"PRE-TRIP INSPECTION" label (mono, small, slate-500)
"Vehicle Check" title
Date

Vehicle card showing truck info + mileage + oil status
Inspector name with avatar

"Begin Inspection →" button (large, blue, full width)
Disabled if no vehicle assigned

PHASE: odometer
Back button
"STEP 1 OF 3" progress label
"Current Odometer" title
Large number input (inputMode numeric, centered)
"Continue →" button (disabled if empty)

PHASE: checklist
Progress bar at top (animated)
"CATEGORY X of 2" label
Category name as heading
Animated slide between categories (left/right)

Each item card:
Item label (base size, readable)
[ ✓ Pass ] [ ✗ Fail ] — large buttons, side by side
Min height: 56px each
Green when pass selected, red when fail selected

If Fail selected:
Note textarea slides in below (required)
Cannot advance until note is filled
Red border on textarea

"Next Category" or "Review Summary" button
Disabled until all items answered + fail notes filled

Use Animated or react-native-reanimated for 
slide transitions between categories.
After advancing category, scroll to top automatically.

PHASE: summary
"SUMMARY" label
"Review & Submit" title

Pass/Fail count cards (2 columns)

Failed items list (if any):
Each showing label + driver's note

Overall notes textarea (optional)

"Submit Inspection" button (large, blue)
Loading spinner while submitting

On submit:
Insert into inspections table
If failed items: create issues (source: 'pre_trip')
Call /api/notifications/create if failures exist

PHASE: success
Animated checkmark (green circle if passed, amber if failed)
"All Clear!" or "Inspection Submitted"
Subtitle with pass/fail count
Timestamp (mono, small)
"Back to Dashboard" button

KEYBOARD HANDLING:
KeyboardAvoidingView wrapping form screens
behavior: 'padding' on iOS, 'height' on Android
After input blur, scroll position resets

BOTTOM SAFE AREA:
Add paddingBottom: insets.bottom + 16 to all screens
Use useSafeAreaInsets() hook