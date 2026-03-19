import { View, Text } from 'react-native'
import { colors } from '@/constants/colors'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { signOut } from '@/lib/auth'
import { Link } from 'expo-router'

export default function ManagerHome() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, padding: 20, paddingTop: 60 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '700', marginBottom: 12 }}>
        Manager Dashboard
      </Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
        Phase 1 shell. Next: wire vehicles, drivers, inspections.
      </Text>

      <Card variant="glass" style={{ padding: 16, gap: 10 }}>
        <Link href="/(manager)/health" style={{ color: colors.accent, fontWeight: '600' }}>
          Fleet Health →
        </Link>
        <Link href="/(manager)/vehicles" style={{ color: colors.accent, fontWeight: '600' }}>
          Vehicles →
        </Link>
        <Link href="/(manager)/drivers" style={{ color: colors.accent, fontWeight: '600' }}>
          Drivers →
        </Link>
        <Link href="/(manager)/inspections" style={{ color: colors.accent, fontWeight: '600' }}>
          Inspections →
        </Link>
      </Card>

      <View style={{ height: 16 }} />
      <Button label="Sign out" onPress={() => void signOut()} variant="ghost" />
    </View>
  )
}

