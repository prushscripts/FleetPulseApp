import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { colors } from '@/constants/colors'

export default function VehicleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, padding: 20, paddingTop: 60 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700' }}>Vehicle</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 8 }}>ID: {id}</Text>
    </View>
  )
}

