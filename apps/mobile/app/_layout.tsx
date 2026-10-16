import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { COLORS } from '@/constants/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_500Medium,
  });

  const { isAuthenticated, isHydrated, init } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (fontsLoaded && isHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !fontsLoaded) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && segments[0] === '(tabs)') {
      router.replace('/');
    } else if (isAuthenticated && (inAuthGroup || !segments[0])) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isHydrated, fontsLoaded, segments]);

  if (!isHydrated || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.dark.bgPrimary }}>
        <ActivityIndicator size="large" color={COLORS.dark.accentRed} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.dark.bgPrimary } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="register" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout/active" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="workout/summary" options={{ presentation: 'card' }} />
        <Stack.Screen name="program/builder" options={{ presentation: 'card' }} />
        <Stack.Screen name="ai/chat" options={{ presentation: 'card' }} />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
      </Stack>
    </QueryClientProvider>
  );
}
