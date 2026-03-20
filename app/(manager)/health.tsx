import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/constants/colors'
import Card from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'

export default function HealthScreen() {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [total, setTotal] = useState(0)
  const [oilOk, setOilOk] = useState(0)
  const [overdue, setOverdue] = useState(0)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const companyId = user?.user_metadata?.company_id as string | undefined
    if (!companyId) {
      setTotal(0)
      setOilOk(0)
      setOverdue(0)
      return
    }
    const { data: rows } = await supabase
      .from('vehicles')
      .select('current_mileage, oil_change_due_mileage')
      .eq('company_id', companyId)
    const list = rows ?? []
    setTotal(list.length)
    let ok = 0
    let od = 0
    for (const v of list) {
      const cur = (v as { current_mileage?: number }).current_mileage ?? 0
      const due = (v as { oil_change_due_mileage?: number }).oil_change_due_mileage ?? 0
      if (due > 0 && cur >= due) od++
      else ok++
    }
    setOilOk(ok)
    setOverdue(od)
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [load])

  const pct = total > 0 ? Math.round((oilOk / total) * 100) : 100

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, paddingTop: insets.top + 12 }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
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
        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '800' }}>Fleet health</Text>
        <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 14 }}>
          Oil compliance snapshot across your fleet
        </Text>

        {loading ? (
          <Text style={{ color: colors.textMuted, marginTop: 24 }}>Loading…</Text>
        ) : (
          <>
            <Card variant="glass" style={{ marginTop: 24, padding: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 12, textTransform: 'uppercase' }}>Health score</Text>
              <Text
                style={{
                  color: pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.danger,
                  fontSize: 44,
                  fontWeight: '800',
                  marginTop: 8,
                }}
              >
                {pct}
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                {oilOk} of {total} trucks not past oil due mileage
              </Text>
            </Card>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Card variant="glass" style={{ flex: 1, padding: 16 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700' }}>{total}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>VEHICLES</Text>
              </Card>
              <Card variant="glass" style={{ flex: 1, padding: 16 }}>
                <Text style={{ color: colors.danger, fontSize: 22, fontWeight: '700' }}>{overdue}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>OIL OVERDUE</Text>
              </Card>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}
