import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '@/components/ui/AppHeader'

type VehicleHealth = {
  id: string
  code: string | null
  current_mileage: number | null
  oil_change_due_mileage: number | null
  status: string | null
}

type Issue = { vehicle_id: string; priority: string; status: string }
type Inspection = { vehicle_id: string; status: string; submitted_at: string }

export default function HealthScreen() {
  const [vehicles, setVehicles] = useState<VehicleHealth[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setVehicles([])
      setIssues([])
      setInspections([])
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
      setVehicles([])
      setIssues([])
      setInspections([])
      setLoading(false)
      setRefreshing(false)
      return
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [vRes, iRes, insRes] = await Promise.all([
      supabase
        .from('vehicles')
        .select('id, code, current_mileage, oil_change_due_mileage, status')
        .eq('company_id', cid),
      supabase
        .from('issues')
        .select('vehicle_id, priority, status')
        .eq('company_id', cid)
        .neq('status', 'resolved'),
      supabase
        .from('inspections')
        .select('vehicle_id, status, submitted_at')
        .eq('company_id', cid)
        .gte('submitted_at', thirtyDaysAgo.toISOString()),
    ])

    setVehicles((vRes.data as VehicleHealth[]) ?? [])
    setIssues((iRes.data as Issue[]) ?? [])
    setInspections((insRes.data as Inspection[]) ?? [])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const total = vehicles.length
  const overdue = vehicles.filter(
    (v) => (v.current_mileage ?? 0) >= (v.oil_change_due_mileage ?? Infinity),
  ).length
  const dueSoon = vehicles.filter((v) => {
    const remaining = (v.oil_change_due_mileage ?? 0) - (v.current_mileage ?? 0)
    return remaining > 0 && remaining <= 500
  }).length
  const oilOk = total - overdue - dueSoon

  const totalIssues = issues.length
  const criticalIssues = issues.filter((i) => i.priority === 'critical').length
  const highIssues = issues.filter((i) => i.priority === 'high').length

  const passedInsp = inspections.filter((i) => i.status === 'passed').length
  const failedInsp = inspections.filter((i) => i.status === 'failed').length
  const totalInsp = passedInsp + failedInsp
  const passRate = totalInsp > 0 ? Math.round((passedInsp / totalInsp) * 100) : 0

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          (overdue / Math.max(total, 1)) * 40 -
          (totalIssues / Math.max(total, 1)) * 30 -
          (failedInsp / Math.max(totalInsp, 1)) * 30,
      ),
    ),
  )

  const scoreColor =
    score >= 80 ? colors.success : score >= 60 ? colors.accent : score >= 40 ? colors.warning : colors.danger
  const scoreLabel =
    score >= 80
      ? 'Excellent'
      : score >= 60
        ? 'Good'
        : score >= 40
          ? 'Needs Attention'
          : 'Critical'

  const oilPct = total > 0 ? Math.round((oilOk / total) * 100) : 0

  const attentionVehicles = vehicles
    .filter((v) => (v.current_mileage ?? 0) >= (v.oil_change_due_mileage ?? Infinity))
    .map((v) => ({
      id: v.id,
      code: v.code ?? '—',
      overdueMiles: (v.current_mileage ?? 0) - (v.oil_change_due_mileage ?? 0),
      issueCount: issues.filter((i) => i.vehicle_id === v.id).length,
    }))
    .sort((a, b) => b.overdueMiles - a.overdueMiles)
    .slice(0, 8)

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
      <AppHeader title="Fleet Health" subtitle="Real-time overview" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 100 }}
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
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.card, { marginBottom: 16 }]}>
          <Text style={s.cardLabel}>Overall Fleet Health Score</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
            <Text style={[s.scoreNumber, { color: scoreColor }]}>{score}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 20, marginBottom: 8 }}>/100</Text>
          </View>
          <View style={[s.scoreBadge, { backgroundColor: `${scoreColor}18`, borderColor: `${scoreColor}40` }]}>
            <Text style={[s.scoreBadgeText, { color: scoreColor }]}>{scoreLabel}</Text>
          </View>

          <View style={{ marginTop: 16, gap: 10 }}>
            {[
              { label: 'Oil compliance', value: oilPct, color: colors.success },
              {
                label: 'Issue-free vehicles',
                value: total > 0 ? Math.round(((total - attentionVehicles.length) / total) * 100) : 100,
                color: colors.accent,
              },
              { label: 'Inspection pass rate', value: passRate, color: '#8B5CF6' },
            ].map((bar) => (
              <View key={bar.label}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{bar.label}</Text>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{bar.value}%</Text>
                </View>
                <View style={s.barTrack}>
                  <View
                    style={[
                      s.barFill,
                      {
                        width: `${Math.min(100, Math.max(0, bar.value))}%`,
                        backgroundColor: bar.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={[s.miniCard, { flex: 1 }]}>
            <Ionicons name="water-outline" size={18} color={colors.warning} style={{ marginBottom: 8 }} />
            <Text style={s.miniCardLabel}>Oil Change</Text>
            <Text style={[s.miniCardValue, { color: colors.success }]}>{oilOk}</Text>
            <Text style={s.miniCardSub}>OK</Text>
            <Text style={[s.miniCardValue, { color: colors.warning, marginTop: 4 }]}>{dueSoon}</Text>
            <Text style={s.miniCardSub}>Due Soon</Text>
            <Text style={[s.miniCardValue, { color: colors.danger, marginTop: 4 }]}>{overdue}</Text>
            <Text style={s.miniCardSub}>Overdue</Text>
          </View>
          <View style={[s.miniCard, { flex: 1 }]}>
            <Ionicons name="warning-outline" size={18} color={colors.danger} style={{ marginBottom: 8 }} />
            <Text style={s.miniCardLabel}>Open Issues</Text>
            <Text style={[s.miniCardValue, { color: colors.danger }]}>{criticalIssues}</Text>
            <Text style={s.miniCardSub}>Critical</Text>
            <Text style={[s.miniCardValue, { color: colors.warning, marginTop: 4 }]}>{highIssues}</Text>
            <Text style={s.miniCardSub}>High</Text>
            <Text style={[s.miniCardValue, { color: colors.accent, marginTop: 4 }]}>
              {totalIssues - criticalIssues - highIssues}
            </Text>
            <Text style={s.miniCardSub}>Medium/Low</Text>
          </View>
          <View style={[s.miniCard, { flex: 1 }]}>
            <Ionicons name="clipboard-outline" size={18} color={colors.accent} style={{ marginBottom: 8 }} />
            <Text style={s.miniCardLabel}>Inspections</Text>
            <Text style={[s.miniCardValue, { color: scoreColor }]}>{passRate}%</Text>
            <Text style={s.miniCardSub}>Pass Rate</Text>
            <Text style={[s.miniCardValue, { color: colors.success, marginTop: 4 }]}>{passedInsp}</Text>
            <Text style={s.miniCardSub}>Passed</Text>
            <Text style={[s.miniCardValue, { color: colors.danger, marginTop: 4 }]}>{failedInsp}</Text>
            <Text style={s.miniCardSub}>Failed</Text>
          </View>
        </View>

        {attentionVehicles.length > 0 ? (
          <View style={s.card}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons name="warning-outline" size={14} color={colors.warning} />
                <Text style={s.cardTitle}>Vehicles Needing Attention</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  router.push('/(manager)/vehicles' as any)
                }}
              >
                <Text style={{ color: colors.accent, fontSize: 12 }}>View all →</Text>
              </TouchableOpacity>
            </View>
            {attentionVehicles.map((v, i) => (
              <TouchableOpacity
                key={v.id}
                onPress={() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  router.push(`/(manager)/vehicles/${v.id}` as any)
                }}
                style={[
                  s.attentionRow,
                  i < attentionVehicles.length - 1
                    ? { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }
                    : undefined,
                ]}
              >
                <View
                  style={[
                    s.attentionBar,
                    { backgroundColor: v.overdueMiles > 100000 ? colors.danger : colors.warning },
                  ]}
                />
                <View style={{ width: 52 }}>
                  <Text style={s.attentionCode}>{v.code}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '600' }}>
                    +{v.overdueMiles.toLocaleString()} mi overdue
                  </Text>
                  {v.issueCount > 0 ? (
                    <Text style={{ color: colors.warning, fontSize: 11, marginTop: 1 }}>
                      {v.issueCount} open issue{v.issueCount > 1 ? 's' : ''}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: 18,
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardTitle: { color: 'white', fontSize: 13, fontWeight: '700' },
  scoreNumber: { fontSize: 72, fontWeight: '800', fontVariant: ['tabular-nums'], lineHeight: 76 },
  scoreBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  scoreBadgeText: { fontSize: 12, fontWeight: '700' },
  barTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  miniCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 14,
  },
  miniCardLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  miniCardValue: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  miniCardSub: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  attentionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  attentionBar: { width: 3, height: 36, borderRadius: 2 },
  attentionCode: { color: 'white', fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
})
