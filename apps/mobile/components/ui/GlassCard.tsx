import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import {
  RADIUS,
  SPACING,
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_SHADOWS,
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
  activeOpacity = 0.8,
}) => {
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
        onPress={onPress}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.08)' }}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.82, transform: [{ scale: 0.99 }] },
        ]}
      >
        {children}
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
