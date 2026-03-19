import { View, Text } from 'react-native'
import { colors } from '@/constants/colors'
import { Link } from 'expo-router'

export default function InspectionsIndex() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, padding: 20, paddingTop: 60 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700' }}>Inspections</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 8 }}>List UI stub (Phase 1).</Text>
      <Text style={{ color: colors.accent, marginTop: 16 }}>
        <Link href="/(manager)/inspections/1">Open demo inspection →</Link>
      </Text>
    </View>
  )
}

