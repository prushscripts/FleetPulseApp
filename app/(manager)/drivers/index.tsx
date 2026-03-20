import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import { supabase } from '@/lib/supabase'

type DriverRow = {
  id: string
  first_name: string | null
  last_name: string | null
  location: string | null
  email: string | null
}

export default function DriversIndex() {
  const insets = useSafeAreaInsets()
  const [rows, setRows] = useState<DriverRow[]>([])
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
      .from('drivers')
      .select('id, first_name, last_name, location, email')
      .eq('company_id', companyId)
      .order('first_name')
    setRows((data as DriverRow[]) ?? [])
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
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>Drivers</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{rows.length} on file</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(d) => d.id}
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
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item: d }) => (
          <Pressable
            onPress={() => router.push(`/(manager)/drivers/${d.id}`)}
            style={{
              padding: 16,
              marginBottom: 10,
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.borderDefault,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                {[d.first_name, d.last_name].filter(Boolean).join(' ') || '—'}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                {d.location ?? 'No territory'} · {d.email ?? ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? null : (
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>No drivers yet</Text>
          )
        }
      />
    </View>
  )
}
