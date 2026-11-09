import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Animated,
} from 'react-native';
import {
  COLORS,
  RADIUS,
  SPACING,
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
} from '@/constants/tokens';
import { Text } from './Text';
import { Icon } from './Icon';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'obsidian';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  isPassword = false,
  containerStyle,
  style,
  variant = 'default',
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(!isPassword);
  const [isFocused, setIsFocused] = useState(false);
  const isObsidian = variant === 'obsidian';
  const [focusAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  const defaultBorder = isObsidian
    ? OBSIDIAN_COLORS.borderGhost
    : 'rgba(255, 255, 255, 0.08)';
  const activeBorder = isObsidian
    ? OBSIDIAN_COLORS.voltLime
    : COLORS.dark.accentRed;

  const defaultBg = isObsidian
    ? OBSIDIAN_COLORS.surfaceContainerLow
    : COLORS.dark.bgInput;
  const activeBg = isObsidian
    ? OBSIDIAN_COLORS.surfaceContainer
    : 'rgba(42, 45, 80, 0.9)';

  const animatedBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [defaultBorder, activeBorder],
  });

  const animatedBgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [defaultBg, activeBg],
  });

  const isNumeric =
    rest.keyboardType === 'numeric' ||
    rest.keyboardType === 'decimal-pad' ||
    rest.keyboardType === 'number-pad';

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text
          variant={isObsidian ? 'labelCaps' : 'caption'}
          color={isObsidian ? OBSIDIAN_COLORS.textMuted : COLORS.dark.textSecondary}
          style={styles.label}
        >
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[
          styles.inputContainer,
          isObsidian && styles.inputContainerObsidian,
          {
            borderColor: error
              ? isObsidian
                ? OBSIDIAN_COLORS.coralAccent
                : COLORS.dark.destructive
              : animatedBorderColor,
            backgroundColor: animatedBgColor,
          },
        ]}
      >
        {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}

        <TextInput
          style={[
            styles.input,
            isObsidian && styles.inputObsidian,
            isNumeric && { fontVariant: ['tabular-nums'] },
            style,
          ]}
          placeholderTextColor={isObsidian ? OBSIDIAN_COLORS.textSlate : '#64748B'}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={isObsidian ? OBSIDIAN_COLORS.voltLime : COLORS.dark.accentRed}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name={showPassword ? 'EyeSlash' : 'Eye'}
              size={20}
              color={isObsidian ? OBSIDIAN_COLORS.textMuted : COLORS.dark.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </Animated.View>

      {error ? (
        <Text
          variant="bodySmall"
          color={isObsidian ? OBSIDIAN_COLORS.coralAccent : COLORS.dark.destructive}
          style={styles.errorText}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.bgInput,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  inputContainerObsidian: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    borderRadius: OBSIDIAN_RADIUS.lg,
  },
  inputFocused: {
    borderColor: COLORS.dark.accentRed,
    backgroundColor: 'rgba(42, 45, 80, 0.9)',
  },
  inputFocusedObsidian: {
    borderColor: OBSIDIAN_COLORS.voltLime,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
  },
  inputError: {
    borderColor: COLORS.dark.destructive,
  },
  inputErrorObsidian: {
    borderColor: OBSIDIAN_COLORS.coralAccent,
  },
  leftIconContainer: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.dark.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  inputObsidian: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  errorText: {
    marginTop: 4,
  },
});
