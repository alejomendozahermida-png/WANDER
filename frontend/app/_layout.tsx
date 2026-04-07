import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useUserStore } from '../src/store/userStore';

export default function RootLayout() {
  const { checkSession } = useUserStore();

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0D0D0D' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="results" />
      <Stack.Screen name="detail/[id]" />
      <Stack.Screen name="booking/[id]" />
    </Stack>
  );
}
