import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
import { Text } from '@/components/ui/Text';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { Icon } from '@/components/ui/Icon';

interface RestTimerModalProps {
  visible: boolean;
  initialSeconds?: number;
  exerciseName?: string;
  onClose: () => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  visible,
  initialSeconds = 90,
  exerciseName,
  onClose,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (visible) {
      setTotalSeconds(initialSeconds);
      setSecondsLeft(initialSeconds);
    }
  }, [visible, initialSeconds]);

  useEffect(() => {
    if (!visible) return;

    if (secondsLeft <= 0) {
      // Trigger haptic alert
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, secondsLeft]);

  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 1;

  const minutes = Math.floor(Math.max(secondsLeft, 0) / 60);
  const seconds = Math.max(secondsLeft, 0) % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const addTime = (delta: number) => {
    setSecondsLeft((s) => Math.max(s + delta, 0));
    setTotalSeconds((t) => Math.max(t + delta, 1));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text variant="caption" style={styles.kicker}>REST TIMER</Text>
          {exerciseName && (
            <Text variant="h3" style={styles.title} numberOfLines={1}>
              {exerciseName}
            </Text>
          )}

          <View style={styles.ringWrapper}>
            <ProgressRing
              size={180}
              strokeWidth={12}
              progress={progress}
              color={secondsLeft === 0 ? COLORS.dark.success : COLORS.dark.accentRed}
            >
              <View style={styles.innerContent}>
                <Text variant="mono" style={styles.timerText}>
                  {timeFormatted}
                </Text>
                <Text variant="caption" style={styles.timerSub}>
                  {secondsLeft === 0 ? 'Ready to Lift!' : 'Resting'}
                </Text>
              </View>
            </ProgressRing>
          </View>

          {/* Quick Adjustment Buttons */}
          <View style={styles.adjustRow}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => addTime(-15)}>
              <Text variant="bodySmall" style={styles.adjustText}>-15s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => addTime(30)}>
              <Text variant="bodySmall" style={styles.adjustText}>+30s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => addTime(60)}>
              <Text variant="bodySmall" style={styles.adjustText}>+60s</Text>
            </TouchableOpacity>
          </View>

          {/* Dismiss / Skip Button */}
          <TouchableOpacity
            style={[styles.actionBtn, secondsLeft === 0 && styles.actionBtnDone]}
            onPress={onClose}
          >
            <Text variant="h3" style={styles.actionBtnText}>
              {secondsLeft === 0 ? 'Next Set →' : 'Skip Rest'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 24, 0.85)',
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  kicker: {
    color: COLORS.dark.accentGold,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  title: {
    color: COLORS.dark.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  ringWrapper: {
    marginVertical: SPACING.md,
  },
  innerContent: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timerSub: {
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  adjustBtn: {
    backgroundColor: COLORS.dark.bgInput,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  adjustText: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
  },
  actionBtn: {
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  actionBtnDone: {
    backgroundColor: COLORS.dark.accentRed,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
