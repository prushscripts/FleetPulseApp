import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import Card from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'

export default function DriverDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [row, setRow] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data } = await supabase.from('drivers').select('*').eq('id', id).maybeSingle()
      setRow(data as Record<string, unknown> | null)
    })()
  }, [id])

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, paddingTop: insets.top + 8 }}>
      <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 6 }}>
        <Ionicons name="chevron-back" size={22} color={colors.accent} />
        <Text style={{ color: colors.accent }}>Drivers</Text>
      </Pressable>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card variant="glass" style={{ padding: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>
            {[row?.first_name, row?.last_name].filter(Boolean).join(' ') || 'Driver'}
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{String(row?.email ?? '—')}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>Location: {String(row?.location ?? '—')}</Text>
        </Card>
      </ScrollView>
    </View>
  )
}
