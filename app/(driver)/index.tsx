import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import { loadDriverVehicleContext } from '@/lib/driver-vehicle'
import type { DriverVehicle } from '@/lib/driver-vehicle'
import { postWebJson } from '@/lib/web-api'

type Announcement = {
  id: string
  title: string
  body: string | null
  created_at: string
}

type InspMini = {
  id: string
  status: string | null
  submitted_at: string | null
  vehicles: { code: string | null } | null
}

export default function DriverHome() {
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [nickname, setNickname] = useState('there')
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null)
  const [driverId, setDriverId] = useState<string | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [recent, setRecent] = useState<InspMini[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [issueTitle, setIssueTitle] = useState('')
  const [issueBody, setIssueBody] = useState('')
  const [issuePri, setIssuePri] = useState<'low' | 'medium' | 'high'>('medium')
  const [issueSending, setIssueSending] = useState(false)
  const [issueMsg, setIssueMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const n = (user.user_metadata?.nickname as string | undefined)?.trim()
    setNickname(n || user.email?.split('@')[0] || 'there')

    const ctx = await loadDriverVehicleContext(supabase, user)
    setDriverId(ctx.driverId)
    setVehicle(ctx.vehicle)

    if (ctx.companyId) {
      const { data: a } = await supabase
        .from('announcements')
        .select('id, title, body, created_at')
        .eq('company_id', ctx.companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10)
      setAnnouncements((a as Announcement[]) ?? [])
    } else {
      setAnnouncements([])
    }

    if (ctx.driverId) {
      const { data: insp } = await supabase
        .from('inspections')
        .select('id, status, submitted_at, vehicles(code)')
        .eq('driver_id', ctx.driverId)
        .order('submitted_at', { ascending: false })
        .limit(5)
      const normalized = ((insp ?? []) as Record<string, unknown>[]).map((r) => {
        const veh = r.vehicles
        let vObj: { code: string | null } | null = null
        if (Array.isArray(veh)) vObj = veh[0] as { code: string | null }
        else if (veh && typeof veh === 'object') vObj = veh as { code: string | null }
        return { ...r, vehicles: vObj } as InspMini
      })
      setRecent(normalized)
    } else {
      setRecent([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const cur = vehicle?.current_mileage ?? 0
  const due = vehicle?.oil_change_due_mileage ?? 0
  const overdue = due > 0 && cur >= due ? cur - due : 0
  const ymm = [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(' ')

  const submitIssue = async () => {
    if (!issueTitle.trim()) {
      setIssueMsg('Title is required')
      return
    }
    setIssueSending(true)
    setIssueMsg(null)
    try {
      await postWebJson('/api/driver-report-issue', {
        title: issueTitle.trim(),
        description: issueBody.trim() || null,
        priority: issuePri,
      })
      setIssueTitle('')
      setIssueBody('')
      setSheetOpen(false)
      setIssueMsg('Reported!')
      setTimeout(() => setIssueMsg(null), 2500)
    } catch (e: unknown) {
      setIssueMsg((e as Error).message || 'Failed to submit')
    } finally {
      setIssueSending(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, paddingTop: insets.top + 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>
          Hey {nickname} 👋
        </Text>
        <Pressable onPress={() => void signOut()} hitSlop={10}>
          <Text style={{ color: colors.accent, fontSize: 13 }}>Sign out</Text>
        </Pressable>
      </View>
      <Text style={{ color: colors.textMuted, paddingHorizontal: 16, marginTop: 4, fontSize: 13 }}>
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
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
      >
        {issueMsg && !sheetOpen ? (
          <Text style={{ color: colors.success, marginBottom: 12, fontSize: 13 }}>{issueMsg}</Text>
        ) : null}

        {vehicle ? (
          <Card variant="glass" style={{ padding: 16 }}>
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
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>
                  {vehicle.code ?? '—'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{ymm || '—'}</Text>
                {vehicle.location ? (
                  <Badge label={vehicle.location} variant="neutral" style={{ alignSelf: 'flex-start', marginTop: 8 }} />
                ) : null}
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 24 }}>
              <View>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Mileage</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                  {(cur || 0).toLocaleString()} mi
                </Text>
              </View>
              <View>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Oil</Text>
                <Text style={{ color: overdue > 0 ? colors.warning : colors.success, fontWeight: '700' }}>
                  {overdue > 0 ? `Overdue ${overdue.toLocaleString()} mi` : 'OK'}
                </Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card variant="glass" style={{ padding: 16, borderColor: 'rgba(245,158,11,0.35)', borderWidth: 1 }}>
            <Text style={{ color: colors.warning, fontWeight: '700' }}>No vehicle assigned</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 13 }}>
              Contact your fleet manager to link your account to a truck.
            </Text>
          </Card>
        )}

        <Button
          label="🚛 Start Pre-Trip Inspection"
          onPress={() => router.push('/(driver)/inspection/pre_trip')}
          disabled={!vehicle}
          size="lg"
          style={{ marginTop: 16 }}
        />

        <Button
          label="⚠ Report an Issue"
          onPress={() => setSheetOpen(true)}
          variant="ghost"
          disabled={!vehicle}
          style={{ marginTop: 12 }}
        />

        <Text style={{ color: colors.textPrimary, fontWeight: '700', marginTop: 28, marginBottom: 10, fontSize: 16 }}>
          Announcements
        </Text>
        {announcements.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>No active announcements</Text>
        ) : (
          announcements.map((a) => (
            <Card key={a.id} variant="glass" style={{ padding: 14, marginBottom: 10 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{a.title}</Text>
              {a.body ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }}>{a.body}</Text>
              ) : null}
              <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 8 }}>
                {new Date(a.created_at).toLocaleDateString()}
              </Text>
            </Card>
          ))
        )}

        <Text style={{ color: colors.textPrimary, fontWeight: '700', marginTop: 24, marginBottom: 10, fontSize: 16 }}>
          Recent inspections
        </Text>
        {recent.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>None yet</Text>
        ) : (
          recent.map((r) => {
            const ok = (r.status ?? '').toLowerCase() === 'passed'
            return (
              <View
                key={r.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <View>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{r.vehicles?.code ?? '—'}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : ''}
                  </Text>
                </View>
                <Badge label={ok ? 'Passed' : 'Failed'} variant={ok ? 'success' : 'danger'} />
              </View>
            )
          })
        )}
      </ScrollView>

      <Modal visible={sheetOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <View
            style={{
              backgroundColor: colors.bgSurface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: insets.bottom + 20,
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Report an issue</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>
              Managers get notified from the web dashboard.
            </Text>
            <TextInput
              value={issueTitle}
              onChangeText={setIssueTitle}
              placeholder="Title (required)"
              placeholderTextColor={colors.textMuted}
              style={{
                marginTop: 14,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 14,
                color: colors.textPrimary,
                borderWidth: 1,
                borderColor: colors.borderDefault,
              }}
            />
            <TextInput
              value={issueBody}
              onChangeText={setIssueBody}
              placeholder="Details (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              style={{
                marginTop: 10,
                minHeight: 80,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 14,
                color: colors.textPrimary,
                borderWidth: 1,
                borderColor: colors.borderDefault,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setIssuePri(p)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: issuePri === p ? colors.accent : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Text style={{ color: issuePri === p ? '#fff' : colors.textSecondary, fontSize: 12, textTransform: 'capitalize' }}>
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>
            {issueMsg && sheetOpen ? (
              <Text style={{ color: colors.danger, fontSize: 12, marginTop: 10 }}>{issueMsg}</Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => {
                  setSheetOpen(false)
                  setIssueMsg(null)
                }}
                style={{ flex: 1 }}
              />
              <Button label={issueSending ? 'Sending…' : 'Submit'} onPress={() => void submitIssue()} loading={issueSending} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}
