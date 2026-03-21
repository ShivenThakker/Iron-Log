import { Stack } from 'expo-router';
import { COLORS } from '../../constants/tokens';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.dark.bgPrimary } }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
