import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/tokens';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.dark.bgSecondary, borderTopColor: COLORS.dark.bgInput },
        tabBarActiveTintColor: COLORS.dark.accentRed,
        tabBarInactiveTintColor: COLORS.dark.textSecondary
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Workout' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
      <Tabs.Screen name="achievements" options={{ title: 'Achievements' }} />
      <Tabs.Screen name="body" options={{ title: 'Body' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
    </Tabs>
  );
}
