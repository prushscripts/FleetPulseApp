import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import AppHeader from '@/components/ui/AppHeader'
import { getCompanyId } from '@/lib/getCompanyId'

export default function MessagesScreen() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [recent, setRecent] = useState<
    { id: string; title: string; body: string; target_territory: string | null; created_at: string }[]
  >([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [recipient, setRecipient] = useState<'all' | 'ny' | 'dmv'>('all')

  useEffect(() => {
    const load = async () => {
      const cid = await getCompanyId()
      setCompanyId(cid)
      if (!cid) {
        setRecent([])
        return
      }
      const { data: msgs } = await supabase
        .from('announcements')
        .select('id, title, body, target_territory, created_at')
        .eq('company_id', cid)
        .order('created_at', { ascending: false })
        .limit(20)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setRecent((msgs as any[]) ?? [])
    }
    void load()
  }, [])

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Required', 'Please enter a title and message.')
      return
    }
    if (!companyId) {
      Alert.alert('Error', 'No company ID. Cannot send message.')
      return
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSending(true)
    try {
      // 1. Write to announcements table (drivers see this)
      const { data: authData } = await supabase.auth.getUser()
      const { error: annError } = await supabase.from('announcements').insert({
        company_id: companyId,
        title: title.trim(),
        body: body.trim(),
        target_territory: recipient === 'all' ? 'all' : recipient === 'ny' ? 'New York' : 'DMV',
        is_active: true,
        expires_at: null,
        created_by: authData.user?.id,
      })
      if (annError) throw annError

      // 2. Also write to notifications table (web dashboard bell)
      await supabase.from('notifications').insert({
        company_id: companyId,
        type: 'announcement',
        title: title.trim(),
        body: body.trim(),
        recipient_territory: recipient === 'all' ? null : recipient === 'ny' ? 'New York' : 'DMV',
        read: false,
        deleted: false,
      })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setSent(true)
      setTitle('')
      setBody('')
      setTimeout(() => setSent(false), 3000)

      const { data: msgs } = await supabase
        .from('announcements')
        .select('id, title, body, target_territory, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setRecent((msgs as any[]) ?? [])
    } catch {
      Alert.alert('Error', 'Could not send message.')
    } finally {
      setSending(false)
    }
  }

  const timeAgo = (dateStr: string) => {
    const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Messages" showBack />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.card}>
          <Text style={s.cardTitle}>Send Message to Drivers</Text>

          <Text style={s.label}>Send To</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {(
              [
                ['all', 'Everyone'],
                ['ny', 'New York'],
                ['dmv', 'DMV'],
              ] as const
            ).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                onPress={() => setRecipient(val)}
                style={[s.recipientBtn, recipient === val && s.recipientBtnActive]}
              >
                <Text style={[s.recipientBtnText, recipient === val && { color: 'white' }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Route change today"
            placeholderTextColor={colors.textMuted}
            style={s.input}
          />

          <Text style={s.label}>Message</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Type your message..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            style={[s.input, { height: 100, textAlignVertical: 'top' }]}
          />

          {sent ? (
            <View style={s.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={{ color: colors.success, fontSize: 13, fontWeight: '600' }}>Message sent!</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() => void handleSend()}
            disabled={sending || !title.trim() || !body.trim()}
            style={[s.sendBtn, (sending || !title.trim() || !body.trim()) && { opacity: 0.5 }]}
          >
            {sending ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="send-outline" size={16} color="white" />
                <Text style={s.sendBtnText}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Recent Messages</Text>
          {recent.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 20 }}>
              No messages sent yet
            </Text>
          ) : (
            recent.map((msg) => (
              <View key={msg.id} style={s.msgRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.msgTitle}>{msg.title}</Text>
                  <Text style={s.msgBody} numberOfLines={2}>
                    {msg.body}
                  </Text>
                  <Text style={s.msgMeta}>
                    To: {msg.target_territory ?? 'Everyone'} · {timeAgo(msg.created_at)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 16 },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12,
    color: 'white',
    fontSize: 15,
    padding: 14,
    marginBottom: 14,
  },
  recipientBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  recipientBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  recipientBtnText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  msgRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  msgTitle: { color: 'white', fontSize: 14, fontWeight: '600' },
  msgBody: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  msgMeta: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
})
