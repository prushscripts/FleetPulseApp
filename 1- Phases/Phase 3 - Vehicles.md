# FleetPulse Mobile — Phase 3: Vehicles

═══════════════════════════════════════════════════════
VEHICLES LIST — app/(manager)/vehicles/index.tsx
═══════════════════════════════════════════════════════

Fetch all vehicles for company_id from Supabase.
Include assigned driver in query:
select('*, assigned_driver:assigned_driver_id(
  first_name, last_name, user_id
)')

Use FlatList for performance (not ScrollView).

HEADER:
"Fleet Overview" title
"{count} vehicles · Professional Plan" subtitle
[ Import ] [ + Add Vehicle ] buttons top right

SEARCH BAR:
TextInput with search icon
Filters list in real-time by truck_number

FILTER TABS (horizontal ScrollView):
All | New York | DMV | Other
Pill buttons, active = blue bg

SORT OPTIONS:
Simple dropdown or segmented: Truck # | Mileage | Oil Status

EACH VEHICLE ROW:
Left colored border:
- Red: oil overdue (mileage > oil_change_due)
- Amber: oil due soon (within 500 miles)
- Green: oil OK

Row content:
- Truck number (font-mono, bold, 16px, white)
- Type pill + location (small, slate-400)
- Assigned driver name OR "Unassigned" (italic, muted)
- Mileage (right aligned, font-mono)
- Oil badge: red "Oil +Xk mi" or green "Oil OK"

Tap row → navigate to vehicles/{vehicle.id}

EMPTY STATE:
Truck icon + "No vehicles found"

SKELETON:
8 rows of skeleton while loading

═══════════════════════════════════════════════════════
VEHICLE DETAIL — app/(manager)/vehicles/[id].tsx
═══════════════════════════════════════════════════════

Fetch vehicle by id with:
- assigned driver
- open issues count
- recent service records

HEADER (back button + edit button):
← Back to Vehicles          Edit

VEHICLE HERO CARD:
Truck icon (blue bg)
Truck number (large, font-mono, bold)
Type + oil status badge
Year Make Model · Location

STATS ROW (3 columns):
Mileage | Oil Due | Open Issues
font-mono numbers, colored

TAB BAR (horizontal scroll):
Overview | Service | Issues | Driver | Docs

OVERVIEW TAB:
Details grid:
- Year, Make, Model, Type
- Location, Status, VIN (last 6), Plate

Quick actions:
[ Log Service ] [ Report Issue ]
[ Start Inspection ] [ Add Document ]

DRIVER TAB:
If assigned: show driver avatar + name + location
Unassign button
If unassigned: "Unassign" state + Assign button
Assign opens bottom sheet with searchable driver list
Filter drivers by vehicle.location automatically

SERVICE TAB:
List of service_records for this vehicle
Each row: type, date, mileage, cost
+ Log Service button at top

ISSUES TAB:
List of open issues
Each row: title, priority badge, date reported
Tap → could show detail (v2)