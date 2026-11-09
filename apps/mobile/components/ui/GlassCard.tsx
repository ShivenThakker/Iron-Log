import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  RADIUS,
  SPACING,
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_SHADOWS,
  SPRINGS,
} from '@/constants/tokens';

export type GlassCardVariant =
  | 'default'
  | 'elevated'
  | 'accent'
  | 'obsidianLevel1'
  | 'obsidianLevel2'
  | 'obsidianLevel3'
  | 'obsidianVolt';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  variant?: GlassCardVariant;
  activeOpacity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  activeOpacity = 0.88,
}) => {
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [opacityAnim] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.985,
        ...SPRINGS.snappy,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: activeOpacity,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...SPRINGS.snappy,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Ignore
      }
    }
    onPress?.();
  };

  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.cardElevated,
    variant === 'accent' && styles.cardAccent,
    variant === 'obsidianLevel1' && styles.obsidianLevel1,
    variant === 'obsidianLevel2' && styles.obsidianLevel2,
    variant === 'obsidianLevel3' && styles.obsidianLevel3,
    variant === 'obsidianVolt' && styles.obsidianVolt,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        unstable_pressDelay={0}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.08)' }}
      >
        <Animated.View
          style={[
            cardStyle,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: SPACING.md,
    overflow: 'hidden',
  },
  cardElevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  cardAccent: {
    backgroundColor: 'rgba(233, 69, 96, 0.08)',
    borderColor: 'rgba(233, 69, 96, 0.3)',
  },
  obsidianLevel1: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.md,
    ...OBSIDIAN_SHADOWS.cardLevel1,
  },
  obsidianLevel2: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderColor: OBSIDIAN_COLORS.borderElevated,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.md,
    ...OBSIDIAN_SHADOWS.cardLevel2,
  },
  obsidianLevel3: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderColor: OBSIDIAN_COLORS.borderElevated,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.md,
    ...OBSIDIAN_SHADOWS.cardLevel3,
  },
  obsidianVolt: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderColor: OBSIDIAN_COLORS.voltBorderActive,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.md,
    ...OBSIDIAN_SHADOWS.voltGlowSmall,
  },
});
