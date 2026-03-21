export const COLORS = {
  // Dark Mode (Default)
  dark: {
    bgPrimary: '#1A1A2E',
    bgSecondary: '#16213E',
    bgInput: '#2A2D50',
    accentRed: '#E94560',
    accentRedDim: '#A83248',
    accentBlue: '#1565C0',
    accentCyan: '#00BCD4',
    accentGold: '#F59E0B',
    midBlue: '#0F3460',
    textPrimary: '#F0F2F8',
    textSecondary: '#9CA3B8',
    success: '#22C55E',
    destructive: '#EF4444',
    aiPurple: '#7C3AED',
  },
  // Light Mode
  light: {
    bgPrimary: '#F8F9FC',
    bgSecondary: '#FFFFFF',
    textPrimary: '#1A1A2E',
    textSecondary: '#6B7280',
    // ...other colors adapt or remain same
    bgInput: '#E2E8F0',
    accentRed: '#E94560',
    accentRedDim: '#A83248',
    accentBlue: '#1565C0',
    accentCyan: '#00BCD4',
    accentGold: '#F59E0B',
    midBlue: '#E2E8F0',
    success: '#22C55E',
    destructive: '#EF4444',
    aiPurple: '#7C3AED',
  }
};

export const TYPOGRAPHY = {
  appName: { fontFamily: 'Inter-Black', fontSize: 40, color: COLORS.dark.accentRed },
  screenTitle: { fontFamily: 'Inter-Bold', fontSize: 28, color: COLORS.dark.textPrimary },
  sectionHeading: { fontFamily: 'Inter-Bold', fontSize: 22, color: COLORS.dark.textPrimary },
  cardTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: COLORS.dark.textPrimary },
  body: { fontFamily: 'Inter-Regular', fontSize: 14, color: COLORS.dark.textPrimary, lineHeight: 22 },
  caption: { fontFamily: 'Inter-Medium', fontSize: 12, color: COLORS.dark.textSecondary },
  heroStat: { fontFamily: 'Inter-Bold', fontSize: 48, color: '#FFFFFF' },
  xpNumber: { fontFamily: 'Inter-Black', fontSize: 32, color: COLORS.dark.accentGold },
  rankLabel: { fontFamily: 'Inter-Black', fontSize: 20, textTransform: 'uppercase', color: '#FFFFFF' },
  aiSuggestion: { fontFamily: 'Inter-Medium', fontSize: 13, color: COLORS.dark.accentGold },
  monospaceInput: { fontFamily: 'JetBrainsMono-Regular', fontSize: 18, color: '#FFFFFF' },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 9999,
};
