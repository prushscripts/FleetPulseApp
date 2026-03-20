import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { colors } from '@/constants/colors'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { Link } from 'expo-router'

const { width, height } = Dimensions.get('window')

type TransitionPhase = 'enter' | 'scanning' | 'ready' | 'exit'

function LoginTransitionOverlay({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<TransitionPhase>('enter')

  const rings = useRef(
    [0, 0.3, 0.6].map(() => ({
      scale: new Animated.Value(0.1),
      opacity: new Animated.Value(0.8),
    })),
  ).current

  const progressAnim = useRef(new Animated.Value(0)).current
  const overlayOpacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const animateRings = () => {
      rings.forEach((ring, i) => {
        const delay = i * 300
        const loopRing = () => {
          ring.scale.setValue(0.05)
          ring.opacity.setValue(0.6)
          Animated.parallel([
            Animated.timing(ring.scale, {
              toValue: 1,
              duration: 2500,
              delay,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(ring.opacity, {
              toValue: 0,
              duration: 2500,
              delay,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]).start(loopRing)
        }
        loopRing()
      })
    }
    animateRings()

    const t1 = setTimeout(() => setPhase('scanning'), 600)
    const t2 = setTimeout(() => setPhase('ready'), 1800)
    const t3 = setTimeout(() => setPhase('exit'), 2600)

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2400,
      delay: 100,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start()

    const exitTimer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(onComplete)
    }, 2700)

    return () => {
      ;[t1, t2, t3].forEach((t) => clearTimeout(t))
      clearTimeout(exitTimer)
    }
  }, [])

  const RING_SIZE = Math.max(width, height) * 2

  const statusLabel =
    phase === 'enter' ? 'AUTHENTICATING' : phase === 'scanning' ? 'LOADING FLEET' : 'READY'

  const statusColor = phase === 'ready' ? 'rgba(16,185,129,0.9)' : 'rgba(59,130,246,0.7)'

  return (
    <Animated.View
      style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#050A14',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: overlayOpacity,
      }}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04, overflow: 'hidden' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: i * 60,
              height: 1,
              backgroundColor: '#3B82F6',
            }}
          />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: i * 60,
              width: 1,
              backgroundColor: '#3B82F6',
            }}
          />
        ))}
      </View>

      {rings.map((ring, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: RING_SIZE,
            height: RING_SIZE,
            borderRadius: RING_SIZE / 2,
            borderWidth: 1,
            borderColor: 'rgba(59,130,246,0.25)',
            transform: [{ scale: ring.scale }],
            opacity: ring.opacity,
          }}
        />
      ))}

      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: phase === 'ready' ? '#10B981' : '#3B82F6',
          shadowColor: phase === 'ready' ? '#10B981' : '#3B82F6',
          shadowRadius: 20,
          shadowOpacity: 0.8,
          elevation: 10,
          position: 'absolute',
        }}
      />

      <View style={{ position: 'absolute', top: '56%', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>FleetPulse</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: statusColor,
            }}
          />
          <Text
            style={{
              color: statusColor,
              fontSize: 10,
              letterSpacing: 2.5,
              fontWeight: '600',
              textTransform: 'uppercase',
            }}
          >
            {statusLabel}
          </Text>
        </View>

        <View
          style={{
            width: 180,
            height: 1.5,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 1,
            overflow: 'hidden',
            marginTop: 4,
          }}
        >
          <Animated.View
            style={{
              height: '100%',
              backgroundColor: phase === 'ready' ? '#10B981' : '#3B82F6',
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
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
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: '#3B82F6',
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </Animated.View>
  )
}

function ParticleBackground() {
  const { width: W, height: H } = Dimensions.get('window')

  const particles = useRef(
    Array.from({ length: 15 }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2.5 + 0.8,
      baseOpacity: Math.random() * 0.4 + 0.1,
      phase: Math.random() * Math.PI * 2,
    })),
  ).current

  const clock = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(clock, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start()
  }, [])

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: W,
        height: H,
      }}
      pointerEvents="none"
    >
      {particles.map((p, i) => {
        const opacity = clock.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [
            p.baseOpacity,
            p.baseOpacity * 0.3,
            p.baseOpacity * 0.8,
            p.baseOpacity * 0.2,
            p.baseOpacity,
          ],
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

const inputBase = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: 'white' as const,
  padding: 16,
  fontSize: 15,
  marginBottom: 12,
}

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTransition, setShowTransition] = useState(false)
  const [pendingRoute, setPendingRoute] = useState<string | null>(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      let role = data.user?.user_metadata?.role as string | undefined
      if (!role && data.user?.id) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
        role = (p as { role?: string } | null)?.role ?? undefined
      }
      const route = role === 'driver' ? '/(driver)' : '/(manager)'
      setPendingRoute(route)
      setShowTransition(true)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bgBase }}
    >
      <View style={{ flex: 1, backgroundColor: colors.bgBase, overflow: 'hidden', position: 'relative' }}>
        <ParticleBackground />
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: '800' }}>FleetPulse</Text>
            <View
              style={{
                width: 48,
                height: 3,
                backgroundColor: colors.accent,
                borderRadius: 2,
                marginTop: 10,
              }}
            />
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 6 }}>
            Welcome back
          </Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 22, fontSize: 15 }}>
            Sign in to your fleet dashboard
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            style={inputBase}
            autoComplete="email"
            autoCorrect={false}
            spellCheck={false}
            textContentType="emailAddress"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            style={inputBase}
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            textContentType="password"
          />
          <Pressable onPress={() => setShowPw((s) => !s)} style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.accent, fontSize: 13 }}>{showPw ? 'Hide' : 'Show'} password</Text>
          </Pressable>

          {error ? (
            <Text style={{ color: colors.danger, fontSize: 13, marginBottom: 12 }}>{error}</Text>
          ) : null}

          <Button label="Sign in" onPress={() => void handleLogin()} loading={loading} />

          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 20, textAlign: 'center' }}>
            New to FleetPulse?{' '}
            <Link href="/(auth)/signup" style={{ color: colors.accent, fontWeight: '600' }}>
              Create an account
            </Link>
          </Text>
        </ScrollView>
        {showTransition && pendingRoute && (
          <LoginTransitionOverlay
            onComplete={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              router.replace(pendingRoute as any)
            }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  )
}
