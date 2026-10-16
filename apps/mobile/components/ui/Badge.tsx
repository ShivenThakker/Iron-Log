import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
import { Text } from './Text';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'gold'
  | 'cyan'
  | 'neutral'
  | 'danger'
  | 'red'
  | 'blue'
  | 'green'
  | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
      case 'green':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: COLORS.dark.success, border: 'rgba(34, 197, 94, 0.3)' };
      case 'gold':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: COLORS.dark.accentGold, border: 'rgba(245, 158, 11, 0.3)' };
      case 'cyan':
      case 'blue':
        return { bg: 'rgba(0, 188, 212, 0.15)', text: COLORS.dark.accentCyan, border: 'rgba(0, 188, 212, 0.3)' };
      case 'danger':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: COLORS.dark.destructive, border: 'rgba(239, 68, 68, 0.3)' };
      case 'neutral':
      case 'default':
        return { bg: 'rgba(255, 255, 255, 0.08)', text: COLORS.dark.textSecondary, border: 'rgba(255, 255, 255, 0.12)' };
      case 'red':
      case 'primary':
      default:
        return { bg: 'rgba(233, 69, 96, 0.15)', text: COLORS.dark.accentRed, border: 'rgba(233, 69, 96, 0.3)' };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingVertical: size === 'sm' ? 2 : 4,
          paddingHorizontal: size === 'sm' ? 6 : 10,
        },
        style,
      ]}
    >
      <Text
        variant="caption"
        color={colors.text}
        weight="semibold"
        style={[{ fontSize: size === 'sm' ? 10 : 11 }, textStyle]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
