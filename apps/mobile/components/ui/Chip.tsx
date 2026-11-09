import React, { useState } from 'react';
import {
  Pressable,
  Animated,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  COLORS,
  RADIUS,
  SPACING,
  OBSIDIAN_COLORS,
  SPRINGS,
} from '@/constants/tokens';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  icon?: React.ReactNode;
  variant?: 'default' | 'volt';
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
  icon,
  variant = 'default',
}) => {
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      ...SPRINGS.snappy,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...SPRINGS.snappy,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch {
        // Ignore
      }
    }
    onPress();
  };

  const isVolt = variant === 'volt';

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={{ marginRight: SPACING.sm }}
    >
      <Animated.View
        style={[
          styles.chip,
          selected
            ? isVolt
              ? styles.chipSelectedVolt
              : styles.chipSelected
            : styles.chipUnselected,
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        {icon}
        <Text
          variant="bodySmall"
          weight={selected ? 'semibold' : 'regular'}
          color={
            selected
              ? isVolt
                ? OBSIDIAN_COLORS.onPrimary
                : '#FFFFFF'
              : COLORS.dark.textSecondary
          }
          style={icon ? { marginLeft: SPACING.xs } : undefined}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: COLORS.dark.accentRed,
    borderColor: COLORS.dark.accentRed,
  },
  chipSelectedVolt: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    borderColor: OBSIDIAN_COLORS.voltLime,
  },
  chipUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

