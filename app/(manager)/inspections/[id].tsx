import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'

export default function InspectionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [row, setRow] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data } = await supabase.from('inspections').select('*').eq('id', id).maybeSingle()
      setRow(data as Record<string, unknown> | null)
    })()
  }, [id])

  const passed = String(row?.status ?? '').toLowerCase() === 'passed'

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, paddingTop: insets.top + 8 }}>
      <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 6 }}>
        <Ionicons name="chevron-back" size={22} color={colors.accent} />
        <Text style={{ color: colors.accent }}>Inspections</Text>
      </Pressable>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card variant="glass" style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>Inspection</Text>
            <Badge label={passed ? 'Passed' : 'Failed'} variant={passed ? 'success' : 'danger'} />
          </View>
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
            Odometer: {String(row?.odometer ?? '—')}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>
            {row?.submitted_at ? new Date(String(row.submitted_at)).toLocaleString() : ''}
          </Text>
          {row?.notes ? (
            <Text style={{ color: colors.textSecondary, marginTop: 16 }}>{String(row.notes)}</Text>
          ) : null}
        </Card>
      </ScrollView>
    </View>
  )
}
