import { useEffect, useRef } from 'react'
import { Animated, type ViewStyle } from 'react-native'

type Props = {
  width: number | string
  height: number
  borderRadius?: number
  style?: ViewStyle
}

export default function Skeleton({ width, height, borderRadius = 6, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: 'rgba(255,255,255,0.08)',
          opacity,
        },
        style,
      ]}
    />
  )
}

