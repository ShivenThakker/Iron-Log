import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { COLORS, OBSIDIAN_COLORS, OBSIDIAN_TYPOGRAPHY } from '@/constants/tokens';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'mono'
  | 'heroStat'
  | 'xp'
  | 'displayHero'
  | 'displayHeroMobile'
  | 'headlineLg'
  | 'headlineLgMobile'
  | 'headlineMd'
  | 'headlineSm'
  | 'metricNumeral'
  | 'labelCaps'
  | 'labelInteractive'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodySm'
  | 'bodySmMedium';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color,
  weight,
  align,
  style,
  children,
  ...rest
}) => {
  const variantStyle = styles[variant] || styles.body;

  const dynamicStyle: TextStyle = {
    ...(color ? { color } : {}),
    ...(align ? { textAlign: align } : {}),
  };

  if (weight) {
    if (weight === 'regular') dynamicStyle.fontFamily = 'Inter_400Regular';
    if (weight === 'medium') dynamicStyle.fontFamily = 'Inter_500Medium';
    if (weight === 'semibold') dynamicStyle.fontFamily = 'Inter_600SemiBold';
    if (weight === 'bold') dynamicStyle.fontFamily = 'Inter_700Bold';
  }

  return (
    <RNText style={[variantStyle, dynamicStyle, style]} {...rest}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  // Existing variants
  h1: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 34,
    color: COLORS.dark.textPrimary,
  },
  h2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    lineHeight: 28,
    color: COLORS.dark.textPrimary,
  },
  h3: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.dark.textPrimary,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.dark.textPrimary,
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.dark.textSecondary,
  },
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  mono: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 18,
    color: COLORS.dark.textPrimary,
  },
  heroStat: {
    fontFamily: 'Inter_700Bold',
    fontSize: 44,
    lineHeight: 52,
    color: COLORS.dark.textPrimary,
  },
  xp: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: COLORS.dark.accentGold,
  },

  // Obsidian Kinetic presets
  displayHero: {
    ...OBSIDIAN_TYPOGRAPHY.displayHero,
    color: OBSIDIAN_COLORS.textWhite,
  },
  displayHeroMobile: {
    ...OBSIDIAN_TYPOGRAPHY.displayHeroMobile,
    color: OBSIDIAN_COLORS.textWhite,
  },
  headlineLg: {
    ...OBSIDIAN_TYPOGRAPHY.headlineLg,
    color: OBSIDIAN_COLORS.textWhite,
  },
  headlineLgMobile: {
    ...OBSIDIAN_TYPOGRAPHY.headlineLgMobile,
    color: OBSIDIAN_COLORS.textWhite,
  },
  headlineMd: {
    ...OBSIDIAN_TYPOGRAPHY.headlineMd,
    color: OBSIDIAN_COLORS.textWhite,
  },
  headlineSm: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
  },
  metricNumeral: {
    ...OBSIDIAN_TYPOGRAPHY.metricNumeral,
    color: OBSIDIAN_COLORS.voltLime,
  },
  labelCaps: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
  },
  labelInteractive: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textWhite,
  },
  bodyLg: {
    ...OBSIDIAN_TYPOGRAPHY.bodyLg,
    color: OBSIDIAN_COLORS.onSurface,
  },
  bodyMd: {
    ...OBSIDIAN_TYPOGRAPHY.bodyMd,
    color: OBSIDIAN_COLORS.onSurface,
  },
  bodySm: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
  },
  bodySmMedium: {
    ...OBSIDIAN_TYPOGRAPHY.bodySmMedium,
    color: OBSIDIAN_COLORS.onSurface,
  },
});
