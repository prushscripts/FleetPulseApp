import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import Skeleton from '@/components/ui/Skeleton'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/ui/AppHeader'
import { getCompanyId } from '@/lib/getCompanyId'

type VehicleRow = {
  id: string
  code: string | null
  vehicle_type: string | null
  location: string | null
  status: string | null
  current_mileage: number | null
  oil_change_due_mileage: number | null
  driver_id: string | null
  assigned_driver_id: string | null
}

type DriverMini = { id: string; first_name: string | null; last_name: string | null }

const OIL_SOON = 500

function territoryOf(loc: string | null): 'New York' | 'DMV' | 'Other' {
  const s = (loc ?? '').trim().toLowerCase()
  if (s.includes('new york') || s === 'ny') return 'New York'
  if (s.includes('dmv') || s.includes('virginia') || s.includes('dc') || s.includes('maryland'))
    return 'DMV'
  return 'Other'
}

export default function VehiclesIndex() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [territory, setTerritory] = useState<'all' | 'New York' | 'DMV' | 'Other'>('all')
  const [sort, setSort] = useState<'code' | 'mileage' | 'oil'>('code')
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])
  const [driversById, setDriversById] = useState<Record<string, DriverMini>>({})

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const companyId = user?.user_metadata?.company_id as string | undefined
    if (!companyId) {
      setVehicles([])
      setDriversById({})
      return
    }
    const { data: vData } = await supabase
      .from('vehicles')
      .select(
        'id, code, vehicle_type, location, status, current_mileage, oil_change_due_mileage, driver_id, assigned_driver_id',
      )
      .eq('company_id', companyId)

    const list = (vData as VehicleRow[]) ?? []
    setVehicles(list)

    const dids = new Set<string>()
    for (const v of list) {
      const d = v.assigned_driver_id || v.driver_id
      if (d) dids.add(d)
    }
    if (dids.size === 0) {
      setDriversById({})
      return
    }
    const { data: drows } = await supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .in('id', [...dids])
    const map: Record<string, DriverMini> = {}
    for (const d of (drows as DriverMini[]) ?? []) {
      map[d.id] = d
    }
    setDriversById(map)
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [load])

  const filtered = useMemo(() => {
    let rows = [...vehicles]
    const q = search.trim().toLowerCase()
    if (q) rows = rows.filter((v) => (v.code ?? '').toLowerCase().includes(q))
    if (territory !== 'all') {
      rows = rows.filter((v) => territoryOf(v.location) === territory)
    }
    rows.sort((a, b) => {
      if (sort === 'code') return (a.code ?? '').localeCompare(b.code ?? '')
      if (sort === 'mileage')
        return (b.current_mileage ?? 0) - (a.current_mileage ?? 0)
      const ao =
        (a.oil_change_due_mileage ?? 0) > 0 && (a.current_mileage ?? 0) >= (a.oil_change_due_mileage ?? 0)
          ? 1
          : 0
      const bo =
        (b.oil_change_due_mileage ?? 0) > 0 && (b.current_mileage ?? 0) >= (b.oil_change_due_mileage ?? 0)
          ? 1
          : 0
      return bo - ao
    })
    return rows
  }, [vehicles, search, territory, sort])

  const renderRow = ({ item: v }: { item: VehicleRow }) => {
    const cur = v.current_mileage ?? 0
    const due = v.oil_change_due_mileage ?? 0
    const overdueMi = due > 0 && cur >= due ? cur - due : 0
    const soonMi = due > 0 ? due - cur : 0
    const borderColor =
      overdueMi > 0 ? colors.danger : soonMi > 0 && soonMi <= OIL_SOON ? colors.warning : colors.success
    const driverId = v.assigned_driver_id || v.driver_id
    const dr = driverId ? driversById[driverId] : null
    const driverName = dr ? [dr.first_name, dr.last_name].filter(Boolean).join(' ') : null

    return (
      <Pressable
        onPress={() => router.push(`/(manager)/vehicles/${v.id}`)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.06)',
          borderLeftWidth: 3,
          borderLeftColor: borderColor,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>{v.code ?? '—'}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
            {(v.vehicle_type ?? '—') + ' · ' + (v.location ?? '—')}
          </Text>
          <Text
            style={{
              color: driverName ? colors.textSecondary : colors.textMuted,
              fontSize: 12,
              marginTop: 4,
              fontStyle: driverName ? 'normal' : 'italic',
            }}
          >
            {driverName ?? 'Unassigned'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.textPrimary, fontVariant: ['tabular-nums'] }}>
            {(cur || 0).toLocaleString()} mi
          </Text>
          <Text
            style={{
              color: overdueMi > 0 ? colors.danger : soonMi > 0 && soonMi <= OIL_SOON ? colors.warning : colors.success,
              fontSize: 11,
              marginTop: 4,
              fontWeight: '600',
            }}
          >
            {overdueMi > 0
              ? `+${(overdueMi / 1000).toFixed(1)}k overdue`
              : soonMi > 0 && soonMi <= OIL_SOON
                ? `Due in ${soonMi} mi`
                : 'Oil OK'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 8 }} />
      </Pressable>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Fleet Overview" subtitle={`${filtered.length} vehicles`} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 12,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: colors.borderDefault,
          }}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search truck #"
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, color: colors.textPrimary, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15 }}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {(['all', 'New York', 'DMV', 'Other'] as const).map((t) => {
            const active = territory === t
            return (
              <Pressable
                key={t}
                onPress={() => setTerritory(t)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  marginRight: 8,
                  backgroundColor: active ? colors.accent : 'rgba(255,255,255,0.06)',
                }}
              >
                <Text style={{ color: active ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  {t === 'all' ? 'All' : t}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {(
            [
              { key: 'code' as const, label: 'Truck #' },
              { key: 'mileage' as const, label: 'Mileage' },
              { key: 'oil' as const, label: 'Oil status' },
            ] as const
          ).map((s) => {
            const active = sort === s.key
            return (
              <Pressable
                key={s.key}
                onPress={() => setSort(s.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.borderDefault,
                }}
              >
                <Text style={{ color: active ? colors.accent : colors.textMuted, fontSize: 12 }}>{s.label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ padding: 16, gap: 10 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={56} borderRadius={12} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          renderItem={renderRow}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true)
                await load()
                setRefreshing(false)
              }}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="bus-outline" size={40} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 12 }}>No vehicles found</Text>
            </View>
          }
        />
      )}
    </View>
  )
}
