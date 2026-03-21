import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import type { User } from '@supabase/supabase-js'
import AppHeader from '@/components/ui/AppHeader'

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null)
  const [companyName, setCompanyName] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser()
      setUser(u)
      setCompanyName((u?.user_metadata?.company_name as string | undefined) ?? 'Your Company')
    }
    void load()
  }, [])

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

  const nickname =
    (user?.user_metadata?.nickname as string | undefined) || user?.email?.split('@')[0] || 'Manager'
  const email = user?.email ?? ''
  const role = (user?.user_metadata?.role as string | undefined) ?? 'manager'
  const initial = nickname[0]?.toUpperCase() ?? '?'

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Profile" showBack />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <Text style={s.name}>{nickname}</Text>
          <Text style={s.email}>{email}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
          </View>
          <Text style={s.company}>{companyName}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Account</Text>
          {[
            { icon: 'business-outline' as const, label: 'Company', value: companyName },
            { icon: 'shield-checkmark-outline' as const, label: 'Role', value: role },
            { icon: 'mail-outline' as const, label: 'Email', value: email },
          ].map((item) => (
            <View key={item.label} style={s.row}>
              <View style={s.rowLeft}>
                <Ionicons name={item.icon} size={18} color={colors.accent} />
                <Text style={s.rowLabel}>{item.label}</Text>
              </View>
              <Text style={s.rowValue} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>App</Text>
          <TouchableOpacity
            style={s.row}
            onPress={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              router.push('/(manager)/messages' as any)
            }}
          >
            <View style={s.rowLeft}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.accent} />
              <Text style={s.rowLabel}>Messages & Announcements</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  profileCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { color: colors.accent, fontSize: 28, fontWeight: '800' },
  name: { color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  email: { color: colors.textMuted, fontSize: 13, marginBottom: 10 },
  roleBadge: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 8,
  },
  roleText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  company: { color: colors.textSecondary, fontSize: 13 },
  section: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowLabel: { color: 'white', fontSize: 14 },
  rowValue: { color: colors.textMuted, fontSize: 13, maxWidth: 140 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(239,68,68,0.06)',
    marginTop: 4,
  },
  signOutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
})
