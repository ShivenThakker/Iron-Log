import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_SPACING,
  OBSIDIAN_RADIUS,
} from '@/constants/tokens';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    router.push('/register');
  };

  const handleLogin = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top spacer */}
        <View style={styles.topSpacer} />

        {/* Center Hero Branding */}
        <View style={styles.heroContainer}>
          <View style={styles.iconGlowWrapper}>
            <View style={styles.iconGlow} />
            <View style={styles.iconBox}>
              <View style={styles.iconRotator}>
                <Icon name="Barbell" size={32} color={OBSIDIAN_COLORS.primaryFixed} weight="fill" />
              </View>
            </View>
          </View>

          <Text style={styles.title}>IRONLOG</Text>
          <Text style={styles.subtitle}>Your AI Fitness Companion</Text>
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGetStarted}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>

          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By continuing, you accept our{' '}
              <Text style={styles.legalLink}>Terms</Text>
              {' '}&{' '}
              <Text style={styles.legalLink}>Privacy</Text>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surface,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: OBSIDIAN_SPACING.xl,
    paddingVertical: OBSIDIAN_SPACING['2xl'],
  },
  topSpacer: {
    height: 20,
  },
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
  },
  iconGlowWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: OBSIDIAN_SPACING.xl,
  },
  iconGlow: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: OBSIDIAN_COLORS.primaryFixed,
    opacity: 0.16,
    ...Platform.select({
      ios: {
        shadowColor: OBSIDIAN_COLORS.primaryFixed,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconRotator: {
    transform: [{ rotate: '-45deg' }],
  },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 32,
    fontWeight: '700',
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: OBSIDIAN_SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: OBSIDIAN_COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 360,
    gap: OBSIDIAN_SPACING.sm,
    marginBottom: Platform.OS === 'ios' ? OBSIDIAN_SPACING.sm : OBSIDIAN_SPACING.lg,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: OBSIDIAN_COLORS.primaryFixed,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryButtonText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: OBSIDIAN_COLORS.onPrimaryFixed,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryButtonText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: 0.2,
  },
  legalContainer: {
    paddingTop: OBSIDIAN_SPACING.xs,
    alignItems: 'center',
  },
  legalText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: OBSIDIAN_COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: OBSIDIAN_COLORS.textWhite,
  },
});
