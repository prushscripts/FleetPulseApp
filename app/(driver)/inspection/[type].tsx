import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { INSPECTION_ITEMS, type ChecklistItem } from '@/lib/inspection-items'
import { loadDriverVehicleContext } from '@/lib/driver-vehicle'
import type { DriverVehicle } from '@/lib/driver-vehicle'
import { getWebBaseUrl } from '@/lib/config'

type ItemAnswer = { status: 'pass' | 'fail' | null; note: string }
type Phase = 'vehicle' | 'odometer' | 'checklist' | 'summary' | 'success'

export default function DriverInspectionScreen() {
  void useLocalSearchParams<{ type: string }>()
  const insets = useSafeAreaInsets()
  const inspectionType = 'pre_trip' as const

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [driverId, setDriverId] = useState<string | null>(null)
  const [driverDisplayName, setDriverDisplayName] = useState('Driver')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null)

  const [items] = useState<ChecklistItem[]>(INSPECTION_ITEMS)
  const [answers, setAnswers] = useState<Record<string, ItemAnswer>>(() =>
    Object.fromEntries(INSPECTION_ITEMS.map((i) => [i.id, { status: null, note: '' }])),
  )

  const [phase, setPhase] = useState<Phase>('vehicle')
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [odometer, setOdometer] = useState('')
  const [odometerError, setOdometerError] = useState<string | null>(null)
  const [overallNotes, setOverallNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const categories = useMemo(() => {
    const s = new Set<string>()
    const list: string[] = []
    for (const i of items) {
      if (!s.has(i.category)) {
        s.add(i.category)
        list.push(i.category)
      }
    }
    return list
  }, [items])

  const activeCategory = categories[categoryIndex] ?? ''
  const activeItems = useMemo(() => items.filter((i) => i.category === activeCategory), [items, activeCategory])

  const failedItems = useMemo(
    () =>
      items
        .filter((i) => answers[i.id]?.status === 'fail')
        .map((i) => ({ ...i, note: answers[i.id]?.note || '' })),
    [items, answers],
  )

  const passedCount = useMemo(() => items.filter((i) => answers[i.id]?.status === 'pass').length, [items, answers])

  const categoryComplete = useMemo(() => {
    if (!activeItems.length) return false
    return activeItems.every((i) => {
      const a = answers[i.id]
      if (!a?.status) return !i.required
      if (a.status === 'fail') return a.note.trim().length > 0
      return true
    })
  }, [activeItems, answers])

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoadError('Not signed in')
      return
    }
    const ctx = await loadDriverVehicleContext(supabase, user)
    setDriverId(ctx.driverId)
    setDriverDisplayName(ctx.displayName)
    setCompanyId(ctx.companyId)
    setVehicle(ctx.vehicle)
    if (!ctx.driverId || !ctx.vehicle) {
      setLoadError('No vehicle assignment found.')
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setLoadError(null)
      try {
        await load()
      } catch {
        setLoadError('Unable to load inspection.')
      } finally {
        setLoading(false)
      }
    })()
  }, [load])

  useEffect(() => {
    if (!odometer.trim()) {
      setOdometerError(null)
      return
    }
    const n = Number(odometer)
    if (!Number.isFinite(n) || n <= 0) {
      setOdometerError('Enter a valid mileage.')
      return
    }
    const last = vehicle?.current_mileage ?? 0
    if (last && n < last) {
      setOdometerError(`Cannot be lower than last (${last.toLocaleString()} mi)`)
      return
    }
    setOdometerError(null)
  }, [odometer, vehicle?.current_mileage])

  const setAnswer = (id: string, status: 'pass' | 'fail') => {
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], status } }))
  }

  const setNote = (id: string, note: string) => {
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], note } }))
  }

  const nextChecklistStep = () => {
    if (categoryIndex < categories.length - 1) setCategoryIndex((i) => i + 1)
    else setPhase('summary')
  }

  const submit = async () => {
    const effectiveCompanyId = companyId ?? vehicle?.company_id ?? null
    if (!vehicle?.id || !effectiveCompanyId || !driverId) {
      setSubmitError('Missing assignment. Contact your manager.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const odometerValue = Number(odometer)
      const status = failedItems.length > 0 ? 'failed' : 'passed'

      const results = items.map((i) => ({
        itemId: i.id,
        label: i.label,
        category: i.category,
        required: i.required,
        passed: answers[i.id]?.status === 'pass',
        note: answers[i.id]?.note || '',
      }))

      const { data: newInspection, error: insErr } = await supabase
        .from('inspections')
        .insert({
          company_id: effectiveCompanyId,
          vehicle_id: vehicle.id,
          driver_id: driverId,
          submitted_by_user_id: user.id,
          type: inspectionType,
          status,
          odometer: odometerValue,
          notes: overallNotes || null,
          results,
        })
        .select('id')
        .single()

      if (insErr) throw insErr
      const inspectionId = (newInspection as { id?: string } | null)?.id ?? null

      for (const f of failedItems) {
        const { error: issErr } = await supabase.from('issues').insert({
          vehicle_id: vehicle.id,
          title: `${f.label} — failed during inspection`,
          description: f.note || null,
          status: 'open',
          priority: 'high',
          reported_date: new Date().toISOString().slice(0, 10),
          source: 'pre_trip',
          inspection_id: inspectionId,
        })
        if (issErr) console.warn('issue insert', issErr)
      }

      if (status === 'failed' && failedItems.length > 0) {
        const base = getWebBaseUrl()
        if (base) {
          try {
            await fetch(`${base}/api/notifications/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                company_id: effectiveCompanyId,
                type: 'inspection_failed',
                title: `Failed inspection — ${vehicle.code ?? vehicle.id}`,
                body: `${driverDisplayName} submitted a pre-trip with ${failedItems.length} failed item(s).`,
                data: {
                  vehicle_id: vehicle.id,
                  vehicle_number: vehicle.code,
                  inspection_id: inspectionId,
                  driver_name: driverDisplayName,
                  failed_count: failedItems.length,
                },
                territory: vehicle.location ?? undefined,
              }),
            })
          } catch {
            /* non-blocking */
          }
        }
      }

      setPhase('success')
    } catch (e: unknown) {
      setSubmitError((e as Error).message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={{ color: colors.textMuted, marginTop: 12 }}>Loading inspection…</Text>
      </View>
    )
  }

  if (loadError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase, padding: 24, paddingTop: insets.top + 40 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Cannot start</Text>
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>{loadError}</Text>
        <Button label="Back" onPress={() => router.back()} variant="ghost" style={{ marginTop: 24 }} />
      </View>
    )
  }

  const ymm = [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(' ')
  const cur = vehicle?.current_mileage ?? 0
  const due = vehicle?.oil_change_due_mileage ?? 0
  const overdue = due > 0 && cur >= due

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgBase, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {phase !== 'vehicle' && phase !== 'success' ? (
        <Pressable
          onPress={() => {
            if (phase === 'odometer') setPhase('vehicle')
            else if (phase === 'checklist') {
              if (categoryIndex > 0) setCategoryIndex((i) => i - 1)
              else setPhase('odometer')
            } else if (phase === 'summary') {
              setCategoryIndex(categories.length - 1)
              setPhase('checklist')
            } else router.back()
          }}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 6 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
          <Text style={{ color: colors.accent }}>Back</Text>
        </Pressable>
      ) : null}

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {phase === 'vehicle' && (
          <>
            <Text style={{ color: colors.textMuted, fontSize: 11, letterSpacing: 1 }}>PRE-TRIP INSPECTION</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 8 }}>Vehicle check</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 6 }}>{new Date().toLocaleString()}</Text>
            <View style={{ marginTop: 20, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.borderDefault }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 18 }}>{vehicle?.code ?? '—'}</Text>
              <Text style={{ color: colors.textSecondary, marginTop: 6 }}>{ymm || '—'}</Text>
              <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 12 }}>
                Mileage: {(cur || 0).toLocaleString()} mi · Oil due: {due ? due.toLocaleString() : '—'}
              </Text>
              {overdue ? (
                <Text style={{ color: colors.warning, marginTop: 8, fontSize: 12 }}>Oil change overdue — still complete inspection.</Text>
              ) : null}
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13 }}>Inspector: {driverDisplayName}</Text>
            </View>
            <Button
              label="Begin inspection →"
              onPress={() => setPhase('odometer')}
              disabled={!vehicle?.id}
              size="lg"
              style={{ marginTop: 24 }}
            />
          </>
        )}

        {phase === 'odometer' && (
          <>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>STEP 1 OF 3</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 8 }}>Current odometer</Text>
            <TextInput
              value={odometer}
              onChangeText={setOdometer}
              keyboardType="number-pad"
              placeholder="Miles"
              placeholderTextColor={colors.textMuted}
              style={{
                marginTop: 20,
                fontSize: 28,
                fontWeight: '700',
                color: colors.textPrimary,
                textAlign: 'center',
                padding: 16,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: odometerError ? colors.danger : colors.borderDefault,
              }}
            />
            {odometerError ? <Text style={{ color: colors.danger, marginTop: 8, textAlign: 'center' }}>{odometerError}</Text> : null}
            <Button
              label="Continue →"
              onPress={() => setPhase('checklist')}
              disabled={!odometer.trim() || !!odometerError}
              size="lg"
              style={{ marginTop: 24 }}
            />
          </>
        )}

        {phase === 'checklist' && (
          <>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              CATEGORY {categoryIndex + 1} OF {categories.length}
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 8 }}>{activeCategory}</Text>
            <View style={{ marginTop: 16, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <View
                style={{
                  width: `${((categoryIndex + 1) / categories.length) * 100}%`,
                  height: '100%',
                  backgroundColor: colors.accent,
                  borderRadius: 2,
                }}
              />
            </View>
            {activeItems.map((i) => {
              const a = answers[i.id]
              return (
                <View
                  key={i.id}
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderWidth: 1,
                    borderColor: colors.borderDefault,
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 15, lineHeight: 22 }}>{i.label}</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <Pressable
                      onPress={() => setAnswer(i.id, 'pass')}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: 'center',
                        backgroundColor: a?.status === 'pass' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                        borderWidth: 1,
                        borderColor: a?.status === 'pass' ? colors.success : colors.borderDefault,
                      }}
                    >
                      <Text style={{ color: colors.success, fontWeight: '700' }}>✓ Pass</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setAnswer(i.id, 'fail')}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: 'center',
                        backgroundColor: a?.status === 'fail' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                        borderWidth: 1,
                        borderColor: a?.status === 'fail' ? colors.danger : colors.borderDefault,
                      }}
                    >
                      <Text style={{ color: colors.danger, fontWeight: '700' }}>✗ Fail</Text>
                    </Pressable>
                  </View>
                  {a?.status === 'fail' ? (
                    <TextInput
                      value={a.note}
                      onChangeText={(t) => setNote(i.id, t)}
                      placeholder="Note required for failed items"
                      placeholderTextColor={colors.textMuted}
                      multiline
                      style={{
                        marginTop: 10,
                        minHeight: 72,
                        padding: 12,
                        borderRadius: 10,
                        color: colors.textPrimary,
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderWidth: 1,
                        borderColor: !a.note.trim() ? colors.danger : colors.borderDefault,
                      }}
                    />
                  ) : null}
                </View>
              )
            })}
            <Button
              label={categoryIndex < categories.length - 1 ? 'Next category' : 'Review summary'}
              onPress={nextChecklistStep}
              disabled={!categoryComplete}
              size="lg"
              style={{ marginTop: 24 }}
            />
          </>
        )}

        {phase === 'summary' && (
          <>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>SUMMARY</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 8 }}>Review & submit</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <View style={{ flex: 1, padding: 16, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.12)' }}>
                <Text style={{ color: colors.success, fontSize: 28, fontWeight: '800' }}>{passedCount}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Passed</Text>
              </View>
              <View style={{ flex: 1, padding: 16, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.12)' }}>
                <Text style={{ color: colors.danger, fontSize: 28, fontWeight: '800' }}>{failedItems.length}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Failed</Text>
              </View>
            </View>
            {failedItems.length > 0 ? (
              <View style={{ marginTop: 16 }}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600', marginBottom: 8 }}>Failed items</Text>
                {failedItems.map((f) => (
                  <Text key={f.id} style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}>
                    · {f.label}: {f.note}
                  </Text>
                ))}
              </View>
            ) : null}
            <Text style={{ color: colors.textSecondary, marginTop: 20, fontSize: 13 }}>Overall notes (optional)</Text>
            <TextInput
              value={overallNotes}
              onChangeText={setOverallNotes}
              multiline
              placeholder="Anything else?"
              placeholderTextColor={colors.textMuted}
              style={{
                marginTop: 8,
                minHeight: 80,
                padding: 12,
                borderRadius: 12,
                color: colors.textPrimary,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: colors.borderDefault,
              }}
            />
            {submitError ? <Text style={{ color: colors.danger, marginTop: 12 }}>{submitError}</Text> : null}
            <Button label={submitting ? 'Submitting…' : 'Submit inspection'} onPress={() => void submit()} loading={submitting} size="lg" style={{ marginTop: 24 }} />
          </>
        )}

        {phase === 'success' && (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                backgroundColor: failedItems.length ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={failedItems.length ? 'alert' : 'checkmark'} size={36} color={failedItems.length ? colors.warning : colors.success} />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 20 }}>
              {failedItems.length ? 'Inspection submitted' : 'All clear!'}
            </Text>
            <Text style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
              {passedCount} passed · {failedItems.length} failed
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 12 }}>{new Date().toLocaleString()}</Text>
            <Button label="Back to dashboard" onPress={() => router.replace('/(driver)')} style={{ marginTop: 28, alignSelf: 'stretch' }} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
