import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
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

          <Badge label="PERSONAL RECORD" variant="gold" style={styles.badge} />

          <Text variant="h1" style={styles.title}>
            NEW PR!
          </Text>

          <Text variant="h3" style={styles.exerciseName}>
            {exerciseName}
          </Text>

          <View style={styles.statBox}>
            <Text variant="caption" style={styles.prTypeLabel}>
              {prType.toUpperCase()}
            </Text>
            <Text variant="mono" style={styles.statValue}>
              {value}
            </Text>
          </View>

          <View style={styles.xpRow}>
            <Text style={styles.fireEmoji}>🔥</Text>
            <Text variant="h3" style={styles.xpText}>
              +25 XP Awarded!
            </Text>
          </View>

          <View style={styles.buttonWrapper}>
            <GradientButton title="Hell Yeah! 💥" onPress={onDismiss} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 24, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.dark.accentGold,
    shadowColor: COLORS.dark.accentGold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 25,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  trophyEmoji: {
    fontSize: 44,
  },
  badge: {
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.dark.accentGold,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  exerciseName: {
    color: COLORS.dark.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  statBox: {
    backgroundColor: COLORS.dark.bgInput,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.md,
  },
  prTypeLabel: {
    color: COLORS.dark.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  fireEmoji: {
    fontSize: 20,
  },
  xpText: {
    color: COLORS.dark.accentGold,
  },
  buttonWrapper: {
    width: '100%',
  },
});
