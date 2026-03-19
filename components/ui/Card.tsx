import React from 'react'
import { View, type ViewStyle } from 'react-native'
import { colors } from '@/constants/colors'

type Props = {
  children: React.ReactNode
  style?: ViewStyle
  variant?: 'default' | 'elevated' | 'glass'
}

export default function Card({ children, style, variant = 'default' }: Props) {
  const variants: Record<NonNullable<Props['variant']>, ViewStyle> = {
    default: {
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderWidth: 1,
      borderColor: colors.borderDefault,
      borderRadius: 16,
    },
    elevated: {
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.borderDefault,
      borderRadius: 16,
    },
    glass: {
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      borderRadius: 16,
    },
  }

  return <View style={[variants[variant], style]}>{children}</View>
}

