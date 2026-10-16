import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '@/constants/tokens';

export default function RootLayout() {
  const { isAuthenticated, isHydrated, init } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && segments[0] === '(tabs)') {
      router.replace('/');
    } else if (isAuthenticated && (inAuthGroup || segments[0] === '' || !segments[0])) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isHydrated, segments]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.dark.bgPrimary }}>
        <ActivityIndicator size="large" color={COLORS.dark.accentRed} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.dark.bgPrimary } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" options={{ presentation: 'modal' }} />
      <Stack.Screen name="register" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
