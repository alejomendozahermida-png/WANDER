import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useUserStore } from '../src/store/userStore';

export default function RootLayout() {
  const { isLoading } = useUserStore();

  // TODO: Check session on mount when Supabase is connected
  useEffect(() => {
    // Simulate session check for now
    setTimeout(() => {
      useUserStore.getState().setUser(null);
    }, 1000);
  }, []);

  if (isLoading) {
    return null; // Could show splash screen here
  }

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
