import { useEffect, useRef } from 'react'
import {
  View,
  Text,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  StyleSheet,
} from 'react-native'

const { width: W, height: H } = Dimensions.get('window')
const RING_SIZE = Math.max(W, H) * 2.4

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const scales = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current
  const opacities = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current

  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoY = useRef(new Animated.Value(14)).current
  const dotScale = useRef(new Animated.Value(1)).current
  const statusOpacity = useRef(new Animated.Value(0)).current
  const progressScaleX = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animateRing = (index: number) => {
      const delay = index * 350
      const loop = () => {
        scales[index].setValue(0.02)
        opacities[index].setValue(0.65 - index * 0.12)
        Animated.parallel([
          Animated.timing(scales[index], {
            toValue: 1,
            duration: 2200,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacities[index], {
            toValue: 0,
            duration: 2200,
            delay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (index === 0) setTimeout(loop, 150)
        })
      }
      loop()
    }

    animateRing(0)
    animateRing(1)
    animateRing(2)
    animateRing(3)

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        delay: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoY, {
        toValue: 0,
        duration: 500,
        delay: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, {
          toValue: 1.7,
          duration: 750,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotScale, {
          toValue: 1,
          duration: 750,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start()

    Animated.timing(statusOpacity, {
      toValue: 1,
      duration: 400,
      delay: 500,
      useNativeDriver: true,
    }).start()

    Animated.timing(progressScaleX, {
      toValue: 1,
      duration: 2500,
      delay: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start()

    const timer = setTimeout(onComplete, 2900)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />

      <View style={styles.glow} />

      {scales.map((scale, i) => (
        <Animated.View
          key={i}
          style={[
            styles.ring,
            {
              opacity: opacities[i],
              transform: [{ scale }],
              borderWidth: i === 0 ? 1.5 : 1,
            },
          ]}
        />
      ))}

      <Animated.View style={[styles.dot, { transform: [{ scale: dotScale }] }]} />

      <Animated.View
        style={[
          styles.logoBlock,
          {
            opacity: logoOpacity,
            transform: [{ translateY: logoY }],
          },
        ]}
      >
        <Text style={styles.logoText}>FleetPulse</Text>
        <View style={styles.logoDivider} />
        <Text style={styles.logoSubtitle}>FLEET MANAGEMENT SYSTEM</Text>
      </Animated.View>

      <Animated.View style={[styles.statusWrap, { opacity: statusOpacity }]}>
        <Text style={styles.statusText}>INITIALIZING SYSTEMS...</Text>
      </Animated.View>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              transform: [
                { translateX: -W / 2 },
                { scaleX: progressScaleX },
                { translateX: W / 2 },
              ],
            },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050A14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(59,130,246,0.06)',
    shadowColor: '#3B82F6',
    shadowRadius: 80,
    shadowOpacity: 0.5,
    elevation: 0,
  },
  ring: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: RING_SIZE,
    height: RING_SIZE,
    marginLeft: -RING_SIZE / 2,
    marginTop: -RING_SIZE / 2,
    borderRadius: RING_SIZE / 2,
    borderColor: 'rgba(59,130,246,0.55)',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowRadius: 18,
    shadowOpacity: 0.9,
    elevation: 8,
    zIndex: 10,
  },
  logoBlock: {
    position: 'absolute',
    top: '54%',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(59,130,246,0.8)',
    borderRadius: 1,
  },
  logoSubtitle: {
    color: 'rgba(148,163,184,0.65)',
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statusWrap: {
    position: 'absolute',
    bottom: 72,
    alignItems: 'center',
  },
  statusText: {
    color: 'rgba(59,130,246,0.55)',
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 1,
  },
})
