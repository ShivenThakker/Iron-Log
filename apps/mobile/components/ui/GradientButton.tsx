import React, { useState } from 'react';
import {
  Pressable,
  Animated,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  COLORS,
  RADIUS,
  SPACING,
  OBSIDIAN_COLORS,
  OBSIDIAN_SHADOWS,
  SPRINGS,
  MOTION_TOKENS,
} from '@/constants/tokens';
import { Text } from './Text';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'volt'
  | 'voltSecondary'
  | 'voltGhost';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  debounceMs?: number;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  icon,
  debounceMs = 500,
}) => {
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const lastPressRef = React.useRef(0);

  const handlePressIn = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } catch {}
    }
    Animated.spring(scaleAnim, {
      toValue: MOTION_TOKENS.scale.press,
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
    if (disabled || loading) return;
    const now = Date.now();
    if (now - lastPressRef.current < debounceMs) return;
    lastPressRef.current = now;
    onPress();
  };

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const getTextColor = () => {
    if (disabled) return COLORS.dark.textSecondary;
    if (variant === 'volt') return OBSIDIAN_COLORS.onPrimary;
    if (variant === 'voltSecondary') return OBSIDIAN_COLORS.textWhite;
    if (variant === 'voltGhost') return OBSIDIAN_COLORS.voltLime;
    if (variant === 'outline') return COLORS.dark.accentRed;
    if (variant === 'secondary') return COLORS.dark.textPrimary;
    return '#FFFFFF';
  };

  const isVoltFamily = variant === 'volt' || variant === 'voltSecondary' || variant === 'voltGhost';

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, (disabled || loading) && { opacity: 0.5 }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        unstable_pressDelay={0}
        hitSlop={size === 'sm' ? { top: 8, bottom: 8, left: 8, right: 8 } : undefined}
        android_ripple={{
          color: variant === 'volt' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)',
          borderless: false,
        }}
        style={buttonStyles}
      >
        {loading ? (
          <Animated.View style={styles.loadingRow}>
            <ActivityIndicator color={getTextColor()} size="small" style={{ marginRight: SPACING.xs }} />
            <Text
              variant={size === 'sm' ? 'bodySmall' : 'body'}
              weight="semibold"
              color={getTextColor()}
              style={[
                styles.text,
                isVoltFamily && styles.voltText,
                textStyle,
                { opacity: 0.85 },
              ]}
            >
              {title}
            </Text>
          </Animated.View>
        ) : (
          <>
            {icon}
            <Text
              variant={size === 'sm' ? 'bodySmall' : 'body'}
              weight="semibold"
              color={getTextColor()}
              style={[
                styles.text,
                isVoltFamily && styles.voltText,
                icon ? { marginLeft: SPACING.sm } : undefined,
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  primary: {
    backgroundColor: COLORS.dark.accentRed,
    shadowColor: COLORS.dark.accentRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: COLORS.dark.bgSecondary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.dark.accentRed,
  },
  danger: {
    backgroundColor: COLORS.dark.destructive,
  },
  volt: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    ...OBSIDIAN_SHADOWS.voltGlowSmall,
  },
  voltSecondary: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderElevated,
  },
  voltGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  disabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  size_sm: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
  },
  size_md: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
  },
  size_lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
  },
  text: {
    textAlign: 'center',
  },
  voltText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
