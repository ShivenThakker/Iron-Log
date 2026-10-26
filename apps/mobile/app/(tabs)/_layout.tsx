import React from 'react';
import { Tabs } from 'expo-router';
import { OBSIDIAN_COLORS } from '@/constants/tokens';
import { Icon } from '@/components/ui/Icon';

export default function TabLayout() {
  return (
    <Tabs 
      detachInactiveScreens={false}
      screenOptions={{ 
        headerShown: false,
        lazy: false,
        animation: 'none',
        freezeOnBlur: false,
        tabBarStyle: {
          backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
          borderTopColor: OBSIDIAN_COLORS.borderGhost,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
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
