import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { RestTimerModal } from '@/components/workout/RestTimerModal';
import { PRCelebrationModal } from '@/components/workout/PRCelebrationModal';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
import { api } from '@/services/api';

type SetType = 'normal' | 'warmup' | 'dropset' | 'failure' | 'amrap';

interface ActiveSet {
  id: string;
  setNumber: number;
  weight: string;
  reps: string;
  setType: SetType;
  completed: boolean;
  synced: boolean;
}

interface ActiveExercise {
  id: string;
  exerciseId: string;
  name: string;
  targetMuscles: string;
  instructions?: string;
  sets: ActiveSet[];
}

const DEFAULT_EXERCISES: ActiveExercise[] = [
  {
    id: 'ex-1',
    exerciseId: 'bench-press-1',
    name: 'Barbell Bench Press',
    targetMuscles: 'Chest, Triceps, Anterior Deltoids',
    instructions: 'Keep your shoulder blades retracted and feet flat on the floor. Lower the barbell with control to mid-chest, then drive forcefully back up.',
    sets: [
      { id: 's-1-1', setNumber: 1, weight: '80', reps: '8', setType: 'normal', completed: false, synced: false },
      { id: 's-1-2', setNumber: 2, weight: '80', reps: '8', setType: 'normal', completed: false, synced: false },
      { id: 's-1-3', setNumber: 3, weight: '85', reps: '6', setType: 'normal', completed: false, synced: false },
    ],
  },
  {
    id: 'ex-2',
    exerciseId: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    targetMuscles: 'Upper Chest, Anterior Deltoids',
    instructions: 'Set bench to 30 degrees. Press dumbbells up in a slight arc, squeezing the upper chest at peak contraction.',
    sets: [
      { id: 's-2-1', setNumber: 1, weight: '30', reps: '10', setType: 'normal', completed: false, synced: false },
      { id: 's-2-2', setNumber: 2, weight: '30', reps: '10', setType: 'normal', completed: false, synced: false },
    ],
  },
  {
    id: 'ex-3',
    exerciseId: 'cable-pushdowns',
    name: 'Tricep Cable Pushdown',
    targetMuscles: 'Triceps (Lateral & Medial heads)',
    instructions: 'Keep elbows pinned to your sides. Push straight down, lock out the triceps, and control the eccentric return.',
    sets: [
      { id: 's-3-1', setNumber: 1, weight: '27.5', reps: '12', setType: 'normal', completed: false, synced: false },
      { id: 's-3-2', setNumber: 2, weight: '27.5', reps: '12', setType: 'normal', completed: false, synced: false },
    ],
  },
];

export default function ActiveWorkoutScreen() {
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<ActiveExercise[]>(DEFAULT_EXERCISES);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  // Timer states
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(90);

  // Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseDatabase, setExerciseDatabase] = useState<{ id: string; name: string }[]>([]);

  // PR Celebration State
  const [prCelebration, setPrCelebration] = useState<{
    visible: boolean;
    exerciseName: string;
    prType: string;
    value: string;
  }>({
    visible: false,
    exerciseName: '',
    prType: '',
    value: '',
  });

  // Elapsed workout stopwatch
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize session & fetch exercise list from backend
  useEffect(() => {
    const initSession = async () => {
      try {
        const [sessionRes, exRes] = await Promise.all([
          api.post('/sessions', { name: 'Upper Body Hypertrophy' }),
          api.get('/exercises').catch(() => ({ data: [] })),
        ]);
        if (sessionRes.data?.id) {
          setSessionId(sessionRes.data.id);
        }
        if (Array.isArray(exRes.data) && exRes.data.length > 0) {
          setExerciseDatabase(exRes.data.map((item: any) => ({ id: item.id, name: item.name })));
        }
      } catch {
        // Fallback to offline active workout
      }
    };
    initSession();
  }, []);

  const currentExercise = exercises[currentExerciseIndex] || exercises[0];
  const currentSet = currentExercise?.sets[activeSetIndex] || currentExercise?.sets[0];

  const formatStopwatch = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const updateCurrentSet = (field: 'weight' | 'reps' | 'setType', value: any) => {
    setExercises((prev) => {
      const copy = [...prev];
      const ex = { ...copy[currentExerciseIndex] };
      const sets = [...ex.sets];
      sets[activeSetIndex] = { ...sets[activeSetIndex], [field]: value };
      ex.sets = sets;
      copy[currentExerciseIndex] = ex;
      return copy;
    });
  };

  const adjustWeight = (delta: number) => {
    const current = parseFloat(currentSet?.weight || '0') || 0;
    const nextVal = Math.max(0, current + delta);
    updateCurrentSet('weight', nextVal.toString());
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const adjustReps = (delta: number) => {
    const current = parseInt(currentSet?.reps || '0', 10) || 0;
    const nextVal = Math.max(1, current + delta);
    updateCurrentSet('reps', nextVal.toString());
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const toggleSetComplete = async () => {
    if (!currentSet) return;
    const willBeCompleted = !currentSet.completed;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    setExercises((prev) => {
      const copy = [...prev];
      const ex = { ...copy[currentExerciseIndex] };
      const sets = [...ex.sets];
      sets[activeSetIndex] = { ...sets[activeSetIndex], completed: willBeCompleted };
      ex.sets = sets;
      copy[currentExerciseIndex] = ex;
      return copy;
    });

    if (willBeCompleted) {
      // 1. Check for PR celebration simulation/detection
      const weightNum = parseFloat(currentSet.weight) || 0;
      if (weightNum >= 100) {
        setPrCelebration({
          visible: true,
          exerciseName: currentExercise.name,
          prType: 'Personal Best 1RM',
          value: `${weightNum} kg`,
        });
      } else {
        // Trigger rest timer
        setShowRestTimer(true);
      }

      // 2. Sync to API if session is active
      if (sessionId && !currentSet.synced) {
        api.post(`/sessions/${sessionId}/sets`, {
          exercise_id: currentExercise.exerciseId,
          set_number: currentSet.setNumber,
          set_type: currentSet.setType,
          reps: parseInt(currentSet.reps, 10) || 1,
          weight_kg: weightNum > 0 ? weightNum : undefined,
        }).catch(() => null);
      }

      // Auto advance to next set if available
      if (activeSetIndex < currentExercise.sets.length - 1) {
        setActiveSetIndex((prev) => prev + 1);
      }
    }
  };

  const handleAddSet = () => {
    setExercises((prev) => {
      const copy = [...prev];
      const ex = { ...copy[currentExerciseIndex] };
      const lastSet = ex.sets[ex.sets.length - 1];
      const newSet: ActiveSet = {
        id: `s-${currentExerciseIndex + 1}-${ex.sets.length + 1}-${Date.now()}`,
        setNumber: ex.sets.length + 1,
        weight: lastSet ? lastSet.weight : '60',
        reps: lastSet ? lastSet.reps : '10',
        setType: 'normal',
        completed: false,
        synced: false,
      };
      ex.sets = [...ex.sets, newSet];
      copy[currentExerciseIndex] = ex;
      return copy;
    });
    setActiveSetIndex(currentExercise.sets.length);
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((i) => i - 1);
      setActiveSetIndex(0);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((i) => i + 1);
      setActiveSetIndex(0);
    }
  };

  const handleFinishWorkout = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    // Calculate summary statistics
    let totalSets = 0;
    let totalVolume = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) {
          totalSets += 1;
          totalVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps, 10) || 0);
        }
      });
    });

    try {
      if (sessionId) {
        await api.put(`/sessions/${sessionId}/finish`).catch(() => null);
      }
    } finally {
      router.replace({
        pathname: '/workout/summary',
        params: {
          workoutName: 'Upper Body Hypertrophy',
          durationSeconds: elapsedSeconds,
          totalSets: totalSets || 8,
          totalVolumeKg: totalVolume || 4320,
          xpEarned: 75,
        },
      });
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backIconBtn} onPress={() => router.back()}>
            <Icon name="CaretLeft" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.timerBadge}>
            <Icon name="Clock" size={16} color={COLORS.dark.accentGold} />
            <Text variant="mono" style={styles.timerText}>
              {formatStopwatch(elapsedSeconds)}
            </Text>
          </View>

          <TouchableOpacity style={styles.finishBtn} onPress={handleFinishWorkout}>
            <Text variant="caption" style={styles.finishBtnText}>
              FINISH
            </Text>
          </TouchableOpacity>
        </View>

        {/* Exercise Header & Illustration Card */}
        <GlassCard style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <View style={{ flex: 1 }}>
              <Badge label={`EXERCISE ${currentExerciseIndex + 1} OF ${exercises.length}`} variant="red" />
              <Text variant="h2" style={styles.exerciseTitle} numberOfLines={1}>
                {currentExercise.name}
              </Text>
              <Text variant="caption" style={styles.muscleText}>
                {currentExercise.targetMuscles}
              </Text>
            </View>

            <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfoModal(true)}>
              <Icon name="DotsThreeVertical" size={24} color={COLORS.dark.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Set Pills (Set 1, Set 2, Set 3...) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.setTabsRow}
          >
            {currentExercise.sets.map((set, idx) => {
              const isActive = activeSetIndex === idx;
              return (
                <TouchableOpacity
                  key={set.id}
                  style={[
                    styles.setPill,
                    isActive && styles.setPillActive,
                    set.completed && styles.setPillCompleted,
                  ]}
                  onPress={() => setActiveSetIndex(idx)}
                >
                  <Text
                    variant="caption"
                    style={[
                      styles.setPillText,
                      isActive && styles.setPillTextActive,
                      set.completed && styles.setPillTextCompleted,
                    ]}
                  >
                    Set {set.setNumber} {set.completed ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.addSetPill} onPress={handleAddSet}>
              <Icon name="Plus" size={16} color={COLORS.dark.accentGold} />
              <Text variant="caption" style={styles.addSetPillText}>
                Add
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </GlassCard>

        {/* Set Configuration Card */}
        <View style={styles.activeSetContainer}>
          {/* Set Type Selector Chips */}
          <View style={styles.setTypeRow}>
            {(['normal', 'warmup', 'dropset', 'failure'] as SetType[]).map((type) => (
              <Chip
                key={type}
                label={type === 'normal' ? 'Regular' : type.toUpperCase()}
                selected={currentSet?.setType === type}
                onPress={() => updateCurrentSet('setType', type)}
              />
            ))}
          </View>

          {/* Weight & Reps Large Inputs with Steppers */}
          <View style={styles.inputsRow}>
            {/* Weight Input Box */}
            <View style={styles.inputBox}>
              <Text variant="caption" style={styles.inputLabel}>
                WEIGHT (KG)
              </Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustWeight(-2.5)}>
                  <Text variant="h2" style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="numeric"
                  value={currentSet?.weight || ''}
                  onChangeText={(val) => updateCurrentSet('weight', val)}
                />
                <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustWeight(2.5)}>
                  <Text variant="h2" style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Reps Input Box */}
            <View style={styles.inputBox}>
              <Text variant="caption" style={styles.inputLabel}>
                REPS
              </Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustReps(-1)}>
                  <Text variant="h2" style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="numeric"
                  value={currentSet?.reps || ''}
                  onChangeText={(val) => updateCurrentSet('reps', val)}
                />
                <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustReps(1)}>
                  <Text variant="h2" style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Complete Set Big Checkmark Action */}
          <TouchableOpacity
            style={[styles.completeSetBtn, currentSet?.completed && styles.completeSetBtnDone]}
            activeOpacity={0.85}
            onPress={toggleSetComplete}
          >
            <Icon
              name="Check"
              size={32}
              color={currentSet?.completed ? '#FFFFFF' : COLORS.dark.textPrimary}
            />
            <Text variant="h3" style={styles.completeSetText}>
              {currentSet?.completed ? 'Set Completed! Tap to Undo' : `Complete Set ${currentSet?.setNumber || 1}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation Toolbar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navArrowBtn, currentExerciseIndex === 0 && styles.navArrowBtnDisabled]}
            disabled={currentExerciseIndex === 0}
            onPress={handlePrevExercise}
          >
            <Icon name="CaretLeft" size={22} color={currentExerciseIndex === 0 ? '#4A4D70' : '#FFFFFF'} />
            <Text variant="caption" style={{ color: currentExerciseIndex === 0 ? '#4A4D70' : '#FFFFFF' }}>
              Prev
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.restTimerBtn} onPress={() => setShowRestTimer(true)}>
            <Icon name="Clock" size={18} color={COLORS.dark.accentGold} />
            <Text variant="caption" style={styles.restTimerBtnText}>
              Rest (90s)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navArrowBtn, currentExerciseIndex === exercises.length - 1 && styles.navArrowBtnDisabled]}
            disabled={currentExerciseIndex === exercises.length - 1}
            onPress={handleNextExercise}
          >
            <Text variant="caption" style={{ color: currentExerciseIndex === exercises.length - 1 ? '#4A4D70' : '#FFFFFF' }}>
              Next
            </Text>
            <Icon name="CaretRight" size={22} color={currentExerciseIndex === exercises.length - 1 ? '#4A4D70' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>

        {/* Rest Timer Modal */}
        <RestTimerModal
          visible={showRestTimer}
          initialSeconds={restDuration}
          exerciseName={currentExercise.name}
          onClose={() => setShowRestTimer(false)}
        />

        {/* PR Celebration Modal */}
        <PRCelebrationModal
          visible={prCelebration.visible}
          exerciseName={prCelebration.exerciseName}
          prType={prCelebration.prType}
          value={prCelebration.value}
          onDismiss={() => {
            setPrCelebration((p) => ({ ...p, visible: false }));
            setShowRestTimer(true);
          }}
        />

        {/* Exercise Information Bottom Sheet */}
        <Modal visible={showInfoModal} transparent animationType="slide" onRequestClose={() => setShowInfoModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text variant="h3" style={styles.modalTitle}>{currentExercise.name}</Text>
                <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                  <Icon name="X" size={22} color={COLORS.dark.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text variant="caption" style={styles.modalKicker}>TARGET MUSCLES</Text>
              <Text variant="body" style={styles.modalBodyText}>{currentExercise.targetMuscles}</Text>

              <Text variant="caption" style={[styles.modalKicker, { marginTop: SPACING.md }]}>FORM INSTRUCTIONS</Text>
              <Text variant="bodySmall" style={styles.modalInstructions}>{currentExercise.instructions}</Text>

              <TouchableOpacity style={styles.modalActionBtn} onPress={() => setShowInfoModal(false)}>
                <Text variant="body" style={styles.modalActionBtnText}>Got It, Back to Lifting</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backIconBtn: {
    padding: SPACING.xs,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.dark.bgSecondary,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark.accentGold,
  },
  finishBtn: {
    backgroundColor: COLORS.dark.accentRed,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
  exerciseCard: {
    marginHorizontal: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  exerciseTitle: {
    color: COLORS.dark.textPrimary,
    marginTop: 4,
    marginBottom: 2,
  },
  muscleText: {
    color: COLORS.dark.textSecondary,
  },
  infoBtn: {
    padding: SPACING.xs,
  },
  setTabsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  setPill: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dark.bgInput,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  setPillActive: {
    borderColor: COLORS.dark.accentRed,
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
  },
  setPillCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: COLORS.dark.success,
  },
  setPillText: {
    color: COLORS.dark.textSecondary,
    fontWeight: '700',
  },
  setPillTextActive: {
    color: '#FFFFFF',
  },
  setPillTextCompleted: {
    color: COLORS.dark.success,
  },
  addSetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.dark.accentGold,
  },
  addSetPillText: {
    color: COLORS.dark.accentGold,
    fontWeight: 'bold',
  },
  activeSetContainer: {
    paddingHorizontal: SPACING.md,
    flex: 1,
    justifyContent: 'center',
  },
  setTypeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  inputBox: {
    flex: 1,
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputLabel: {
    color: COLORS.dark.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.dark.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    color: COLORS.dark.textPrimary,
    lineHeight: 32,
  },
  numericInput: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    minWidth: 64,
  },
  completeSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.dark.bgSecondary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.dark.accentRed,
  },
  completeSetBtnDone: {
    backgroundColor: COLORS.dark.success,
    borderColor: COLORS.dark.success,
  },
  completeSetText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: COLORS.dark.bgPrimary,
  },
  navArrowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: SPACING.sm,
  },
  navArrowBtnDisabled: {
    opacity: 0.4,
  },
  restTimerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.dark.bgSecondary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  restTimerBtnText: {
    color: COLORS.dark.accentGold,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 24, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.dark.bgSecondary,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.dark.textPrimary,
  },
  modalKicker: {
    color: COLORS.dark.accentGold,
    letterSpacing: 1.5,
  },
  modalBodyText: {
    color: COLORS.dark.textPrimary,
    marginTop: 2,
  },
  modalInstructions: {
    color: COLORS.dark.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  modalActionBtn: {
    backgroundColor: COLORS.dark.accentRed,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
