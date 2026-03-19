import { useState } from 'react'
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { colors } from '@/constants/colors'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { signUp } from '@/lib/auth'
import { Link } from 'expo-router'

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSignup = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    const { error } = await signUp(email.trim(), password)
    if (error) setError(error.message)
    else setSuccess('Account created. Check your email if confirmation is required.')
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bgBase }}
    >
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: '700', marginBottom: 12 }}>
          Create account
        </Text>
        <Text style={{ color: colors.textSecondary, marginBottom: 18 }}>
          Sign up to get started.
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
          {success && <Text style={{ color: colors.success, fontSize: 12, marginBottom: 10 }}>{success}</Text>}

          <Button label="Sign up" onPress={handleSignup} loading={loading} />

          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 12 }}>
            Already have an account?{' '}
            <Link href="/(auth)/login" style={{ color: colors.accent }}>
              Login
            </Link>
          </Text>
        </Card>
      </View>
    </KeyboardAvoidingView>
  )
}

