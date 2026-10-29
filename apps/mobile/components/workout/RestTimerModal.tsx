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
import { Icon } from '@/components/ui/Icon';
import { ProgressRing } from '@/components/charts/ProgressRing';
import {
  scheduleRestTimerNotification,
  cancelRestTimerNotification,
  playTimerAlertSound,
  requestNotificationPermissions,
} from '@/services/notificationService';

export interface RestTimerModalProps {
  visible: boolean;
  initialSeconds?: number;
  mode?: 'set' | 'exercise';
  exerciseName?: string;
  currentExerciseName?: string;
  nextExerciseName?: string;
  nextExerciseMuscles?: string;
  currentSetNumber?: number;
  totalSets?: number;
  onClose: () => void;
  onComplete: (extraSetRequested: boolean) => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  visible,
  initialSeconds = 90,
  mode = 'set',
  exerciseName,
  currentExerciseName,
  nextExerciseName,
  nextExerciseMuscles,
  currentSetNumber,
  totalSets,
  onClose,
  onComplete,
}) => {
  const activeCurrentName = currentExerciseName || exerciseName || 'Current Exercise';
  const isExerciseMode = mode === 'exercise';
  const displayTitle = isExerciseMode ? (nextExerciseName || 'Next Movement') : activeCurrentName;

  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [extraSetRequested, setExtraSetRequested] = useState(false);

  // Wall-clock target timestamp (ms) to survive background pauses
  const targetEndTimestampRef = useRef<number>(Date.now() + initialSeconds * 1000);
  const scheduledNotificationIdRef = useRef<string | null>(null);
  const alertFiredRef = useRef<boolean>(false);
  const completedFiredRef = useRef<boolean>(false);
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extraSetRequestedRef = useRef<boolean>(false);

  // Keep ref synchronized with state
  useEffect(() => {
    extraSetRequestedRef.current = extraSetRequested;
  }, [extraSetRequested]);

  const handleFinishRest = useCallback(
    (extraSet: boolean) => {
      if (completedFiredRef.current) return;
      completedFiredRef.current = true;

      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }

      if (scheduledNotificationIdRef.current) {
        cancelRestTimerNotification(scheduledNotificationIdRef.current);
        scheduledNotificationIdRef.current = null;
      }

      onComplete(extraSet);
    },
    [onComplete]
  );

  const fireCompletionAlert = useCallback(() => {
    if (alertFiredRef.current) return;
    alertFiredRef.current = true;

    // Trigger haptics
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    // Play energetic gym chime sound
    playTimerAlertSound().catch(() => {});

    // Automatically transition to next set or next exercise after brief 750ms cue
    if (!autoAdvanceTimeoutRef.current && !completedFiredRef.current) {
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        handleFinishRest(extraSetRequestedRef.current);
      }, 750);
    }
  }, [handleFinishRest]);

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
      setExtraSetRequested(false);
      extraSetRequestedRef.current = false;
      alertFiredRef.current = false;
      completedFiredRef.current = false;

      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }

      // Ask for notification permission & schedule background notification
      requestNotificationPermissions().then((granted) => {
        if (granted) {
          const targetName = isExerciseMode ? (nextExerciseName || 'Next Movement') : activeCurrentName;
          scheduleRestTimerNotification(initialSeconds, targetName, isExerciseMode).then((id) => {
            scheduledNotificationIdRef.current = id;
          });
        }
      });
    } else {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
      if (scheduledNotificationIdRef.current) {
        cancelRestTimerNotification(scheduledNotificationIdRef.current);
        scheduledNotificationIdRef.current = null;
      }
    }
  }, [visible, initialSeconds, isExerciseMode, nextExerciseName, activeCurrentName]);

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
        const remaining = updateRemaining();
        if (remaining <= 0 && !completedFiredRef.current) {
          // If already expired while in background, auto-advance rapidly (250ms)
          if (!autoAdvanceTimeoutRef.current) {
            autoAdvanceTimeoutRef.current = setTimeout(() => {
              handleFinishRest(extraSetRequestedRef.current);
            }, 250);
          }
        }
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, [visible, updateRemaining, handleFinishRest]);

  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 1;
  const minutes = Math.floor(Math.max(secondsLeft, 0) / 60);
  const seconds = Math.max(secondsLeft, 0) % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const addTime = async (delta: number) => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    const currentRemaining = Math.max(0, Math.ceil((targetEndTimestampRef.current - Date.now()) / 1000));
    const newRemaining = Math.max(0, currentRemaining + delta);
    targetEndTimestampRef.current = Date.now() + newRemaining * 1000;

    setSecondsLeft(newRemaining);
    setTotalSeconds((t) => Math.max(t + delta, Math.max(newRemaining, 1)));

    if (newRemaining > 0) {
      alertFiredRef.current = false;
      completedFiredRef.current = false;
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
      const targetName = isExerciseMode && !extraSetRequested
        ? (nextExerciseName || 'Next Movement')
        : activeCurrentName;
      const newId = await scheduleRestTimerNotification(
        newRemaining,
        targetName,
        isExerciseMode && !extraSetRequested
      );
      scheduledNotificationIdRef.current = newId;
    }
  };

  const handleToggleExtraSet = async () => {
    const nextVal = !extraSetRequested;
    setExtraSetRequested(nextVal);
    extraSetRequestedRef.current = nextVal;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    // Update scheduled notification target text
    if (scheduledNotificationIdRef.current) {
      await cancelRestTimerNotification(scheduledNotificationIdRef.current);
      scheduledNotificationIdRef.current = null;
    }
    const currentRemaining = Math.max(0, Math.ceil((targetEndTimestampRef.current - Date.now()) / 1000));
    if (currentRemaining > 0) {
      const targetName = nextVal ? activeCurrentName : (nextExerciseName || 'Next Movement');
      const newId = await scheduleRestTimerNotification(currentRemaining, targetName, !nextVal);
      scheduledNotificationIdRef.current = newId;
    }
  };

  const handleManualAction = () => {
    handleFinishRest(extraSetRequested);
  };

  const handleClose = () => {
    if (scheduledNotificationIdRef.current) {
      cancelRestTimerNotification(scheduledNotificationIdRef.current);
      scheduledNotificationIdRef.current = null;
    }
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    onClose();
  };

  // Compute action button label based on mode and countdown state
  const getActionLabel = () => {
    if (isExerciseMode) {
      if (extraSetRequested) {
        return secondsLeft === 0 ? 'Start Extra Set →' : 'Skip Rest → Extra Set';
      }
      return secondsLeft === 0 ? 'Next Exercise →' : 'Skip Rest → Next Exercise';
    }
    return secondsLeft === 0 ? 'Next Set →' : 'Skip Rest';
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header kicker */}
          <Text variant="labelCaps" style={[styles.kicker, isExerciseMode && styles.kickerExercise]}>
            {isExerciseMode ? 'REST • UP NEXT' : 'REST TIMER'}
          </Text>

          {/* Title */}
          <Text variant="headlineSm" style={styles.title} numberOfLines={1}>
            {extraSetRequested ? `Extra Set: ${activeCurrentName}` : displayTitle}
          </Text>

          {/* Subtitle / context description */}
          {isExerciseMode ? (
            extraSetRequested ? (
              <View style={styles.extraSetHighlight}>
                <Icon name="CheckCircle" size={14} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                <Text style={styles.extraSetHighlightText}>
                  Extra set added! Returning to {activeCurrentName}
                </Text>
              </View>
            ) : (
              <Text variant="bodySm" style={styles.subtext} numberOfLines={1}>
                {nextExerciseMuscles ? `Upcoming: ${nextExerciseMuscles}` : `Completed ${activeCurrentName}`}
              </Text>
            )
          ) : (
            currentSetNumber && totalSets ? (
              <Text variant="bodySm" style={styles.subtext}>
                Set {currentSetNumber} of {totalSets} Completed
              </Text>
            ) : null
          )}

          {/* Countdown Ring */}
          <View style={styles.ringWrapper}>
            <ProgressRing
              size={180}
              strokeWidth={12}
              progress={progress}
              color={
                secondsLeft === 0
                  ? OBSIDIAN_COLORS.voltLime
                  : isExerciseMode
                  ? OBSIDIAN_COLORS.cyanAccent
                  : OBSIDIAN_COLORS.voltLime
              }
            >
              <View style={styles.innerContent}>
                <Text style={styles.timerText}>{timeFormatted}</Text>
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

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[styles.actionBtn, secondsLeft === 0 && styles.actionBtnDone]}
            onPress={handleManualAction}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, secondsLeft === 0 && styles.actionBtnTextDone]}>
              {getActionLabel()}
            </Text>
          </TouchableOpacity>

          {/* Between-exercise: "Need an extra set?" option below the button */}
          {isExerciseMode && (
            <View style={styles.extraSetRow}>
              {extraSetRequested ? (
                <TouchableOpacity
                  style={styles.cancelExtraBtn}
                  onPress={handleToggleExtraSet}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelExtraText}>
                    Cancel extra set (Proceed to next exercise)
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.extraSetBtn}
                  onPress={handleToggleExtraSet}
                  activeOpacity={0.7}
                >
                  <Icon name="PlusCircle" size={15} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                  <Text style={styles.extraSetText}>Need an extra set?</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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
  kickerExercise: {
    color: OBSIDIAN_COLORS.cyanAccent,
  },
  title: {
    color: OBSIDIAN_COLORS.textWhite,
    marginBottom: OBSIDIAN_SPACING.xs,
    textAlign: 'center',
  },
  subtext: {
    color: OBSIDIAN_COLORS.textMuted,
    marginBottom: OBSIDIAN_SPACING.sm,
    textAlign: 'center',
  },
  extraSetHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: OBSIDIAN_SPACING.sm,
    borderRadius: OBSIDIAN_RADIUS.full,
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  extraSetHighlightText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
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
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionBtnTextDone: {
    color: OBSIDIAN_COLORS.onPrimary,
  },
  extraSetRow: {
    marginTop: OBSIDIAN_SPACING.sm + 2,
    alignItems: 'center',
  },
  extraSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: OBSIDIAN_SPACING.xs,
    paddingHorizontal: OBSIDIAN_SPACING.sm,
  },
  extraSetText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.voltLime,
    textDecorationLine: 'underline',
  },
  cancelExtraBtn: {
    paddingVertical: OBSIDIAN_SPACING.xs,
    paddingHorizontal: OBSIDIAN_SPACING.sm,
  },
  cancelExtraText: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 12,
    color: OBSIDIAN_COLORS.textMuted,
    textDecorationLine: 'underline',
  },
});
