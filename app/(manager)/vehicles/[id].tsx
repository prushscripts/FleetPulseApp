import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'

type TabKey = 'overview' | 'service' | 'issues' | 'driver'

export default function VehicleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [vehicle, setVehicle] = useState<Record<string, unknown> | null>(null)
  const [driver, setDriver] = useState<{
    first_name: string | null
    last_name: string | null
    id: string
  } | null>(null)
  const [issues, setIssues] = useState<
    Array<{ id: string; title: string; priority: string; status: string; reported_date: string }>
  >([])
  const [services, setServices] = useState<
    Array<{ id: string; type: string; description: string | null; mileage_at_service: number | null; performed_at: string | null }>
  >([])

  const load = useCallback(async () => {
    if (!id) return
    const { data: v } = await supabase.from('vehicles').select('*').eq('id', id).maybeSingle()
    setVehicle(v as Record<string, unknown> | null)
    const vid = v as { assigned_driver_id?: string | null; driver_id?: string | null } | null
    const did = vid?.assigned_driver_id || vid?.driver_id
    if (did) {
      const { data: d } = await supabase
        .from('drivers')
        .select('id, first_name, last_name')
        .eq('id', did)
        .maybeSingle()
      setDriver(d as typeof driver)
    } else {
      setDriver(null)
    }
    const { data: iss } = await supabase
      .from('issues')
      .select('id, title, priority, status, reported_date')
      .eq('vehicle_id', id)
      .neq('status', 'resolved')
      .order('created_at', { ascending: false })
    setIssues((iss as typeof issues) ?? [])

    const { data: svc, error: svcErr } = await supabase
      .from('service_records')
      .select('id, type, description, mileage_at_service, performed_at')
      .eq('vehicle_id', id)
      .order('performed_at', { ascending: false })
      .limit(50)
    if (!svcErr) setServices((svc as typeof services) ?? [])
    else setServices([])
  }, [id])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [load])

  if (!vehicle && !loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase, paddingTop: insets.top + 40, paddingHorizontal: 20 }}>
        <Text style={{ color: colors.textPrimary }}>Vehicle not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.accent }}>← Back</Text>
        </Pressable>
      </View>
    )
  }

  const code = (vehicle?.code as string) ?? '—'
  const cur = (vehicle?.current_mileage as number) ?? 0
  const due = (vehicle?.oil_change_due_mileage as number) ?? 0
  const overdue = due > 0 && cur >= due ? cur - due : 0
  const ymm = [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(' ')

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, paddingTop: insets.top + 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
          <Text style={{ color: colors.accent, fontSize: 16 }}>Vehicles</Text>
        </Pressable>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={async () => {
              setLoading(true)
              await load()
              setLoading(false)
            }}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
      >
        <Card variant="glass" style={{ padding: 16, borderLeftWidth: 3, borderLeftColor: overdue > 0 ? colors.danger : colors.success }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: 'rgba(59,130,246,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="bus" size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>{code}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{ymm || '—'}</Text>
              {overdue > 0 ? (
                <Badge label="Oil overdue" variant="danger" style={{ alignSelf: 'flex-start', marginTop: 8 }} />
              ) : (
                <Badge label="Oil OK" variant="success" style={{ alignSelf: 'flex-start', marginTop: 8 }} />
              )}
            </View>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
          {[
            { k: 'overview' as TabKey, label: 'Overview' },
            { k: 'service' as TabKey, label: 'Service' },
            { k: 'issues' as TabKey, label: 'Issues' },
            { k: 'driver' as TabKey, label: 'Driver' },
          ].map((t) => (
            <Pressable
              key={t.k}
              onPress={() => setTab(t.k)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: tab === t.k ? 'rgba(59,130,246,0.2)' : 'transparent',
                borderWidth: 1,
                borderColor: tab === t.k ? colors.accent : colors.borderDefault,
              }}
            >
              <Text
                style={{
                  color: tab === t.k ? colors.accent : colors.textMuted,
                  fontSize: 11,
                  fontWeight: '600',
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'overview' && (
          <Card variant="glass" style={{ marginTop: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Mileage</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                  {cur.toLocaleString()}
                </Text>
              </View>
              <View>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Oil due</Text>
                <Text style={{ color: overdue > 0 ? colors.danger : colors.textPrimary, fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                  {due ? due.toLocaleString() : '—'}
                </Text>
              </View>
              <View>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Open issues</Text>
                <Text style={{ color: colors.warning, fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                  {issues.length}
                </Text>
              </View>
            </View>
            {[
              ['Type', String(vehicle?.vehicle_type ?? '—')],
              ['Location', String(vehicle?.location ?? '—')],
              ['Status', String(vehicle?.status ?? '—')],
              ['VIN', String(vehicle?.vin ?? '—')],
              ['Plate', String(vehicle?.license_plate ?? '—')],
            ].map(([k, val]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>{k}</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1, textAlign: 'right' }}>{val}</Text>
              </View>
            ))}
          </Card>
        )}

        {tab === 'service' && (
          <View style={{ marginTop: 16 }}>
            {services.length === 0 ? (
              <Text style={{ color: colors.textMuted }}>No service records yet.</Text>
            ) : (
              services.map((s) => (
                <Card key={s.id} variant="glass" style={{ padding: 12, marginBottom: 8 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{s.type}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                    {(s.mileage_at_service ?? 0).toLocaleString()} mi
                    {s.performed_at ? ` · ${new Date(s.performed_at).toLocaleDateString()}` : ''}
                  </Text>
                  {s.description ? (
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>{s.description}</Text>
                  ) : null}
                </Card>
              ))
            )}
          </View>
        )}

        {tab === 'issues' && (
          <View style={{ marginTop: 16 }}>
            {issues.length === 0 ? (
              <Text style={{ color: colors.textMuted }}>No open issues.</Text>
            ) : (
              issues.map((iss) => (
                <Card key={iss.id} variant="glass" style={{ padding: 12, marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600', flex: 1 }}>{iss.title}</Text>
                    <Badge
                      label={iss.priority}
                      variant={iss.priority === 'critical' ? 'danger' : iss.priority === 'high' ? 'warning' : 'neutral'}
                    />
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 6 }}>
                    {iss.reported_date ? new Date(iss.reported_date).toLocaleString() : ''}
                  </Text>
                </Card>
              ))
            )}
          </View>
        )}

        {tab === 'driver' && (
          <Card variant="glass" style={{ marginTop: 16, padding: 16 }}>
            {driver ? (
              <>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
                  {[driver.first_name, driver.last_name].filter(Boolean).join(' ') || 'Driver'}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>Driver record linked to this truck.</Text>
              </>
            ) : (
              <Text style={{ color: colors.textSecondary }}>No driver assigned</Text>
            )}
          </Card>
        )}
      </ScrollView>
    </View>
  )
}
