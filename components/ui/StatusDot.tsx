import React from 'react'
import { View } from 'react-native'
import { colors } from '@/constants/colors'

type Props = {
  status: 'ok' | 'warning' | 'danger' | 'neutral'
}

export default function StatusDot({ status }: Props) {
  const color =
    status === 'ok'
      ? colors.success
      : status === 'warning'
        ? colors.warning
        : status === 'danger'
          ? colors.danger
          : colors.textMuted

  return (
    <View
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: color,
      }}
    />
  )
}

