import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import { colors } from '@/constants/colors'
import * as Haptics from 'expo-haptics'

type Props = {
  label: string
  onPress: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  textStyle,
  size = 'md',
}: Props) {
  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const baseStyle: ViewStyle = {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
    paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 24 : 16,
    opacity: disabled ? 0.5 : 1,
  }

  const variants: Record<NonNullable<Props['variant']>, ViewStyle> = {
    primary: { backgroundColor: colors.accent },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.borderDefault,
    },
    danger: {
      backgroundColor: 'rgba(239,68,68,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.3)',
    },
  }

  const textColors: Record<NonNullable<Props['variant']>, string> = {
    primary: '#FFFFFF',
    ghost: colors.textSecondary,
    danger: colors.danger,
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[baseStyle, variants[variant], style]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} size="small" />
      ) : (
        <Text
          style={[
            {
              color: textColors[variant],
              fontSize: size === 'sm' ? 13 : 15,
              fontWeight: '600',
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}

