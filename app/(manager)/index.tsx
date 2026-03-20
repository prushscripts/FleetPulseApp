import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  TouchableOpacity,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useManagerPushRegistration } from '@/hooks/usePushRegistration'

type VehicleRow = {
  id: string
  code: string | null
  status: string | null
  current_mileage: number | null
  oil_change_due_mileage: number | null
}

function greetingHour(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function ManagerHome() {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nickname, setNickname] = useState('Manager')
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])
  const [openIssueCount, setOpenIssueCount] = useState(0)

  useManagerPushRegistration(userId)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const metaNick = (user.user_metadata?.nickname as string | undefined)?.trim()
    const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    const fn = (prof as { full_name?: string } | null)?.full_name?.trim()
    setNickname(metaNick || fn || 'Manager')

    const companyId = user.user_metadata?.company_id as string | undefined
    if (!companyId) {
      setVehicles([])
      setOpenIssueCount(0)
      return
    }

    const { data: vData, error: vErr } = await supabase
      .from('vehicles')
      .select('id, code, status, current_mileage, oil_change_due_mileage')
      .eq('company_id', companyId)

    if (vErr) {
      console.warn(vErr)
      setVehicles([])
    } else {
      setVehicles((vData as VehicleRow[]) ?? [])
    }

    const vids = (vData ?? []).map((v: { id: string }) => v.id)
    if (vids.length === 0) {
      setOpenIssueCount(0)
      return
    }
    const { count } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .in('vehicle_id', vids)
      .neq('status', 'resolved')
    setOpenIssueCount(count ?? 0)
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const totalCount = vehicles.length
  const activeCount = vehicles.filter((v) => (v.status || 'active') === 'active').length
  const inShopCount = vehicles.filter((v) => v.status === 'in_shop').length
  const overdueList = vehicles.filter((v) => {
    const cur = v.current_mileage ?? 0
    const due = v.oil_change_due_mileage ?? 0
    return due > 0 && cur >= due
  })
  const overdueCount = overdueList.length

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, paddingTop: insets.top + 12 }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}
      >
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '700' }}>
          {greetingHour()}, {nickname}
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 15 }}>Here&apos;s your fleet today</Text>
        <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 13 }}>{formatToday()}</Text>

        {loading ? (
          <View style={{ marginTop: 20, gap: 12 }}>
            <Skeleton width="100%" height={88} borderRadius={16} />
            <Skeleton width="100%" height={88} borderRadius={16} />
            <Skeleton width="100%" height={120} borderRadius={16} />
          </View>
        ) : (
          <>
            <View
              style={{
                marginTop: 20,
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'space-between',
              }}
            >
              {[
                { label: 'Total', value: totalCount, color: colors.textPrimary },
                { label: 'Active', value: activeCount, color: colors.success },
                { label: 'Oil due', value: overdueCount, color: colors.warning },
                { label: 'Issues', value: openIssueCount, color: colors.accent },
              ].map((k) => (
                <Card key={k.label} variant="glass" style={{ width: '47%', padding: 16 }}>
                  <Text style={{ color: k.color, fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                    {k.value}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4, textTransform: 'uppercase' }}>
                    {k.label}
                  </Text>
                </Card>
              ))}
            </View>

            {inShopCount > 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>
                {inShopCount} vehicle{inShopCount > 1 ? 's' : ''} in shop
              </Text>
            ) : null}

            <View style={{ marginTop: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Ionicons name="warning" size={18} color={colors.warning} />
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Active alerts</Text>
              </View>
              {overdueList.length === 0 ? (
                <Card variant="glass" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>All clear — no oil overdue trucks.</Text>
                </Card>
              ) : (
                <Card variant="glass" style={{ padding: 0, overflow: 'hidden' }}>
                  {overdueList.slice(0, 5).map((v) => {
                    const cur = v.current_mileage ?? 0
                    const due = v.oil_change_due_mileage ?? 0
                    const overdueMi = due > 0 && cur >= due ? cur - due : 0
                    return (
                      <Pressable
                        key={v.id}
                        onPress={() => router.push(`/(manager)/vehicles/${v.id}`)}
                        style={{
                          padding: 14,
                          borderLeftWidth: 3,
                          borderLeftColor: colors.danger,
                          borderBottomWidth: 1,
                          borderBottomColor: 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontFamily: 'System' }}>
                          {v.code ?? '—'}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                          Oil overdue · +{overdueMi.toLocaleString()} mi
                        </Text>
                      </Pressable>
                    )
                  })}
                </Card>
              )}
            </View>

            <View style={{ marginTop: 24, flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => router.push('/(manager)/vehicles')}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.borderDefault,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>Fleet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(manager)/inspections')}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.borderDefault,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Ionicons name="clipboard-outline" size={18} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>Inspections</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(manager)/health')}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.borderDefault,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Ionicons name="pulse-outline" size={18} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>Health</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
        <Button label="Sign out" onPress={() => void signOut()} variant="ghost" />
      </ScrollView>
    </View>
  )
}
