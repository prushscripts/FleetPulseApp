import { View, Text } from 'react-native'
import { colors } from '@/constants/colors'
import { Link } from 'expo-router'

export default function DriverHome() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, padding: 20, paddingTop: 60 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '700', marginBottom: 10 }}>
        Driver Portal
      </Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 18 }}>Phase 1 shell.</Text>

      <Text style={{ color: colors.accent }}>
        <Link href="/(driver)/inspection/pre_trip">Start pre-trip inspection →</Link>
      </Text>
    </View>
  )
}

