import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Platform, AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_SHADOWS,
} from '@/constants/tokens';
import { Text } from '@/components/ui/Text';
import { ProgressRing } from '@/components/charts/ProgressRing';
import {
  scheduleRestTimerNotification,
  cancelRestTimerNotification,
  playTimerAlertSound,
  requestNotificationPermissions,
} from '@/services/notificationService';

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

  // Wall-clock target timestamp (ms) to survive background pauses
  const targetEndTimestampRef = useRef<number>(Date.now() + initialSeconds * 1000);
  const scheduledNotificationIdRef = useRef<string | null>(null);
  const alertFiredRef = useRef<boolean>(false);

  const fireCompletionAlert = useCallback(() => {
    if (alertFiredRef.current) return;
    alertFiredRef.current = true;

    // Trigger haptics
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    // Play energetic gym chime sound
    playTimerAlertSound().catch(() => {});
  }, []);

  const updateRemaining = useCallback(() => {
    const diffMs = targetEndTimestampRef.current - Date.now();
    const remaining = Math.max(0, Math.ceil(diffMs / 1000));
    setSecondsLeft(remaining);

    if (remaining <= 0) {
      fireCompletionAlert();
    }
    return remaining;
  }, [fireCompletionAlert]);

  // Initialize or reset rest countdown when visible changes
  useEffect(() => {
    if (visible) {
      const targetTime = Date.now() + initialSeconds * 1000;
      targetEndTimestampRef.current = targetTime;
      setTotalSeconds(initialSeconds);
      setSecondsLeft(initialSeconds);
      alertFiredRef.current = false;

      // Ask for notification permission & schedule background notification
      requestNotificationPermissions().then((granted) => {
        if (granted) {
          scheduleRestTimerNotification(initialSeconds, exerciseName).then((id) => {
            scheduledNotificationIdRef.current = id;
          });
        }
      });
    } else {
      if (scheduledNotificationIdRef.current) {
        cancelRestTimerNotification(scheduledNotificationIdRef.current);
        scheduledNotificationIdRef.current = null;
      }
    }
  }, [visible, initialSeconds, exerciseName]);

  // Wall-clock interval & AppState listener to keep running even when backgrounded
  useEffect(() => {
    if (!visible) return;

    updateRemaining();

    const interval = setInterval(() => {
      const remaining = updateRemaining();
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 500);

    // When user returns from Spotify/Instagram/YouTube into app recents
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateRemaining();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [visible, updateRemaining]);

  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 1;

  const minutes = Math.floor(Math.max(secondsLeft, 0) / 60);
  const seconds = Math.max(secondsLeft, 0) % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const addTime = async (delta: number) => {
    const currentRemaining = Math.max(0, Math.ceil((targetEndTimestampRef.current - Date.now()) / 1000));
    const newRemaining = Math.max(0, currentRemaining + delta);
    targetEndTimestampRef.current = Date.now() + newRemaining * 1000;

    setSecondsLeft(newRemaining);
    setTotalSeconds((t) => Math.max(t + delta, Math.max(newRemaining, 1)));

    if (newRemaining > 0) {
      alertFiredRef.current = false;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    // Cancel previous notification and reschedule for updated duration
    if (scheduledNotificationIdRef.current) {
      await cancelRestTimerNotification(scheduledNotificationIdRef.current);
      scheduledNotificationIdRef.current = null;
    }
    if (newRemaining > 0) {
      const newId = await scheduleRestTimerNotification(newRemaining, exerciseName);
      scheduledNotificationIdRef.current = newId;
    }
  };

  const handleClose = async () => {
    if (scheduledNotificationIdRef.current) {
      await cancelRestTimerNotification(scheduledNotificationIdRef.current);
      scheduledNotificationIdRef.current = null;
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
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
            onPress={handleClose}
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
