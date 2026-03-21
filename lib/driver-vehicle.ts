import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export type DriverVehicle = {
  id: string
  code: string | null
  year: number | null
  make: string | null
  model: string | null
  current_mileage: number | null
  company_id: string | null
  location?: string | null
  oil_change_due_mileage?: number | null
}

export type DriverVehicleLoad = {
  driverId: string | null
  vehicle: DriverVehicle | null
  companyId: string | null
  displayName: string
}

function toVehicle(v: Record<string, unknown> | null): DriverVehicle | null {
  if (!v || typeof v.id !== 'string') return null
  return {
    id: v.id,
    code: (v.code ?? null) as string | null,
    year: typeof v.year === 'number' ? v.year : null,
    make: (v.make ?? null) as string | null,
    model: (v.model ?? null) as string | null,
    current_mileage:
      typeof v.current_mileage === 'number' ? v.current_mileage : (v.mileage as number) ?? null,
    company_id: (v.company_id ?? null) as string | null,
    location: (v.location ?? null) as string | null,
    oil_change_due_mileage:
      typeof v.oil_change_due_mileage === 'number' ? v.oil_change_due_mileage : null,
  }
}

async function vehicleByDriverId(
  supabase: SupabaseClient,
  driverId: string,
  assignedVehicleId: string | null,
  vehicleSelect: string,
): Promise<DriverVehicle | null> {
  // Try direct assigned_vehicle_id first — fastest, most accurate
  if (assignedVehicleId) {
    const { data: v } = await supabase
      .from('vehicles')
      .select(vehicleSelect)
      .eq('id', assignedVehicleId)
      .maybeSingle()
    const result = toVehicle(v as Record<string, unknown> | null)
    if (result) return result
  }
  // Fallback: reverse lookup via vehicle FK columns
  const { data: v } = await supabase
    .from('vehicles')
    .select(vehicleSelect)
    .or(`driver_id.eq.${driverId},assigned_driver_id.eq.${driverId}`)
    .limit(1)
    .maybeSingle()
  return toVehicle(v as Record<string, unknown> | null)
}

/**
 * Same 4-method lookup as web driver inspection (user_id, email, vehicle FK, profile company).
 * Each method also tries assigned_vehicle_id before the reverse FK lookup.
 */
export async function loadDriverVehicleContext(
  supabase: SupabaseClient,
  user: User,
): Promise<DriverVehicleLoad> {
  const cid = (user.user_metadata?.company_id as string) || null
  const nickname = (user.user_metadata?.nickname as string | undefined) || ''
  const displayName = nickname.trim() || (user.email ? user.email.split('@')[0] : 'Driver')

  type DriverRow = { id: string; assigned_vehicle_id: string | null }
  let driver: DriverRow | null = null
  let vehicleRow: DriverVehicle | null = null

  const vehicleSelect =
    'id, code, year, make, model, current_mileage, company_id, location, oil_change_due_mileage'

  // METHOD 1: driver by user_id
  const { data: d1 } = await supabase
    .from('drivers')
    .select('id, assigned_vehicle_id')
    .eq('user_id', user.id)
    .maybeSingle()
  driver = (d1 as DriverRow | null) ?? null
  if (driver) {
    vehicleRow = await vehicleByDriverId(supabase, driver.id, driver.assigned_vehicle_id, vehicleSelect)
  }

  // METHOD 2: driver by email
  if (!driver?.id || !vehicleRow) {
    const { data: d2 } = await supabase
      .from('drivers')
      .select('id, assigned_vehicle_id')
      .eq('email', user.email ?? '')
      .limit(1)
      .maybeSingle()
    if (d2) driver = d2 as DriverRow
    if (driver && !vehicleRow) {
      vehicleRow = await vehicleByDriverId(supabase, driver.id, driver.assigned_vehicle_id, vehicleSelect)
    }
  }

  // METHOD 3: vehicle directly assigned to user auth id (fallback if driver row missing)
  if (!vehicleRow) {
    const { data: v } = await supabase
      .from('vehicles')
      .select(vehicleSelect)
      .or(`driver_id.eq.${user.id},assigned_driver_id.eq.${user.id}`)
      .limit(1)
      .maybeSingle()
    vehicleRow = toVehicle(v as Record<string, unknown> | null)
  }

  // METHOD 4: profile company_id + email
  let companyId = cid
  if (!driver) {
    const resolvedCid = companyId ?? null
    const profileCid = await (async () => {
      if (resolvedCid) return resolvedCid
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle()
      return (profile as { company_id?: string } | null)?.company_id ?? null
    })()

    if (profileCid) {
      companyId = profileCid
      const { data: d4 } = await supabase
        .from('drivers')
        .select('id, assigned_vehicle_id')
        .eq('company_id', profileCid)
        .eq('email', user.email ?? '')
        .maybeSingle()
      if (d4) driver = d4 as DriverRow
      if (driver && !vehicleRow) {
        vehicleRow = await vehicleByDriverId(supabase, driver.id, driver.assigned_vehicle_id, vehicleSelect)
      }
    }
  }

  if (!companyId && vehicleRow?.company_id) companyId = vehicleRow.company_id

  console.log('loadDriverVehicleContext result:', {
    driverId: driver?.id ?? null,
    vehicleCode: vehicleRow?.code ?? null,
    companyId,
  })

  return {
    driverId: driver?.id ?? null,
    vehicle: vehicleRow,
    companyId,
    displayName,
  }
}
