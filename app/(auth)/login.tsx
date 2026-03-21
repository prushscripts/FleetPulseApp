import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import * as Haptics from 'expo-haptics'
import { colors } from '@/constants/colors'

const { width: W, height: H } = Dimensions.get('window')

const PARTICLE_DATA = Array.from({ length: 20 }, (_, i) => ({
  x: Math.random() * W,
  y: Math.random() * H,
  size: Math.random() * 3 + 1.2,
  phaseStart: i / 20,
  maxOpacity: Math.random() * 0.65 + 0.2,
}))

function ParticleField({ clock }: { clock: Animated.Value }) {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {PARTICLE_DATA.map((p, i) => {
        const opacity = clock.interpolate({
          inputRange: [0, p.phaseStart, Math.min(p.phaseStart + 0.25, 1), 1],
          outputRange: [p.maxOpacity * 0.2, p.maxOpacity, p.maxOpacity * 0.15, p.maxOpacity * 0.2],
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

type Phase = 'enter' | 'scanning' | 'ready'

function LoginTransitionOverlay({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('enter')
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const overlayOpacity = useRef(new Animated.Value(1)).current
  const progressAnim = useRef(new Animated.Value(0)).current
  const dotScale = useRef(new Animated.Value(1)).current

  const r1Scale = useRef(new Animated.Value(0.02)).current
  const r1Op = useRef(new Animated.Value(0.7)).current
  const r2Scale = useRef(new Animated.Value(0.02)).current
  const r2Op = useRef(new Animated.Value(0.7)).current
  const r3Scale = useRef(new Animated.Value(0.02)).current
  const r3Op = useRef(new Animated.Value(0.7)).current

  const RING_TARGET = Math.max(W, H) * 2
  const MINI_PROGRESS_W = 160

  useEffect(() => {
    const animRing = (scale: Animated.Value, o: Animated.Value, delay: number) => {
      const loop = () => {
        scale.setValue(0.02)
        o.setValue(0.6)
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 2500,
            delay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(o, {
            toValue: 0,
            duration: 2500,
            delay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(loop)
      }
      loop()
    }
    animRing(r1Scale, r1Op, 0)
    animRing(r2Scale, r2Op, 350)
    animRing(r3Scale, r3Op, 700)

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, {
          toValue: 1.8,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start()

    const t1 = setTimeout(() => setPhase('scanning'), 700)
    const t2 = setTimeout(() => setPhase('ready'), 1900)

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2400,
      delay: 100,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start()

    const exitTimer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => onCompleteRef.current())
    }, 2750)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(exitTimer)
    }
  }, [])

  const statusText =
    phase === 'enter' ? 'AUTHENTICATING' : phase === 'scanning' ? 'LOADING FLEET' : '✓  READY'
  const statusColor = phase === 'ready' ? '#10B981' : '#3B82F6'

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: '#050A14',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          opacity: overlayOpacity,
        },
      ]}
    >
      <View style={[StyleSheet.absoluteFillObject, { opacity: 0.03 }]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: i * 70,
              height: 1,
              backgroundColor: '#3B82F6',
            }}
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: i * 50,
              width: 1,
              backgroundColor: '#3B82F6',
            }}
          />
        ))}
      </View>

      {[
        { scale: r1Scale, o: r1Op },
        { scale: r2Scale, o: r2Op },
        { scale: r3Scale, o: r3Op },
      ].map((r, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: RING_TARGET,
            height: RING_TARGET,
            marginLeft: -RING_TARGET / 2,
            marginTop: -RING_TARGET / 2,
            borderRadius: RING_TARGET / 2,
            borderWidth: 1,
            borderColor: 'rgba(59,130,246,0.3)',
            opacity: r.o,
            transform: [{ scale: r.scale }],
          }}
        />
      ))}

      <Animated.View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: phase === 'ready' ? '#10B981' : '#3B82F6',
          transform: [{ scale: dotScale }],
          shadowColor: phase === 'ready' ? '#10B981' : '#3B82F6',
          shadowRadius: 18,
          shadowOpacity: 0.9,
          elevation: 8,
          zIndex: 10,
        }}
      />

      <View style={{ position: 'absolute', top: '57%', alignItems: 'center', gap: 10 }}>
        <Text style={{ color: 'white', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>FleetPulse</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
          <Text
            style={{
              color: statusColor,
              fontSize: 10,
              letterSpacing: 2.5,
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            {statusText}
          </Text>
        </View>
        <View
          style={{
            width: MINI_PROGRESS_W,
            height: 1.5,
            backgroundColor: 'rgba(255,255,255,0.07)',
            borderRadius: 1,
            overflow: 'hidden',
            marginTop: 4,
          }}
        >
          <Animated.View
            style={{
              width: MINI_PROGRESS_W,
              height: 1.5,
              backgroundColor: statusColor,
              transform: [
                { translateX: -80 },
                { scaleX: progressAnim },
                { translateX: 80 },
              ],
            }}
          />
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: 'rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            width: W,
            backgroundColor: '#3B82F6',
            transform: [
              { translateX: -(W / 2) },
              { scaleX: progressAnim },
              { translateX: W / 2 },
            ],
          }}
        />
      </View>
    </Animated.View>
  )
}

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [pendingRoute, setPendingRoute] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

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

  const handleLogin = async () => {
    Keyboard.dismiss()
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setLoading(true)
    setError(null)
    setSubmitted(true)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (authError) throw authError

      let role = data.user?.user_metadata?.role as string | undefined
      if (!role && data.user?.id) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
        role = (p as { role?: string } | null)?.role ?? undefined
      }
      const route = role === 'driver' ? '/(driver)' : '/(manager)'

      setPendingRoute(route)
      setShowTransition(true)
      setLoading(false)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err: unknown) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      const message = err instanceof Error ? err.message : 'Sign in failed. Check your credentials.'
      setError(message)
      setLoading(false)
    }
  }

  const inputStyle = (focused: boolean) => ({
    backgroundColor: focused ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: focused ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.09)',
    borderRadius: 14,
    color: '#F8FAFC' as const,
    fontSize: 15,
    paddingVertical: 15,
    paddingHorizontal: 16,
  })

  const onTransitionComplete = () => {
    if (pendingRoute) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace(pendingRoute as any)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, overflow: 'hidden' }}>
      <StatusBar barStyle="light-content" />

      <ParticleField clock={particleClock} />

      <View
        style={{
          position: 'absolute',
          top: H * 0.25,
          alignSelf: 'center',
          width: W * 0.7,
          height: W * 0.7,
          borderRadius: W * 0.35,
          backgroundColor: 'rgba(59,130,246,0.05)',
          shadowColor: '#3B82F6',
          shadowRadius: 60,
          shadowOpacity: 0.25,
          zIndex: -1,
        }}
        pointerEvents="none"
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingBottom: 48,
            paddingTop: 48,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: 44 }}>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 36,
                fontWeight: '800',
                letterSpacing: -0.8,
                marginBottom: 6,
              }}
            >
              FleetPulse
            </Text>
            <View style={{ width: 36, height: 2.5, backgroundColor: '#3B82F6', borderRadius: 2, marginBottom: 10 }} />
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Sign in to your fleet dashboard</Text>
          </View>

          {!submitted && (
            <>
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.025)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  borderRadius: 22,
                  padding: 22,
                }}
              >
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 1.2,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@company.com"
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle(emailFocused)}
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                />

                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 1.2,
                    marginBottom: 8,
                    marginTop: 14,
                    textTransform: 'uppercase',
                  }}
                >
                  Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    style={[inputStyle(passwordFocused), { paddingRight: 56 }]}
                    autoComplete="off"
                    autoCorrect={false}
                    spellCheck={false}
                    textContentType="password"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 16, top: 15 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {error && (
                  <View
                    style={{
                      backgroundColor: 'rgba(239,68,68,0.08)',
                      borderWidth: 1,
                      borderColor: 'rgba(239,68,68,0.2)',
                      borderRadius: 12,
                      padding: 12,
                      marginTop: 12,
                    }}
                  >
                    <Text style={{ color: '#EF4444', fontSize: 13 }}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => void handleLogin()}
                  disabled={loading}
                  activeOpacity={0.82}
                  style={{
                    backgroundColor: '#3B82F6',
                    borderRadius: 14,
                    paddingVertical: 17,
                    alignItems: 'center',
                    marginTop: 18,
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
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Sign In  →</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 22, gap: 4 }}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>New to FleetPulse?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                  <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '700' }}>Create account</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {submitted && !showTransition ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <ActivityIndicator color={colors.accent} size="large" />
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>Secured by 256-bit SSL</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showTransition && pendingRoute && <LoginTransitionOverlay onComplete={onTransitionComplete} />}
    </View>
  )
}
