import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import AppHeader from '@/components/ui/AppHeader'
import { getCompanyId } from '@/lib/getCompanyId'

type Driver = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  location: string | null
  active: boolean
  assigned_vehicle_id: string | null
  vehicle_code?: string | null
  license_expiration?: string | null
}

export default function DriversScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [filtered, setFiltered] = useState<Driver[]>([])
  const [search, setSearch] = useState('')
  const [territory, setTerritory] = useState<'all' | 'New York' | 'DMV'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setDrivers([])
      setFiltered([])
      setLoading(false)
      setRefreshing(false)
      return
    }
    const cid = await getCompanyId()
    console.log('Company ID resolved:', cid)
    if (!cid) {
      setDrivers([])
      setFiltered([])
      setLoading(false)
      setRefreshing(false)
      return
    }

    const { data } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, email, phone, location, active, assigned_vehicle_id, license_expiration, vehicles(code)')
      .eq('company_id', cid)
      .order('first_name')

    const mapped = (data ?? []).map((d: Record<string, unknown>) => {
      const veh = d.vehicles as { code?: string | null } | { code?: string | null }[] | null | undefined
      const vehicle_code = Array.isArray(veh) ? veh[0]?.code ?? null : veh?.code ?? null
      return {
        ...d,
        vehicle_code,
      } as Driver
    })
    setDrivers(mapped)
    setFiltered(mapped)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    let list = drivers
    if (territory !== 'all') list = list.filter((d) => d.location === territory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (d) =>
          `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) ||
          (d.email ?? '').toLowerCase().includes(q) ||
          (d.vehicle_code ?? '').toLowerCase().includes(q),
      )
    }
    setFiltered(list)
  }, [search, territory, drivers])

  const getLicenseStatus = (exp: string | null | undefined) => {
    if (!exp) return 'none'
    const days = Math.floor((new Date(exp).getTime() - Date.now()) / 86400000)
    if (days < 0) return 'expired'
    if (days < 30) return 'expiring'
    return 'ok'
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <StatusBar barStyle="light-content" />

      <AppHeader title="Drivers" subtitle={`${filtered.length} drivers`} />

      <View style={s.toolbar}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search drivers or trucks..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, color: 'white', fontSize: 14 }}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['all', 'New York', 'DMV'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setTerritory(t)
              }}
              style={[s.filterPill, territory === t && s.filterPillActive]}
            >
              <Text style={[s.filterPillText, territory === t && s.filterPillTextActive]}>
                {t === 'all' ? 'All' : t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              void load()
            }}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 12 }}>No drivers found</Text>
          </View>
        }
        renderItem={({ item: driver }) => {
          const licenseStatus = getLicenseStatus(driver.license_expiration)
          const initials = `${driver.first_name[0]}${driver.last_name[0]}`
          return (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                router.push(`/(manager)/drivers/${driver.id}` as any)
              }}
              style={s.driverRow}
            >
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={s.driverName}>
                    {driver.first_name} {driver.last_name}
                  </Text>
                  {!driver.active ? (
                    <View style={s.inactiveBadge}>
                      <Text style={s.inactiveBadgeText}>Inactive</Text>
                    </View>
                  ) : null}
                  {licenseStatus === 'expired' ? (
                    <View
                      style={[
                        s.inactiveBadge,
                        { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' },
                      ]}
                    >
                      <Text style={[s.inactiveBadgeText, { color: colors.danger }]}>License Exp.</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={s.driverSub}>
                  {driver.vehicle_code ? `🚛 ${driver.vehicle_code}` : 'Unassigned'}
                  {driver.location ? `  ·  ${driver.location}` : ''}
                </Text>
                {driver.phone ? <Text style={s.driverPhone}>{driver.phone}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  toolbar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'transparent',
  },
  filterPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterPillText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  filterPillTextActive: { color: 'white' },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  driverName: { color: 'white', fontSize: 15, fontWeight: '600' },
  driverSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  driverPhone: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(100,116,139,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.2)',
  },
  inactiveBadgeText: { color: colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
})
