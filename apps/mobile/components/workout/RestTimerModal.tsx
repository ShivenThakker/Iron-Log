import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  COLORS,
  RADIUS,
  SPACING,
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_SHADOWS,
} from '@/constants/tokens';
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
          <Text variant="labelCaps" style={styles.kicker}>REST TIMER</Text>
          {exerciseName && (
            <Text variant="headlineSm" style={styles.title} numberOfLines={1}>
              {exerciseName}
            </Text>
          )}

          <View style={styles.ringWrapper}>
            <ProgressRing
              size={180}
              strokeWidth={12}
              progress={progress}
              color={secondsLeft === 0 ? OBSIDIAN_COLORS.voltLime : OBSIDIAN_COLORS.cyanAccent}
            >
              <View style={styles.innerContent}>
                <Text style={styles.timerText}>
                  {timeFormatted}
                </Text>
                <Text variant="bodySm" style={styles.timerSub}>
                  {secondsLeft === 0 ? 'Ready to Lift!' : 'Resting'}
                </Text>
              </View>
            </ProgressRing>
          </View>

          {/* Quick Adjustment Buttons */}
          <View style={styles.adjustRow}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => addTime(-15)}>
              <Text style={styles.adjustText}>-15s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => addTime(30)}>
              <Text style={styles.adjustText}>+30s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => addTime(60)}>
              <Text style={styles.adjustText}>+60s</Text>
            </TouchableOpacity>
          </View>

          {/* Dismiss / Skip Button */}
          <TouchableOpacity
            style={[styles.actionBtn, secondsLeft === 0 && styles.actionBtnDone]}
            onPress={onClose}
          >
            <Text style={[styles.actionBtnText, secondsLeft === 0 && styles.actionBtnTextDone]}>
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
    backgroundColor: 'rgba(9, 11, 16, 0.88)',
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
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    ...OBSIDIAN_SHADOWS.cardLevel3,
  },
  kicker: {
    color: OBSIDIAN_COLORS.voltLime,
    letterSpacing: 1.5,
    marginBottom: OBSIDIAN_SPACING.xs,
  },
  title: {
    color: OBSIDIAN_COLORS.textWhite,
    marginBottom: OBSIDIAN_SPACING.md,
    textAlign: 'center',
  },
  ringWrapper: {
    marginVertical: OBSIDIAN_SPACING.sm,
  },
  innerContent: {
    alignItems: 'center',
  },
  timerText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 42,
    lineHeight: 48,
    color: OBSIDIAN_COLORS.textWhite,
  },
  timerSub: {
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: OBSIDIAN_SPACING.sm,
    marginVertical: OBSIDIAN_SPACING.md,
  },
  adjustBtn: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingVertical: OBSIDIAN_SPACING.xs + 2,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    borderRadius: OBSIDIAN_RADIUS.full,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  adjustText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.textWhite,
  },
  actionBtn: {
    marginTop: OBSIDIAN_SPACING.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    width: '100%',
    paddingVertical: OBSIDIAN_SPACING.md,
    borderRadius: OBSIDIAN_RADIUS.lg,
    alignItems: 'center',
  },
  actionBtnDone: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    borderColor: OBSIDIAN_COLORS.voltLime,
    ...OBSIDIAN_SHADOWS.voltGlowSmall,
  },
  actionBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionBtnTextDone: {
    color: OBSIDIAN_COLORS.onPrimary,
  },
});
