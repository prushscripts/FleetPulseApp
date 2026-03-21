import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import * as Haptics from 'expo-haptics'
import { colors } from '@/constants/colors'

const { width: PW, height: PH } = Dimensions.get('window')

const PARTICLE_DATA = Array.from({ length: 12 }, (_, i) => ({
  x: Math.random() * PW,
  y: Math.random() * PH,
  size: Math.random() * 2.5 + 0.8,
  phaseStart: i / 12,
  maxOpacity: Math.random() * 0.4 + 0.1,
}))

function ParticleField({ clock }: { clock: Animated.Value }) {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {PARTICLE_DATA.map((p, i) => {
        const opacity = clock.interpolate({
          inputRange: [0, p.phaseStart, Math.min(p.phaseStart + 0.3, 1), 1],
          outputRange: [p.maxOpacity * 0.2, p.maxOpacity, p.maxOpacity * 0.1, p.maxOpacity * 0.2],
          extrapolate: 'clamp',
        })
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: '#3B82F6',
              opacity,
            }}
          />
        )
      })}
    </View>
  )
}

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const particleClock = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(particleClock, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start()
  }, [])

  const handleSignup = async () => {
    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (!accessCode.trim()) {
      setError('Access code is required to create an account.')
      return
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setLoading(true)
    setError(null)

    try {
      const code = accessCode.trim()
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, manager_access_code, driver_access_code')
        .or(`manager_access_code.eq.${code},driver_access_code.eq.${code}`)
        .maybeSingle()

      if (!company) {
        setError('Invalid access code. Contact your fleet administrator.')
        setLoading(false)
        return
      }

      const detectedRole =
        company.manager_access_code === code ? 'manager' : 'driver'

      const { error: signupError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            nickname: nickname.trim() || email.split('@')[0],
            role: detectedRole,
            company_id: company.id,
            company_name: company.name,
          },
        },
      })

      if (signupError) throw signupError

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setSuccess(true)
    } catch (err: unknown) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      const message = err instanceof Error ? err.message : 'Sign up failed. Try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field: string) => ({
    backgroundColor: focused === field ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: focused === field ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.09)',
    borderRadius: 14,
    color: '#F8FAFC' as const,
    fontSize: 15,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 4,
  })

  const labelStyle = {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    marginBottom: 7,
    marginTop: 14,
    textTransform: 'uppercase' as const,
  }

  if (success) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bgBase,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <StatusBar barStyle="light-content" />
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'rgba(16,185,129,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 28 }}>✓</Text>
        </View>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 10 }}>Account created!</Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 22,
          }}
        >
          Check your email to confirm your account, then sign in.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={{
            backgroundColor: '#3B82F6',
            borderRadius: 14,
            paddingVertical: 16,
            paddingHorizontal: 40,
          }}
        >
          <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, overflow: 'hidden' }}>
      <StatusBar barStyle="light-content" />
      <ParticleField clock={particleClock} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <Text
              style={{ color: 'white', fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 }}
            >
              Create account
            </Text>
            <View style={{ width: 36, height: 2.5, backgroundColor: '#3B82F6', borderRadius: 2, marginBottom: 10 }} />
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Start managing your fleet today</Text>
          </View>

          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.025)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: 22,
              padding: 22,
            }}
          >
            <Text style={{ ...labelStyle, marginTop: 0 }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@company.com"
              placeholderTextColor={colors.textMuted}
              style={inputStyle('email')}
              autoCorrect={false}
              spellCheck={false}
              autoComplete="email"
              textContentType="emailAddress"
            />

            <Text style={labelStyle}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              secureTextEntry
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.textMuted}
              style={inputStyle('password')}
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
              textContentType="newPassword"
            />

            <Text style={labelStyle}>Confirm Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setFocused('confirm')}
              onBlur={() => setFocused(null)}
              secureTextEntry
              placeholder="Repeat password"
              placeholderTextColor={colors.textMuted}
              style={inputStyle('confirm')}
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
              textContentType="newPassword"
            />

            <Text style={labelStyle}>Nickname</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              onFocus={() => setFocused('nickname')}
              onBlur={() => setFocused(null)}
              placeholder="e.g. James"
              placeholderTextColor={colors.textMuted}
              style={inputStyle('nickname')}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="nickname"
            />

            <Text style={labelStyle}>Company Access Code</Text>
            <TextInput
              value={accessCode}
              onChangeText={setAccessCode}
              onFocus={() => setFocused('code')}
              onBlur={() => setFocused(null)}
              placeholder="Enter your company access code"
              placeholderTextColor={colors.textMuted}
              style={inputStyle('code')}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              textContentType="none"
            />
            <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 8 }}>
              Get this from your fleet administrator
            </Text>

            {error && (
              <View
                style={{
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(239,68,68,0.2)',
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 4,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: '#EF4444', fontSize: 13 }}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => void handleSignup()}
              disabled={loading}
              activeOpacity={0.82}
              style={{
                backgroundColor: '#3B82F6',
                borderRadius: 14,
                paddingVertical: 17,
                alignItems: 'center',
                marginTop: 16,
                opacity: loading ? 0.65 : 1,
                shadowColor: '#3B82F6',
                shadowRadius: 16,
                shadowOpacity: 0.35,
                elevation: 6,
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Create Account  →</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 22, gap: 4 }}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '700' }}>Sign in</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>Secured by 256-bit SSL</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
