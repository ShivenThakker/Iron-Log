import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OBSIDIAN_COLORS } from '@/constants/tokens';
import { Icon } from '@/components/ui/Icon';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);
  const tabHeight = 54 + bottomPadding;

  return (
    <Tabs 
      detachInactiveScreens={true}
      screenOptions={{ 
        headerShown: false,
        lazy: true,
        animation: 'none',
        freezeOnBlur: true,
        tabBarStyle: {
          backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
          borderTopColor: OBSIDIAN_COLORS.borderGhost,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
        },
        tabBarActiveTintColor: OBSIDIAN_COLORS.voltLime,
        tabBarInactiveTintColor: OBSIDIAN_COLORS.textSlate,
        tabBarLabelStyle: {
          fontFamily: 'SpaceGrotesk_600SemiBold',
          fontSize: 10,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color, focused }) => (
            <Icon name="Barbell" size={22} color={color ? String(color) : undefined} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color, focused }) => (
            <Icon name="ForkKnife" size={22} color={color ? String(color) : undefined} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Rank',
          tabBarIcon: ({ color, focused }) => (
            <Icon name="Trophy" size={22} color={color ? String(color) : undefined} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="body"
        options={{
          title: 'Body',
          tabBarIcon: ({ color, focused }) => (
            <Icon name="Scales" size={22} color={color ? String(color) : undefined} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <Icon name="ChartLineUp" size={22} color={color ? String(color) : undefined} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
    </Tabs>
  );
}
