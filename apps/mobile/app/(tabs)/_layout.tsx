import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/tokens';

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
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="progress" options={{ title: 'Body' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Diet' }} />
      <Tabs.Screen name="rank" options={{ title: 'Rank' }} />
      <Tabs.Screen name="insights" options={{ title: 'Stats' }} />
    </Tabs>
  );
}
