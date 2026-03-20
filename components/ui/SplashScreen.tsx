import { useEffect, useRef } from 'react'
import {
  View,
  Text,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native'
import { colors } from '@/constants/colors'

const { width, height } = Dimensions.get('window')
const NUM_RINGS = 5

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const rings = useRef(
    Array.from({ length: NUM_RINGS }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0.8),
    })),
  ).current

  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoY = useRef(new Animated.Value(20)).current
  const dotScale = useRef(new Animated.Value(1)).current
  const dotOpacity = useRef(new Animated.Value(1)).current
  const progressWidth = useRef(new Animated.Value(0)).current
  const statusOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    rings.forEach((ring, i) => {
      const delay = i * 300
      const loop = () => {
        Animated.parallel([
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(ring.scale, {
              toValue: 0.04,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(ring.scale, {
              toValue: 1,
              duration: 2200,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(ring.opacity, {
              toValue: 0.7,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(ring.opacity, {
              toValue: 0,
              duration: 2200,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          if (i === 0) setTimeout(loop, 200)
        })
      }
      loop()
    })

    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoY, {
        toValue: 0,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start()

    // Center dot pulse loop
    const pulseDot = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dotScale, {
            toValue: 1.8,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 0.3,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dotScale, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ]).start(pulseDot)
    }
    pulseDot()

    // Progress bar
    Animated.timing(progressWidth, {
      toValue: width,
      duration: 2400,
      delay: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start()

    // Status text fade in
    Animated.timing(statusOpacity, {
      toValue: 1,
      duration: 400,
      delay: 500,
      useNativeDriver: true,
    }).start()

    // Complete after 2.8s
    const timer = setTimeout(onComplete, 2800)
    return () => clearTimeout(timer)
  }, [])

  const RING_FINAL_SIZE = Math.max(width, height) * 1.6

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#050A14',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />

      {/* Radial glow */}
      <View
        style={{
          position: 'absolute',
          width: width * 1.2,
          height: width * 1.2,
          borderRadius: width * 0.6,
          backgroundColor: 'rgba(59,130,246,0.06)',
          top: '50%',
          left: '50%',
          marginLeft: -(width * 0.6),
          marginTop: -(width * 0.6),
        }}
      />

      {/* Expanding rings — base size is final expanded size; scale animates 0.04 → 1 */}
      {rings.map((ring, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: RING_FINAL_SIZE,
            height: RING_FINAL_SIZE,
            borderRadius: RING_FINAL_SIZE / 2,
            borderWidth: i === 0 ? 1.5 : 1,
            borderColor: `rgba(59,130,246,${Math.max(0.1, 0.65 - i * 0.12)})`,
            transform: [{ scale: ring.scale }],
            opacity: ring.opacity,
          }}
        />
      ))}

      {/* Glowing center dot */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: '#3B82F6',
          transform: [{ scale: dotScale }],
          opacity: dotOpacity,
          shadowColor: '#3B82F6',
          shadowRadius: 20,
          shadowOpacity: 0.8,
          elevation: 10,
        }}
      />

      {/* Logo + text block */}
      <Animated.View
        style={{
          position: 'absolute',
          top: '50%',
          marginTop: 30,
          alignItems: 'center',
          gap: 10,
          opacity: logoOpacity,
          transform: [{ translateY: logoY }],
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 34,
            fontWeight: '800',
            letterSpacing: -0.5,
          }}
        >
          FleetPulse
        </Text>
        <View
          style={{
            width: 48,
            height: 2,
            backgroundColor: 'rgba(59,130,246,0.8)',
            borderRadius: 1,
          }}
        />
        <Text
          style={{
            color: 'rgba(148,163,184,0.7)',
            fontSize: 11,
            letterSpacing: 3,
            textTransform: 'uppercase',
            fontWeight: '500',
          }}
        >
          Fleet Management System
        </Text>
      </Animated.View>

      {/* Status text */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 80,
          alignItems: 'center',
          opacity: statusOpacity,
        }}
      >
        <Text
          style={{
            color: 'rgba(59,130,246,0.6)',
            fontSize: 10,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: '600',
          }}
        >
          Initializing systems...
        </Text>
      </Animated.View>

      {/* Progress bar at bottom */}
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
            width: progressWidth,
            backgroundColor: colors.accent,
            borderRadius: 1,
          }}
        />
      </View>
    </View>
  )
}
