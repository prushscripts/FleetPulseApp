import { useEffect, useMemo, useRef } from 'react'
import { Animated, Dimensions, StyleSheet, View } from 'react-native'

const { width: W, height: H } = Dimensions.get('window')

/** Subtle animated dots for login/signup (Phase 2). */
export default function ParticleBackground() {
  const dots = useMemo(
    () =>
      Array.from({ length: 28 }, () => ({
        left: Math.random() * W,
        top: Math.random() * H,
        size: 2 + Math.random() * 2,
      })),
    [],
  )

  const anims = useRef(dots.map(() => new Animated.Value(0.25 + Math.random() * 0.35))).current

  useEffect(() => {
    const loops = anims.map((a) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(a, {
            toValue: 0.85,
            duration: 2000 + Math.random() * 1500,
            useNativeDriver: true,
          }),
          Animated.timing(a, {
            toValue: 0.2,
            duration: 2000 + Math.random() * 1500,
            useNativeDriver: true,
          }),
        ]),
      ),
    )
    loops.forEach((l) => l.start())
    return () => loops.forEach((l) => l.stop())
  }, [anims])

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            borderRadius: d.size,
            backgroundColor: '#fff',
            opacity: anims[i],
          }}
        />
      ))}
    </View>
  )
}
