import React from 'react'
import { View, Text, type ViewStyle } from 'react-native'

type Props = {
  label: string
  variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
  style?: ViewStyle
}

export default function Badge({ label, variant, style }: Props) {
  const variants = {
    success: { bg: 'rgba(16,185,129,0.1)', text: '#10B981' },
    warning: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B' },
    danger: { bg: 'rgba(239,68,68,0.1)', text: '#EF4444' },
    neutral: { bg: 'rgba(100,116,139,0.1)', text: '#94A3B8' },
    info: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6' },
  } as const

  return (
    <View
      style={[
        {
          backgroundColor: variants[variant].bg,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
        },
        style,
      ]}
    >
      <Text style={{ color: variants[variant].text, fontSize: 11, fontWeight: '600' }}>{label}</Text>
    </View>
  )
}

