import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { colors } from '@/constants/colors'

export default function DriverInspection() {
  const { type } = useLocalSearchParams<{ type: string }>()
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, padding: 20, paddingTop: 60 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700' }}>Inspection</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Type: {type}</Text>
      <Text style={{ color: colors.textMuted, marginTop: 12 }}>
        Camera + checklist wiring comes in Phase 2.
      </Text>
    </View>
  )
}

