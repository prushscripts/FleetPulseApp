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

/**
 * Same 4-method lookup as web driver inspection (user_id, email, vehicle FK, profile company).
 */
export async function loadDriverVehicleContext(
  supabase: SupabaseClient,
  user: User,
): Promise<DriverVehicleLoad> {
  const cid = (user.user_metadata?.company_id as string) || null
  const nickname = (user.user_metadata?.nickname as string | undefined) || ''
  const displayName = nickname.trim() || (user.email ? user.email.split('@')[0] : 'Driver')

  type DriverRow = { id: string }
  let driver: DriverRow | null = null
  let vehicleRow: DriverVehicle | null = null

  const vehicleSelect =
    'id, code, year, make, model, current_mileage, company_id, location, oil_change_due_mileage'

  let { data: d1 } = await supabase.from('drivers').select('id').eq('user_id', user.id).maybeSingle()
  driver = d1 as DriverRow | null
  if (driver) {
    const { data: v } = await supabase
      .from('vehicles')
      .select(vehicleSelect)
      .or(`driver_id.eq.${driver.id},assigned_driver_id.eq.${driver.id}`)
      .limit(1)
      .maybeSingle()
    vehicleRow = toVehicle(v as Record<string, unknown> | null)
  }

  if (!driver?.id || !vehicleRow) {
    const { data: d2 } = await supabase
      .from('drivers')
      .select('id')
      .eq('email', user.email ?? '')
      .limit(1)
      .maybeSingle()
    if (d2) driver = d2 as DriverRow
    if (driver && !vehicleRow) {
      const { data: v } = await supabase
        .from('vehicles')
        .select(vehicleSelect)
        .or(`driver_id.eq.${driver.id},assigned_driver_id.eq.${driver.id}`)
        .limit(1)
        .maybeSingle()
      vehicleRow = toVehicle(v as Record<string, unknown> | null)
    }
  }

  if (driver && !vehicleRow) {
    const { data: v } = await supabase
      .from('vehicles')
      .select(vehicleSelect)
      .or(`driver_id.eq.${driver.id},assigned_driver_id.eq.${driver.id}`)
      .limit(1)
      .maybeSingle()
    vehicleRow = toVehicle(v as Record<string, unknown> | null)
  }

  let companyId = cid
  if (!driver && companyId) {
    const { data: d4 } = await supabase
      .from('drivers')
      .select('id')
      .eq('company_id', companyId)
      .eq('email', user.email ?? '')
      .maybeSingle()
    if (d4) driver = d4 as DriverRow
    if (driver && !vehicleRow) {
      const { data: v } = await supabase
        .from('vehicles')
        .select(vehicleSelect)
        .or(`driver_id.eq.${driver.id},assigned_driver_id.eq.${driver.id}`)
        .limit(1)
        .maybeSingle()
      vehicleRow = toVehicle(v as Record<string, unknown> | null)
    }
  }

  if (!driver && !companyId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()
    const profileCompanyId = (profile as { company_id?: string } | null)?.company_id
    if (profileCompanyId) {
      companyId = profileCompanyId
      const { data: d4 } = await supabase
        .from('drivers')
        .select('id')
        .eq('company_id', profileCompanyId)
        .eq('email', user.email ?? '')
        .maybeSingle()
      if (d4) driver = d4 as DriverRow
      if (driver && !vehicleRow) {
        const { data: v } = await supabase
          .from('vehicles')
          .select(vehicleSelect)
          .or(`driver_id.eq.${driver.id},assigned_driver_id.eq.${driver.id}`)
          .limit(1)
          .maybeSingle()
        vehicleRow = toVehicle(v as Record<string, unknown> | null)
      }
    }
  }

  if (!companyId && vehicleRow?.company_id) companyId = vehicleRow.company_id

  return {
    driverId: driver?.id ?? null,
    vehicle: vehicleRow,
    companyId,
    displayName,
  }
}
