// Existing tokens (Preserved untouched so unmigrated screens do not restyle unpredictably)
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
  rankLabel: { fontFamily: 'Inter-Black', fontSize: 20, textTransform: 'uppercase' as const, color: '#FFFFFF' },
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

// ============================================================================
// OBSIDIAN KINETIC DESIGN TOKENS (Stitch Redesign System)
// ============================================================================

export const OBSIDIAN_COLORS = {
  // 60% Carbon Grounding Foundations
  canvas: '#090B10',
  surface: '#10131C',
  surfaceDim: '#10131C',
  surfaceBright: '#363943',
  surfaceContainerLowest: '#0B0E17',
  surfaceContainerLow: '#181B25',
  surfaceContainer: '#1C1F29',
  surfaceContainerHigh: '#272A33',
  surfaceContainerHighest: '#32343E',
  surfaceVariant: '#272A35',

  // 30% Structural Slate Neutrals
  onSurface: '#E0E2EF',
  onSurfaceVariant: '#C4C9AC',
  inverseSurface: '#E0E2EF',
  inverseOnSurface: '#2D303A',
  textWhite: '#F8FAFC',
  textMuted: '#94A3B8',
  textSlate: '#64748B',
  outline: '#8E9379',
  outlineVariant: '#323644',
  outlineVariantAlt: '#444933',
  borderGhost: '#232938',
  borderElevated: '#2D3548',
  trackFill: '#334155',

  // 10% Kinetic High-Frequency Accents
  // Dominant Primary: Volt Lime (Execution triggers, target milestones, active states)
  voltLime: '#CCFF00',
  primary: '#CCFF00',
  primaryContainer: '#CCFF00',
  primaryFixed: '#C3F400',
  primaryFixedDim: '#ABD600',
  onPrimary: '#0B1200', // Mandatory dark carbon text over Volt Lime
  onPrimaryFixed: '#161E00',
  onPrimaryContainer: '#556D00',

  // Secondary: Electric Cyan (Pacing, cadence, telemetry)
  cyanAccent: '#00E5FF',
  secondaryContainer: '#00E3FD',
  secondaryFixedDim: '#00DAF3',
  secondaryFixed: '#9CF0FF',
  secondary: '#BDF4FF',
  onSecondary: '#00363D',
  onSecondaryContainer: '#00616D',

  // Tertiary / Alerts: Electric Coral / Red (Peak strain, warnings, rest finish)
  coralAccent: '#FF4655',
  coralLight: '#FF5C5F',
  tertiaryContainer: '#FFDAD9',
  tertiaryFixedDim: '#FFB3B2',
  error: '#FFB4AB',
  errorContainer: '#93000A',
  onError: '#690005',
  onErrorContainer: '#FFDAD6',

  // Translucent overlays & glows
  voltOverlay10: 'rgba(204, 255, 0, 0.10)',
  voltOverlay15: 'rgba(204, 255, 0, 0.15)',
  voltOverlay25: 'rgba(204, 255, 0, 0.25)',
  voltBorderActive: 'rgba(204, 255, 0, 0.40)',
  cyanOverlay15: 'rgba(0, 227, 253, 0.15)',
  carbonNavGlass: 'rgba(11, 14, 23, 0.95)',
  carbonCardGlass: 'rgba(24, 27, 37, 0.85)',
};

export const OBSIDIAN_TYPOGRAPHY = {
  // Space Grotesk Technical Hierarchy (Nav, metrics, readouts, badges)
  displayHero: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1.6,
    fontWeight: '700' as const,
  },
  displayHeroMobile: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1.2,
    fontWeight: '700' as const,
  },
  headlineLg: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.6,
    fontWeight: '700' as const,
  },
  headlineLgMobile: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    fontWeight: '700' as const,
  },
  headlineMd: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
    fontWeight: '600' as const,
  },
  headlineSm: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
    fontWeight: '600' as const,
  },
  metricNumeral: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.0,
    fontWeight: '700' as const,
  },
  labelCaps: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.88,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  labelInteractive: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.28,
    fontWeight: '600' as const,
  },

  // Inter Natural Legibility Hierarchy (Descriptions, logs, multi-line instructions)
  bodyLg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMd: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySm: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  bodySmMedium: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
};

export const OBSIDIAN_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  gutter: 16,
  margin: 16,
};

export const OBSIDIAN_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const OBSIDIAN_SHADOWS = {
  voltGlowSmall: {
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  voltGlowLarge: {
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
  },
  cardLevel1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLevel2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 4,
  },
  cardLevel3: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 32,
    elevation: 8,
  },
};
