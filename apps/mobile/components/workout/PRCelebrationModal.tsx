import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_SHADOWS,
  SPRINGS,
} from '@/constants/tokens';
import { Text } from '@/components/ui/Text';
import { GradientButton } from '@/components/ui/GradientButton';
import { Badge } from '@/components/ui/Badge';

interface PRCelebrationModalProps {
  visible: boolean;
  exerciseName: string;
  prType: string;
  value: string;
  onDismiss: () => void;
}

export const PRCelebrationModal: React.FC<PRCelebrationModalProps> = ({
  visible,
  exerciseName,
  prType,
  value,
  onDismiss,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(4);
  const [scaleAnim] = useState(() => new Animated.Value(0.92));
  const [opacityAnim] = useState(() => new Animated.Value(0));
  const [trophyScale] = useState(() => new Animated.Value(0.7));

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
      trophyScale.setValue(0.7);
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...SPRINGS.bouncy,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.spring(trophyScale, {
          toValue: 1.18,
          ...SPRINGS.bouncy,
          useNativeDriver: true,
        }),
        Animated.spring(trophyScale, {
          toValue: 1.0,
          ...SPRINGS.snappy,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      setSecondsRemaining(4);
    };
  }, [visible, onDismiss, scaleAnim, opacityAnim, trophyScale]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Trophy Header */}
          <Animated.View style={[styles.iconCircle, { transform: [{ scale: trophyScale }] }]}>
            <Text style={styles.trophyEmoji}>🏆</Text>
          </Animated.View>

          <Badge label="PERSONAL RECORD" variant="volt" style={styles.badge} />

          <Text variant="headlineLg" style={styles.title}>
            NEW PR!
          </Text>

          <Text variant="headlineSm" style={styles.exerciseName}>
            {exerciseName}
          </Text>

          <View style={styles.statBox}>
            <Text variant="labelCaps" style={styles.prTypeLabel}>
              {prType.toUpperCase()}
            </Text>
            <Text variant="metricNumeral" style={styles.statValue}>
              {value}
            </Text>
          </View>

          <View style={styles.xpRow}>
            <Text style={styles.fireEmoji}>⚡</Text>
            <Text variant="headlineSm" style={styles.xpText}>
              +25 XP Awarded!
            </Text>
          </View>

          <View style={styles.buttonWrapper}>
            <GradientButton
              variant="volt"
              title={`Hell Yeah! 💥 (${secondsRemaining}s)`}
              onPress={onDismiss}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 11, 16, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: OBSIDIAN_SPACING.xl,
  },
  card: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS['2xl'],
    padding: OBSIDIAN_SPACING.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: OBSIDIAN_COLORS.voltLime,
    ...OBSIDIAN_SHADOWS.voltGlowLarge,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: OBSIDIAN_COLORS.voltOverlay15,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: OBSIDIAN_SPACING.md,
  },
  trophyEmoji: {
    fontSize: 44,
  },
  badge: {
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  title: {
    color: OBSIDIAN_COLORS.voltLime,
    letterSpacing: 1.5,
    marginBottom: OBSIDIAN_SPACING.xs,
  },
  exerciseName: {
    color: OBSIDIAN_COLORS.textWhite,
    textAlign: 'center',
    marginBottom: OBSIDIAN_SPACING.lg,
  },
  statBox: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    borderWidth: 1,
    paddingVertical: OBSIDIAN_SPACING.md,
    paddingHorizontal: OBSIDIAN_SPACING.xl,
    borderRadius: OBSIDIAN_RADIUS.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: OBSIDIAN_SPACING.md,
  },
  prTypeLabel: {
    color: OBSIDIAN_COLORS.textMuted,
    marginBottom: 4,
  },
  statValue: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.xs,
    marginBottom: OBSIDIAN_SPACING.xl,
  },
  fireEmoji: {
    fontSize: 20,
  },
  xpText: {
    color: OBSIDIAN_COLORS.voltLime,
  },
  buttonWrapper: {
    width: '100%',
  },
});
