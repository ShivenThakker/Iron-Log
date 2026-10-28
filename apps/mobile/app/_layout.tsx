import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationBar } from 'expo-navigation-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { COLORS } from '@/constants/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
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
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const { isAuthenticated, isHydrated, init } = useAuthStore();
  const segments = useSegments();
  const rootSegment = segments[0];
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

    const inAuthGroup = rootSegment === 'login' || rootSegment === 'register';

    if (!isAuthenticated && rootSegment === '(tabs)') {
      router.replace('/');
    } else if (isAuthenticated && (inAuthGroup || !rootSegment)) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isHydrated, fontsLoaded, rootSegment]);

  if (!isHydrated || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.dark.bgPrimary }}>
        <ActivityIndicator size="large" color={COLORS.dark.accentRed} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {Platform.OS === 'android' ? <NavigationBar hidden={true} style="dark" /> : null}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.dark.bgPrimary },
          animation: 'slide_from_right',
          animationDuration: 220,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ presentation: 'modal', animation: 'fade_from_bottom' }} />
        <Stack.Screen name="register" options={{ presentation: 'modal', animation: 'fade_from_bottom' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout/active" options={{ presentation: 'card', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="workout/import" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="workout/summary" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="program/builder" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="ai/chat" options={{ presentation: 'card', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="settings" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>
    </QueryClientProvider>
  );
}
