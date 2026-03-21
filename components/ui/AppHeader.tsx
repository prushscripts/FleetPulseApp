import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import * as Haptics from 'expo-haptics'

interface Props {
  title: string
  subtitle?: string
  showBack?: boolean
  rightAction?: { icon: string; onPress: () => void }
}

export default function AppHeader({ title, subtitle, showBack, rightAction }: Props) {
  const handleSignOut = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          router.replace('/(auth)/login' as any)
        },
      },
    ], { userInterfaceStyle: 'dark' })
  }

  const handleProfile = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push('/(manager)/profile' as any)
  }

  return (
    <View style={s.container}>
      <View style={s.left}>
        {showBack ? (
          <View style={s.backRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={s.backTitleBlock}>
              <Text style={s.title} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={s.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View>
            {title ? <Text style={s.title}>{title}</Text> : null}
            {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
          </View>
        )}
      </View>

      <View style={s.right}>
        {rightAction ? (
          <TouchableOpacity onPress={rightAction.onPress} style={s.iconBtn}>
            <Ionicons name={rightAction.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={handleProfile} style={s.iconBtn}>
          <Ionicons name="person-circle-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignOut} style={s.iconBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  left: { flex: 1, minWidth: 0 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  backTitleBlock: { flex: 1, minWidth: 0 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { color: 'white', fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  backBtn: { padding: 4 },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 6,
  },
})
