import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  COLORS,
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_SHADOWS,
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
  useEffect(() => {
    if (visible && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Trophy Header */}
          <View style={styles.iconCircle}>
            <Text style={styles.trophyEmoji}>🏆</Text>
          </View>

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
            <GradientButton variant="volt" title="Hell Yeah! 💥" onPress={onDismiss} />
          </View>
        </View>
      </View>
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
