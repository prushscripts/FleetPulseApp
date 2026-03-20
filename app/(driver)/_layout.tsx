import { Stack } from 'expo-router'

export default function DriverLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0F1E' },
        animation: 'slide_from_right',
      }}
    />
  )
}
