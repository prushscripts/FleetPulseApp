import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'

type InspRow = {
  id: string
  status: string | null
  submitted_at: string | null
  type: string | null
  vehicles: { code: string | null } | null
}

export default function InspectionsIndex() {
  const insets = useSafeAreaInsets()
  const [rows, setRows] = useState<InspRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const companyId = user?.user_metadata?.company_id as string | undefined
    if (!companyId) {
      setRows([])
      return
    }
    const { data } = await supabase
      .from('inspections')
      .select('id, status, submitted_at, type, vehicles(code)')
      .eq('company_id', companyId)
      .order('submitted_at', { ascending: false })
      .limit(100)

    const normalized = ((data ?? []) as Record<string, unknown>[]).map((r) => {
      const veh = r.vehicles
      let vObj: { code: string | null } | null = null
      if (Array.isArray(veh)) vObj = veh[0] as { code: string | null }
      else if (veh && typeof veh === 'object') vObj = veh as { code: string | null }
      return { ...r, vehicles: vObj } as InspRow
    })
    setRows(normalized)
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [load])

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, paddingTop: insets.top + 8 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>Inspections</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Recent submissions</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
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
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: r }) => {
          const passed = (r.status ?? '').toLowerCase() === 'passed'
          return (
            <Pressable
              onPress={() => router.push(`/(manager)/inspections/${r.id}`)}
              style={{
                padding: 14,
                marginBottom: 10,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: colors.borderDefault,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                  {r.vehicles?.code ?? 'Vehicle'}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                  {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'} · {r.type ?? 'inspection'}
                </Text>
              </View>
              <Badge label={passed ? 'Passed' : 'Failed'} variant={passed ? 'success' : 'danger'} />
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 8 }} />
            </Pressable>
          )
        }}
        ListEmptyComponent={
          loading ? null : (
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>No inspections yet</Text>
          )
        }
      />
    </View>
  )
}
