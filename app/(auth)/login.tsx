import { useState } from 'react'
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { colors } from '@/constants/colors'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { signIn } from '@/lib/auth'
import { Link } from 'expo-router'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await signIn(email.trim(), password)
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bgBase }}
    >
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: '700', marginBottom: 12 }}>
          FleetPulse
        </Text>
        <Text style={{ color: colors.textSecondary, marginBottom: 18 }}>
          Sign in to continue.
        </Text>

        <Card variant="glass" style={{ padding: 16 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@company.com"
            placeholderTextColor={colors.textMuted}
            style={{
              color: colors.textPrimary,
              borderWidth: 1,
              borderColor: colors.borderDefault,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 12,
              marginBottom: 12,
            }}
          />
          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            style={{
              color: colors.textPrimary,
              borderWidth: 1,
              borderColor: colors.borderDefault,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 12,
              marginBottom: 12,
            }}
          />

          {error && <Text style={{ color: colors.danger, fontSize: 12, marginBottom: 10 }}>{error}</Text>}

          <Button label="Login" onPress={handleLogin} loading={loading} />

          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 12 }}>
            No account?{' '}
            <Link href="/(auth)/signup" style={{ color: colors.accent }}>
              Sign up
            </Link>
          </Text>
        </Card>
      </View>
    </KeyboardAvoidingView>
  )
}

