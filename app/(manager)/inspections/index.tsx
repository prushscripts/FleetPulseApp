import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import AppHeader from '@/components/ui/AppHeader'

type Inspection = {
  id: string
  type: string
  status: string
  submitted_at: string
  odometer: number | null
  vehicle_code?: string | null
  driver_name?: string | null
}

type Filter = 'all' | 'passed' | 'failed' | 'pre_trip' | 'post_trip'

export default function InspectionsScreen() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [filtered, setFiltered] = useState<Inspection[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, passRate: 0 })

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setInspections([])
      setFiltered([])
      setStats({ total: 0, passed: 0, failed: 0, passRate: 0 })
      setLoading(false)
      setRefreshing(false)
      return
    }
    let cid = user.user_metadata?.company_id as string | undefined
    if (!cid && user.id) {
      const { data: p } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle()
      cid = (p as { company_id?: string } | null)?.company_id ?? undefined
    }
    if (!cid) {
      setInspections([])
      setFiltered([])
      setStats({ total: 0, passed: 0, failed: 0, passRate: 0 })
      setLoading(false)
      setRefreshing(false)
      return
    }

    const { data } = await supabase
      .from('inspections')
      .select('id, type, status, submitted_at, odometer, vehicles(code), drivers(first_name, last_name)')
      .eq('company_id', cid)
      .order('submitted_at', { ascending: false })
      .limit(100)

    const mapped = (data ?? []).map((i: Record<string, unknown>) => {
      const veh = i.vehicles as { code?: string | null } | { code?: string | null }[] | null | undefined
      const vehicle_code = Array.isArray(veh) ? veh[0]?.code ?? null : veh?.code ?? null
      const dr = i.drivers as
        | { first_name?: string; last_name?: string }
        | { first_name?: string; last_name?: string }[]
        | null
        | undefined
      let driver_name: string | null = null
      if (Array.isArray(dr)) {
        const d0 = dr[0]
        driver_name = d0 ? `${d0.first_name ?? ''} ${d0.last_name ?? ''}`.trim() || null : null
      } else if (dr) {
        driver_name = `${dr.first_name ?? ''} ${dr.last_name ?? ''}`.trim() || null
      }
      return {
        id: i.id as string,
        type: i.type as string,
        status: i.status as string,
        submitted_at: i.submitted_at as string,
        odometer: i.odometer as number | null,
        vehicle_code,
        driver_name,
      }
    })

    setInspections(mapped)
    const total = mapped.length
    const passed = mapped.filter((x) => x.status === 'passed').length
    const failed = mapped.filter((x) => x.status === 'failed').length
    setStats({ total, passed, failed, passRate: total > 0 ? Math.round((passed / total) * 100) : 0 })
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    let list = inspections
    if (filter === 'passed') list = list.filter((i) => i.status === 'passed')
    else if (filter === 'failed') list = list.filter((i) => i.status === 'failed')
    else if (filter === 'pre_trip') list = list.filter((i) => i.type === 'pre_trip')
    else if (filter === 'post_trip') list = list.filter((i) => i.type === 'post_trip')
    setFiltered(list)
  }, [filter, inspections])

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'failed', label: 'Failed' },
    { id: 'passed', label: 'Passed' },
    { id: 'pre_trip', label: 'Pre-Trip' },
    { id: 'post_trip', label: 'Post-Trip' },
  ]

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

      <AppHeader title="Inspections" />

      <View style={s.header}>
        <View style={s.statsRow}>
          {[
            { label: 'Total', value: stats.total, color: 'white' },
            { label: 'Passed', value: stats.passed, color: colors.success },
            { label: 'Failed', value: stats.failed, color: colors.danger },
            {
              label: 'Pass Rate',
              value: `${stats.passRate}%`,
              color:
                stats.passRate >= 80 ? colors.success : stats.passRate >= 50 ? colors.warning : colors.danger,
            },
          ].map((stat, i) => (
            <View
              key={stat.label}
              style={[
                s.statCell,
                i < 3 ? { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' } : undefined,
              ]}
            >
              <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setFilter(f.id)
              }}
              style={[s.filterPill, filter === f.id && s.filterPillActive]}
            >
              <Text style={[s.filterPillText, filter === f.id && s.filterPillTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
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
            <Ionicons name="clipboard-outline" size={40} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 12 }}>No inspections found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.row}>
            <View
              style={[
                s.statusDot,
                {
                  backgroundColor:
                    item.status === 'passed'
                      ? colors.success
                      : item.status === 'failed'
                        ? colors.danger
                        : colors.warning,
                },
              ]}
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.vehicleCode}>{item.vehicle_code ?? '—'}</Text>
                <View style={[s.typeBadge]}>
                  <Text style={s.typeText}>{item.type === 'pre_trip' ? 'Pre-Trip' : 'Post-Trip'}</Text>
                </View>
              </View>
              <Text style={s.driverName}>{item.driver_name ?? 'Unknown driver'}</Text>
              <Text style={s.date}>
                {new Date(item.submitted_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                {item.odometer ? `  ·  ${item.odometer.toLocaleString()} mi` : ''}
              </Text>
            </View>
            <View
              style={[
                s.statusBadge,
                {
                  backgroundColor:
                    item.status === 'passed'
                      ? 'rgba(16,185,129,0.1)'
                      : item.status === 'failed'
                        ? 'rgba(239,68,68,0.1)'
                        : 'rgba(245,158,11,0.1)',
                  borderColor:
                    item.status === 'passed'
                      ? 'rgba(16,185,129,0.25)'
                      : item.status === 'failed'
                        ? 'rgba(239,68,68,0.25)'
                        : 'rgba(245,158,11,0.25)',
                },
              ]}
            >
              <Text
                style={[
                  s.statusText,
                  {
                    color:
                      item.status === 'passed'
                        ? colors.success
                        : item.status === 'failed'
                          ? colors.danger
                          : colors.warning,
                  },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    marginBottom: 14,
  },
  statCell: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  filterPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterPillText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  filterPillTextActive: { color: 'white' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  vehicleCode: { color: 'white', fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  driverName: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
})

