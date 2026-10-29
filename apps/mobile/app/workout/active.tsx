import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Pressable,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { RestTimerModal } from '@/components/workout/RestTimerModal';
import { PRCelebrationModal } from '@/components/workout/PRCelebrationModal';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_TYPOGRAPHY,
} from '@/constants/tokens';
import { api, getCachedExercises } from '@/services/api';
import { workoutSync } from '@/services/workoutSync';

const formatStopwatch = (totalSec: number) => {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const WorkoutStopwatch = React.memo(({ onTick }: { onTick: (seconds: number) => void }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        onTick(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onTick]);

  return <Text style={styles.timerText}>{formatStopwatch(seconds)}</Text>;
});

type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

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
  restSeconds?: number;
  sets: ActiveSet[];
}

const DEFAULT_EXERCISES: ActiveExercise[] = [
  {
    id: 'ex-1',
    exerciseId: 'bench-press-1',
    name: 'Barbell Bench Press',
    targetMuscles: 'Chest, Triceps, Anterior Deltoids',
    instructions:
      'Keep your shoulder blades retracted and feet flat on the floor. Lower the barbell with control to mid-chest, then drive forcefully back up.',
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
    instructions:
      'Set bench to 30 degrees. Press dumbbells up in a slight arc, squeezing the upper chest at peak contraction.',
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
    instructions:
      'Keep elbows pinned to your sides. Push straight down, lock out the triceps, and control the eccentric return.',
    sets: [
      { id: 's-3-1', setNumber: 1, weight: '27.5', reps: '12', setType: 'normal', completed: false, synced: false },
      { id: 's-3-2', setNumber: 2, weight: '27.5', reps: '12', setType: 'normal', completed: false, synced: false },
    ],
  },
];

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dayId?: string; workoutName?: string }>();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<ActiveExercise[]>(DEFAULT_EXERCISES);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  // Timer states
  const elapsedSecondsRef = React.useRef(0);
  const handleStopwatchTick = React.useCallback((sec: number) => {
    elapsedSecondsRef.current = sec;
  }, []);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(90);

  // Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEffortGuide, setShowEffortGuide] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

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

  // User Personal Records per exercise (for 0ms instant local PR detection)
  const [knownPRs, setKnownPRs] = useState<
    Record<string, { weightKg: number; reps: number; estimated1RM: number }>
  >({});

  // Initialize session & fetch exercise list from active program or fallback
  useEffect(() => {
    const initSession = async () => {
      try {
        const [activeProgRes, sessionRes, exData, prsRes] = await Promise.all([
          api.get('/programs/active').catch(() => null),
          api.post('/sessions', { notes: params.workoutName || 'Workout Session' }),
          getCachedExercises().catch(() => []),
          api.get('/sessions/prs').catch(() => ({ data: [] })),
        ]);

        if (Array.isArray(prsRes?.data) && prsRes.data.length > 0) {
          const prMap: Record<string, { weightKg: number; reps: number; estimated1RM: number }> = {};
          for (const item of prsRes.data) {
            const data = {
              weightKg: item.weight_kg ?? 0,
              reps: item.reps ?? 1,
              estimated1RM: item.estimated_1rm_kg ?? ((item.weight_kg ?? 0) * (1 + (item.reps ?? 1) / 30)),
            };
            if (item.exercise_id) {
              prMap[item.exercise_id] = data;
            }
            if (item.exercise?.name) {
              prMap[item.exercise.name.toLowerCase().trim()] = data;
            }
          }
          setKnownPRs((prev) => ({ ...prev, ...prMap }));
        }

        if (sessionRes?.data?.id) {
          setSessionId(sessionRes.data.id);
        }

        const activeProg = activeProgRes?.data;
        if (activeProg && Array.isArray(activeProg.workoutDays) && activeProg.workoutDays.length > 0) {
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const todayName = daysOfWeek[new Date().getDay()];
          const matchedDay =
            activeProg.workoutDays.find((d: any) => d.id === params.dayId) ||
            activeProg.workoutDays.find((d: any) => d.day_name?.toLowerCase().includes(todayName.toLowerCase())) ||
            activeProg.workoutDays[0];

          if (matchedDay && Array.isArray(matchedDay.exercises) && matchedDay.exercises.length > 0) {
            const loadedExercises: ActiveExercise[] = matchedDay.exercises.map((dayEx: any, idx: number) => {
              const setsCount = dayEx.target_sets || 2;
              const targetReps = String(dayEx.target_reps || '10');
              const repMatch = targetReps.match(/\d+/);
              const repVal = repMatch ? repMatch[0] : '10';

              const sets: ActiveSet[] = Array.from({ length: setsCount }).map((_, sIdx) => ({
                id: `s-${idx + 1}-${sIdx + 1}-${Date.now()}`,
                setNumber: sIdx + 1,
                weight: '30',
                reps: repVal,
                setType: 'normal',
                completed: false,
                synced: false,
              }));

              return {
                id: `ex-${idx + 1}`,
                exerciseId: dayEx.exercise_id || dayEx.exercise?.id || `ex-${idx}`,
                name: dayEx.exercise?.name || dayEx.exercise_name || `Exercise ${idx + 1}`,
                targetMuscles: dayEx.exercise?.primary_muscle || 'Full Body',
                instructions: dayEx.exercise?.instructions || '',
                restSeconds: dayEx.rest_seconds ?? 90,
                sets,
              };
            });

            setExercises(loadedExercises);
            if (loadedExercises[0]?.restSeconds) {
              setRestDuration(loadedExercises[0].restSeconds);
            }
            return;
          }
        }

        // Fallback: map default exercises with real DB exercise IDs
        if (Array.isArray(exData) && exData.length > 0) {
          interface DbExerciseItem {
            id: string;
            name: string;
          }
          const dbExercises = (exData as DbExerciseItem[]).map((item) => ({ id: item.id, name: item.name }));

          setExercises((prev) =>
            prev.map((ex, idx) => {
              const matched = dbExercises.find(
                (db) =>
                  db.name.toLowerCase().includes(ex.name.toLowerCase()) ||
                  ex.name.toLowerCase().includes(db.name.toLowerCase())
              );
              const resolvedId = matched?.id || ex.exerciseId;
              return { ...ex, exerciseId: resolvedId };
            })
          );
        }
      } catch {
        // Fallback to offline active workout
      }
    };
    initSession();
  }, [params.dayId, params.workoutName]);

  // Synchronize rest duration when exercise changes
  useEffect(() => {
    if (exercises[currentExerciseIndex]?.restSeconds) {
      setRestDuration(exercises[currentExerciseIndex].restSeconds || 90);
    }
  }, [currentExerciseIndex, exercises]);

  const handleBackPress = () => {
    const hasCompletedSets = exercises.some((ex) => ex.sets.some((s) => s.completed));
    if (!hasCompletedSets) {
      if (sessionId) {
        api.delete(`/sessions/${sessionId}`).catch(() => {});
      }
      router.back();
    } else {
      setShowDiscardModal(true);
    }
  };

  const handleConfirmDiscard = async () => {
    setShowDiscardModal(false);
    if (sessionId) {
      await api.delete(`/sessions/${sessionId}`).catch(() => {});
    }
    router.back();
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBackPress();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [exercises, sessionId]);

  const currentExercise = exercises[currentExerciseIndex] || exercises[0];
  const currentSet = currentExercise?.sets[activeSetIndex] || currentExercise?.sets[0];

  const updateCurrentSet = <K extends 'weight' | 'reps' | 'setType'>(field: K, value: ActiveSet[K]) => {
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
    updateCurrentSet('weight', Number.isInteger(nextVal) ? nextVal.toString() : nextVal.toFixed(1));
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

  const setRepsPreset = (val: number) => {
    updateCurrentSet('reps', val.toString());
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
      const weightNum = parseFloat(currentSet.weight) || 0;
      const repsNum = parseInt(currentSet.reps, 10) || 1;
      const restSec = currentExercise.restSeconds ?? 90;
      setRestDuration(restSec);

      // Local estimated 1RM calculation: Brzycki/Epley formula (weight * (1 + reps / 30))
      const estimated1RM = weightNum * (1 + repsNum / 30);
      const isWarmup = currentSet.setType === 'warmup';
      const exId = currentExercise.exerciseId;
      const exName = currentExercise.name?.toLowerCase().trim();
      const existingPR = (exId && knownPRs[exId]) || (exName && knownPRs[exName]);

      const isLocalPR =
        !isWarmup &&
        weightNum > 0 &&
        (!existingPR || estimated1RM > (existingPR.estimated1RM ?? 0));

      if (isLocalPR) {
        // Record new PR locally so future sets in this session see the updated record
        const newPrData = { weightKg: weightNum, reps: repsNum, estimated1RM };
        setKnownPRs((prev) => ({
          ...prev,
          ...(exId ? { [exId]: newPrData } : {}),
          ...(exName ? { [exName]: newPrData } : {}),
        }));

        // Trigger PR celebration INSTANTLY (0ms latency!)
        setPrCelebration({
          visible: true,
          exerciseName: currentExercise.name,
          prType: 'Personal Record',
          value: `${weightNum} kg × ${repsNum} reps`,
        });
      } else {
        // Not a PR -> Start Rest Timer INSTANTLY (0ms latency!)
        setShowRestTimer(true);
      }

      // Auto advance to next set if available
      if (activeSetIndex < currentExercise.sets.length - 1) {
        setActiveSetIndex((prev) => prev + 1);
      }

      // Sync to API asynchronously in background without blocking UI
      if (sessionId && !currentSet.synced) {
        setExercises((prev) => {
          const copy = [...prev];
          const ex = { ...copy[currentExerciseIndex] };
          const sets = [...ex.sets];
          sets[activeSetIndex] = { ...sets[activeSetIndex], synced: true };
          ex.sets = sets;
          copy[currentExerciseIndex] = ex;
          return copy;
        });

        workoutSync
          .queueOrSendSet(sessionId, {
            exerciseId: currentExercise.exerciseId,
            setNumber: currentSet.setNumber,
            setType: currentSet.setType,
            reps: repsNum,
            weightKg: weightNum,
          })
          .then((res) => {
            // Fallback: if server detected a historical PR that client didn't know about
            if (res.isNewPR && !isLocalPR) {
              setPrCelebration({
                visible: true,
                exerciseName: currentExercise.name,
                prType: 'Personal Record',
                value: `${weightNum} kg × ${repsNum} reps`,
              });
            }
          })
          .catch(() => {
            // Offline queue already handled in workoutSync
          });
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

  const handleRemoveSet = (idxToRemove: number) => {
    if (currentExercise.sets.length <= 1) return;
    setExercises((prev) => {
      const copy = [...prev];
      const ex = { ...copy[currentExerciseIndex] };
      const updatedSets = ex.sets
        .filter((_, idx) => idx !== idxToRemove)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      ex.sets = updatedSets;
      copy[currentExerciseIndex] = ex;
      return copy;
    });
    if (activeSetIndex >= currentExercise.sets.length - 1) {
      setActiveSetIndex(Math.max(0, currentExercise.sets.length - 2));
    }
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

    const completedExercises = exercises
      .map((ex) => {
        const completedSets = ex.sets.filter((s) => s.completed);
        if (completedSets.length === 0) return null;
        const volumeStr = completedSets.map((s) => `${s.weight}kg × ${s.reps}`).join(' • ');
        return {
          name: ex.name,
          sets: `${completedSets.length} SET${completedSets.length > 1 ? 'S' : ''}`,
          volume: volumeStr,
        };
      })
      .filter((ex): ex is { name: string; sets: string; volume: string } => ex !== null);

    try {
      if (sessionId) {
        await workoutSync.finishSession(sessionId).catch(() => null);
      }
    } finally {
      router.replace({
        pathname: '/workout/summary',
        params: {
          workoutName: exercises[0]?.name ? `${exercises[0].name} Workout` : 'Workout Session',
          durationSeconds: String(elapsedSecondsRef.current),
          totalSets: String(totalSets),
          totalVolumeKg: String(totalVolume),
          xpEarned: String(50 + (prCelebration.visible ? 25 : 0)),
          sessionId: sessionId || '',
          hasPr: prCelebration.visible ? 'true' : 'false',
          prExercise: prCelebration.exerciseName,
          prValue: prCelebration.value,
          exerciseBreakdown: JSON.stringify(completedExercises),
        },
      });
    }
  };

  // Cumulative volume calculation
  const currentSetVolume =
    (parseFloat(currentSet?.weight || '0') || 0) * (parseInt(currentSet?.reps || '0', 10) || 0);

  const totalSessionVolume = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((setAcc, s) => {
        return setAcc + (parseFloat(s.weight) || 0) * (parseInt(s.reps, 10) || 0);
      }, 0)
    );
  }, 0);

  // RPE badge text
  const rpeByStyle: Record<SetType, string> = {
    normal: 'RPE 8.0',
    warmup: 'RPE 5.0',
    dropset: 'RPE 9.5',
    failure: 'RPE 10.0',
  };

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backIconBtn}
            activeOpacity={0.7}
            onPress={handleBackPress}
          >
            <Icon name="CaretLeft" size={22} color={OBSIDIAN_COLORS.textWhite} />
          </TouchableOpacity>

          <View style={styles.timerBadge}>
            <View style={styles.timerPulseDot} />
            <WorkoutStopwatch onTick={handleStopwatchTick} />
          </View>

          <TouchableOpacity
            style={styles.finishBtn}
            activeOpacity={0.8}
            onPress={handleFinishWorkout}
          >
            <Icon name="CheckCircle" size={16} color={OBSIDIAN_COLORS.textWhite} weight="bold" />
            <Text style={styles.finishBtnText}>END</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Workout Body */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise Context Header Card */}
          <View style={styles.exerciseCard}>
            <View style={styles.exerciseTopRow}>
              <View style={styles.exerciseBadgeRow}>
                <View style={styles.exerciseCountPill}>
                  <Text style={styles.exerciseCountText}>
                    EXERCISE {currentExerciseIndex + 1} OF {exercises.length}
                  </Text>
                </View>
                <View style={styles.compoundIndicator}>
                  <View style={styles.compoundDot} />
                  <Text style={styles.compoundText}>COMPOUND</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.infoBtn}
                activeOpacity={0.7}
                onPress={() => setShowInfoModal(true)}
              >
                <Icon name="DotsThreeVertical" size={20} color={OBSIDIAN_COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.exerciseTitle} numberOfLines={1}>
              {currentExercise.name}
            </Text>
            <Text style={styles.muscleText}>{currentExercise.targetMuscles}</Text>

            {/* Set Carousel Strip */}
            <View style={styles.setStripDivider} />
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
                    activeOpacity={0.8}
                    onPress={() => setActiveSetIndex(idx)}
                  >
                    <Icon
                      name={set.completed ? 'Check' : 'Barbell'}
                      size={14}
                      color={isActive ? OBSIDIAN_COLORS.onPrimary : set.completed ? '#22C55E' : OBSIDIAN_COLORS.textMuted}
                      weight="bold"
                    />
                    <Text
                      style={[
                        styles.setPillText,
                        isActive && styles.setPillTextActive,
                        set.completed && styles.setPillTextCompleted,
                      ]}
                    >
                      SET {set.setNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.addSetPill}
                activeOpacity={0.8}
                onPress={handleAddSet}
              >
                <Icon name="Plus" size={14} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                <Text style={styles.addSetPillText}>ADD</Text>
              </TouchableOpacity>

              {currentExercise.sets.length > 1 && (
                <TouchableOpacity
                  style={styles.removeSetPill}
                  activeOpacity={0.8}
                  onPress={() => handleRemoveSet(activeSetIndex)}
                >
                  <Icon name="Trash" size={14} color={OBSIDIAN_COLORS.coralAccent} />
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Performance Baseline Callout */}
            {(() => {
              const exId = currentExercise?.exerciseId;
              const exName = currentExercise?.name?.toLowerCase().trim();
              const currentExercisePR = (exId && knownPRs[exId]) || (exName && knownPRs[exName]);
              const prLabel = currentExercisePR
                ? `${currentExercisePR.weightKg} kg × ${currentExercisePR.reps}`
                : 'None logged yet';
              return (
                <View style={styles.baselineCallout}>
                  <View style={styles.baselineLeft}>
                    <Icon name="Trophy" size={14} color={OBSIDIAN_COLORS.voltLime} />
                    <Text style={styles.baselineLabel}>Best PR:</Text>
                    <Text style={styles.baselineValue}>{prLabel}</Text>
                  </View>
                  <Text style={styles.prBadgeText}>
                    {currentExercisePR ? `1RM ~${Math.round(currentExercisePR.estimated1RM)}kg` : 'PR CHALLENGE'}
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* Set Intensity / Type Segmented Selector */}
          <View style={styles.effortSection}>
            <View style={styles.effortHeaderRow}>
              <View style={styles.effortTitleWithInfo}>
                <Text style={styles.effortTitle}>TARGET EFFORT STYLE</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowEffortGuide(true)}
                  style={styles.effortInfoBtn}
                >
                  <Text style={styles.effortInfoQuestion}>?</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.rpeDisplay}>{rpeByStyle[currentSet?.setType || 'normal']}</Text>
            </View>

            {/* Effort Explanation Modal with outside-click dismiss */}
            <Modal
              visible={showEffortGuide}
              transparent
              animationType="fade"
              onRequestClose={() => setShowEffortGuide(false)}
            >
              <Pressable
                style={styles.modalBackdropDismiss}
                onPress={() => setShowEffortGuide(false)}
              >
                <Pressable
                  style={styles.effortGuideDialog}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.effortGuideHeader}>
                    <View style={styles.effortGuideHeaderTitle}>
                      <Icon name="Lightning" size={16} color={OBSIDIAN_COLORS.voltLime} />
                      <Text style={styles.effortGuideTitleText}>TARGET EFFORT & RPE GUIDE</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowEffortGuide(false)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.effortGuideCloseBtn}
                    >
                      <Icon name="X" size={16} color={OBSIDIAN_COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.effortGuideItems}>
                    <View style={styles.effortGuideItem}>
                      <Text style={[styles.effortGuideTag, { color: OBSIDIAN_COLORS.voltLime }]}>REGULAR</Text>
                      <Text style={styles.effortGuideDesc}>RPE 7.5-8.5 • 1-2 reps in reserve for optimal hypertrophy</Text>
                    </View>
                    <View style={styles.effortGuideItem}>
                      <Text style={[styles.effortGuideTag, { color: OBSIDIAN_COLORS.textWhite }]}>WARMUP</Text>
                      <Text style={styles.effortGuideDesc}>RPE 4-6 • Preps joints and motor patterns</Text>
                    </View>
                    <View style={styles.effortGuideItem}>
                      <Text style={[styles.effortGuideTag, { color: OBSIDIAN_COLORS.cyanAccent }]}>DROPSET</Text>
                      <Text style={styles.effortGuideDesc}>RPE 9-9.5 • Stripped weight immediately after failure</Text>
                    </View>
                    <View style={styles.effortGuideItem}>
                      <Text style={[styles.effortGuideTag, { color: OBSIDIAN_COLORS.coralAccent }]}>FAILURE</Text>
                      <Text style={styles.effortGuideDesc}>RPE 10.0 • Absolute maximum effort to 0 reps in reserve</Text>
                    </View>
                  </View>

                  <Text style={styles.effortGuideDismissHint}>Tap anywhere outside to close</Text>
                </Pressable>
              </Pressable>
            </Modal>

            {/* 4-Chip Segmented Selector */}
            <View style={styles.effortChipsGrid}>
              {(['normal', 'warmup', 'dropset', 'failure'] as SetType[]).map((type) => {
                const isSelected = currentSet?.setType === type;
                const labels: Record<SetType, string> = {
                  normal: 'Regular',
                  warmup: 'Warmup',
                  dropset: 'Dropset',
                  failure: 'Failure',
                };
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.effortChip,
                      isSelected && (
                        type === 'normal'
                          ? styles.effortChipSelectedNormal
                          : type === 'warmup'
                          ? styles.effortChipSelectedWarmup
                          : type === 'dropset'
                          ? styles.effortChipSelectedDropset
                          : styles.effortChipSelectedFailure
                      ),
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      updateCurrentSet('setType', type);
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.effortChipText,
                        isSelected && (
                          type === 'normal'
                            ? styles.effortChipTextSelectedNormal
                            : type === 'warmup'
                            ? styles.effortChipTextSelectedWarmup
                            : type === 'dropset'
                            ? styles.effortChipTextSelectedDropset
                            : styles.effortChipTextSelectedFailure
                        ),
                      ]}
                    >
                      {labels[type]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Stepper Input Cards */}
          <View style={styles.inputsContainer}>
            {/* WEIGHT CARD */}
            <View style={styles.stepperCard}>
              <View style={styles.stepperHeader}>
                <Text style={styles.stepperHeaderTitle}>WEIGHT LOAD</Text>
                <View style={styles.unitPill}>
                  <Text style={styles.unitPillActive}>KG</Text>
                  <Text style={styles.unitPillDivider}>/</Text>
                  <Text style={styles.unitPillInactive}>LB</Text>
                </View>
              </View>

              <View style={styles.dialRow}>
                <TouchableOpacity
                  style={styles.dialBtn}
                  activeOpacity={0.8}
                  onPress={() => adjustWeight(-2.5)}
                >
                  <Text style={styles.dialBtnIcon}>−</Text>
                </TouchableOpacity>

                <View style={styles.dialDisplay}>
                  <View style={styles.dialValueRow}>
                    <TextInput
                      style={styles.dialNumericInput}
                      keyboardType="numeric"
                      value={currentSet?.weight || ''}
                      onChangeText={(val) => updateCurrentSet('weight', val)}
                    />
                    <Text style={styles.dialUnit}>kg</Text>
                  </View>
                  <Text style={styles.dialSubtitle}>Bar + Plates (30kg/side)</Text>
                </View>

                <TouchableOpacity
                  style={styles.dialBtn}
                  activeOpacity={0.8}
                  onPress={() => adjustWeight(2.5)}
                >
                  <Text style={styles.dialBtnIcon}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Jump Buttons */}
              <View style={styles.quickJumpsGrid}>
                {[-5, -2.5, 2.5, 5].map((delta) => (
                  <TouchableOpacity
                    key={delta}
                    style={styles.quickJumpBtn}
                    activeOpacity={0.7}
                    onPress={() => adjustWeight(delta)}
                  >
                    <Text style={styles.quickJumpText}>
                      {delta > 0 ? `+${delta} kg` : `${delta} kg`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* REPS CARD */}
            <View style={styles.stepperCard}>
              <View style={styles.stepperHeader}>
                <Text style={styles.stepperHeaderTitle}>TARGET REPETITIONS</Text>
                <Text style={styles.repsTargetHint}>Target: 8-10</Text>
              </View>

              <View style={styles.dialRow}>
                <TouchableOpacity
                  style={styles.dialBtn}
                  activeOpacity={0.8}
                  onPress={() => adjustReps(-1)}
                >
                  <Text style={styles.dialBtnIcon}>−</Text>
                </TouchableOpacity>

                <View style={styles.dialDisplay}>
                  <View style={styles.dialValueRow}>
                    <TextInput
                      style={styles.dialNumericInput}
                      keyboardType="numeric"
                      value={currentSet?.reps || ''}
                      onChangeText={(val) => updateCurrentSet('reps', val)}
                    />
                    <Text style={styles.dialUnit}>reps</Text>
                  </View>
                  <Text style={styles.dialSubtitle}>Full extension & pause</Text>
                </View>

                <TouchableOpacity
                  style={styles.dialBtn}
                  activeOpacity={0.8}
                  onPress={() => adjustReps(1)}
                >
                  <Text style={styles.dialBtnIcon}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Rep Presets */}
              <View style={styles.quickJumpsGrid}>
                {[6, 8, 10, 12].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={styles.quickJumpBtn}
                    activeOpacity={0.7}
                    onPress={() => setRepsPreset(preset)}
                  >
                    <Text style={styles.quickJumpText}>{preset} Reps</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Primary High-Affordance Set Completion CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.completeSetBtn,
              currentSet?.completed && styles.completeSetBtnDone,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            unstable_pressDelay={0}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.2)' }}
            onPress={toggleSetComplete}
          >
            <Icon
              name="Check"
              size={24}
              color={currentSet?.completed ? '#FFFFFF' : OBSIDIAN_COLORS.onPrimary}
              weight="bold"
            />
            <Text
              style={[
                styles.completeSetText,
                currentSet?.completed && { color: '#FFFFFF' },
              ]}
            >
              {currentSet?.completed
                ? 'Set Completed! Tap to Undo'
                : `Complete Set ${currentSet?.setNumber || 1}`}
            </Text>
          </Pressable>

          {/* Workout Volume Micro Stats Bar */}
          <View style={styles.microStatsRow}>
            <View style={styles.microStatCard}>
              <Text style={styles.microStatLabel}>SET VOLUME</Text>
              <Text style={styles.microStatValue}>{Math.round(currentSetVolume)} kg</Text>
            </View>
            <View style={styles.microStatCard}>
              <Text style={styles.microStatLabel}>TARGET TEMPO</Text>
              <Text style={[styles.microStatValue, { color: OBSIDIAN_COLORS.cyanAccent }]}>
                3 - 1 - 1
              </Text>
            </View>
            <View style={styles.microStatCard}>
              <Text style={styles.microStatLabel}>SESSION LOAD</Text>
              <Text style={[styles.microStatValue, { color: OBSIDIAN_COLORS.voltLime }]}>
                {Math.round(totalSessionVolume).toLocaleString()} kg
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation & Rest Toolbar */}
        <View style={styles.footerToolbar}>
          <TouchableOpacity
            style={[
              styles.navFooterBtn,
              currentExerciseIndex === 0 && styles.navFooterBtnDisabled,
            ]}
            disabled={currentExerciseIndex === 0}
            activeOpacity={0.7}
            onPress={handlePrevExercise}
          >
            <Icon
              name="CaretLeft"
              size={20}
              color={currentExerciseIndex === 0 ? '#4A4D60' : OBSIDIAN_COLORS.textWhite}
              weight="bold"
            />
            <Text
              style={[
                styles.navFooterText,
                currentExerciseIndex === 0 && { color: '#4A4D60' },
              ]}
            >
              PREV
            </Text>
          </TouchableOpacity>

          <View style={styles.restToolbarCenter}>
            <TouchableOpacity
              style={styles.restAdjBtn}
              activeOpacity={0.7}
              onPress={() => setRestDuration((d) => Math.max(15, d - 15))}
            >
              <Text style={styles.restAdjText}>-15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restDisplayTrigger}
              activeOpacity={0.8}
              onPress={() => setShowRestTimer(true)}
            >
              <Icon name="Clock" size={16} color={OBSIDIAN_COLORS.voltLime} />
              <Text style={styles.restDisplayText}>{formatStopwatch(restDuration)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restAdjBtn}
              activeOpacity={0.7}
              onPress={() => setRestDuration((d) => d + 15)}
            >
              <Text style={styles.restAdjText}>+15s</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.navFooterBtn,
              styles.navFooterBtnNext,
              currentExerciseIndex === exercises.length - 1 && styles.navFooterBtnDisabled,
            ]}
            disabled={currentExerciseIndex === exercises.length - 1}
            activeOpacity={0.7}
            onPress={handleNextExercise}
          >
            <Text
              style={[
                styles.navFooterText,
                currentExerciseIndex === exercises.length - 1
                  ? { color: '#4A4D60' }
                  : { color: OBSIDIAN_COLORS.onPrimary },
              ]}
            >
              NEXT
            </Text>
            <Icon
              name="CaretRight"
              size={20}
              color={
                currentExerciseIndex === exercises.length - 1
                  ? '#4A4D60'
                  : OBSIDIAN_COLORS.onPrimary
              }
              weight="bold"
            />
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

        {/* Exercise Information Sheet */}
        <Modal
          visible={showInfoModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowInfoModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{currentExercise.name}</Text>
                <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                  <Icon name="X" size={22} color={OBSIDIAN_COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalKicker}>TARGET MUSCLES</Text>
              <Text style={styles.modalBodyText}>{currentExercise.targetMuscles}</Text>

              <Text style={[styles.modalKicker, { marginTop: OBSIDIAN_SPACING.md }]}>
                FORM INSTRUCTIONS
              </Text>
              <Text style={styles.modalInstructions}>{currentExercise.instructions}</Text>

              <TouchableOpacity
                style={styles.modalActionBtn}
                activeOpacity={0.85}
                onPress={() => setShowInfoModal(false)}
              >
                <Text style={styles.modalActionBtnText}>Got It, Back to Lifting</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Discard Workout Confirmation Modal */}
        <Modal
          visible={showDiscardModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDiscardModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Discard Workout?</Text>
                <TouchableOpacity onPress={() => setShowDiscardModal(false)} hitSlop={12}>
                  <Icon name="X" size={22} color={OBSIDIAN_COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.discardModalBody}>
                You have active sets in progress. If you exit now, this session will be discarded and will NOT be logged or saved to your workout history.
              </Text>

              <View style={styles.discardBtnRow}>
                <TouchableOpacity
                  style={styles.discardConfirmBtn}
                  activeOpacity={0.8}
                  onPress={handleConfirmDiscard}
                >
                  <Text style={styles.discardConfirmText}>Discard Workout</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.keepLiftingBtn}
                  activeOpacity={0.85}
                  onPress={() => setShowDiscardModal(false)}
                >
                  <Text style={styles.keepLiftingText}>Resume Workout</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: OBSIDIAN_COLORS.surface,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: OBSIDIAN_SPACING.xs,
    paddingBottom: OBSIDIAN_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backIconBtn: {
    width: 40,
    height: 40,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: OBSIDIAN_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
  timerPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  timerText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 15,
    color: OBSIDIAN_COLORS.voltLime,
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: OBSIDIAN_COLORS.coralAccent,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: OBSIDIAN_RADIUS.full,
  },
  finishBtnText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 11,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: OBSIDIAN_SPACING.md,
    paddingBottom: 110,
    gap: OBSIDIAN_SPACING.md,
  },
  exerciseCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exerciseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseCountPill: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: OBSIDIAN_RADIUS.full,
  },
  exerciseCountText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.onPrimary,
    fontSize: 10,
  },
  compoundIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compoundDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: OBSIDIAN_COLORS.cyanAccent,
  },
  compoundText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineLgMobile,
    color: OBSIDIAN_COLORS.textWhite,
    marginTop: 2,
  },
  muscleText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
    fontSize: 10,
  },
  setStripDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 12,
    marginBottom: 8,
  },
  setTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  setPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  setPillActive: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    borderColor: OBSIDIAN_COLORS.voltLime,
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  setPillCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22C55E',
  },
  setPillText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  setPillTextActive: {
    color: OBSIDIAN_COLORS.onPrimary,
  },
  setPillTextCompleted: {
    color: '#22C55E',
  },
  addSetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  addSetPillText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 11,
  },
  removeSetPill: {
    width: 32,
    height: 32,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: 'rgba(255, 70, 85, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  baselineCallout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  baselineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  baselineLabel: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  baselineValue: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textWhite,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 11,
  },
  prBadgeText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
  },
  effortSection: {
    gap: 6,
  },
  effortHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  effortTitleWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  effortTitle: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  effortInfoBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  effortInfoQuestion: {
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
  },
  rpeDisplay: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.cyanAccent,
    fontSize: 11,
  },
  modalBackdropDismiss: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: OBSIDIAN_SPACING.lg,
  },
  effortGuideDialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  effortGuideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 8,
  },
  effortGuideHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  effortGuideTitleText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 11,
  },
  effortGuideCloseBtn: {
    padding: 4,
  },
  effortGuideItems: {
    gap: 8,
  },
  effortGuideDismissHint: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textSlate,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
  },
  effortGuideCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.sm,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 6,
  },
  effortGuideItem: {
    paddingVertical: 2,
  },
  effortGuideTag: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    fontSize: 10,
    marginBottom: 1,
  },
  effortGuideDesc: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  effortChipsGrid: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    padding: 4,
    borderRadius: OBSIDIAN_RADIUS.lg,
  },
  effortChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effortChipSelectedNormal: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  effortChipSelectedWarmup: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  effortChipSelectedDropset: {
    backgroundColor: OBSIDIAN_COLORS.cyanAccent,
    shadowColor: OBSIDIAN_COLORS.cyanAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  effortChipSelectedFailure: {
    backgroundColor: OBSIDIAN_COLORS.coralAccent,
    shadowColor: OBSIDIAN_COLORS.coralAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  effortChipText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  effortChipTextSelectedNormal: {
    color: OBSIDIAN_COLORS.onPrimary,
    fontWeight: '700',
  },
  effortChipTextSelectedWarmup: {
    color: OBSIDIAN_COLORS.textWhite,
    fontWeight: '700',
  },
  effortChipTextSelectedDropset: {
    color: '#00363D',
    fontWeight: '700',
  },
  effortChipTextSelectedFailure: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputsContainer: {
    gap: OBSIDIAN_SPACING.md,
  },
  stepperCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  stepperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepperHeaderTitle: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  unitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: OBSIDIAN_RADIUS.md,
  },
  unitPillActive: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
  },
  unitPillDivider: {
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  unitPillInactive: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  repsTargetHint: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.cyanAccent,
    fontSize: 10,
  },
  dialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  dialBtn: {
    width: 52,
    height: 52,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialBtnIcon: {
    fontSize: 26,
    color: OBSIDIAN_COLORS.textWhite,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 30,
  },
  dialDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  dialNumericInput: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 36,
    color: OBSIDIAN_COLORS.textWhite,
    textAlign: 'center',
    minWidth: 80,
  },
  dialUnit: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 16,
    color: OBSIDIAN_COLORS.textMuted,
  },
  dialSubtitle: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
    marginTop: -2,
  },
  quickJumpsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickJumpBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    alignItems: 'center',
  },
  quickJumpText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  completeSetBtn: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    height: 56,
    borderRadius: OBSIDIAN_RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  completeSetBtnDone: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
  },
  completeSetText: {
    color: OBSIDIAN_COLORS.onPrimary,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  microStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  microStatCard: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.lg,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  microStatLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 9,
  },
  microStatValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.textWhite,
  },
  footerToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(11, 14, 23, 0.95)',
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.borderGhost,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: OBSIDIAN_SPACING.md,
    gap: 8,
  },
  navFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
  },
  navFooterBtnNext: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  navFooterBtnDisabled: {
    opacity: 0.35,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
  },
  navFooterText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 12,
  },
  restToolbarCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderRadius: OBSIDIAN_RADIUS.lg,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  restAdjBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
  },
  restAdjText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  restDisplayTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  restDisplayText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 15,
    color: OBSIDIAN_COLORS.voltLime,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 11, 16, 0.88)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderTopLeftRadius: OBSIDIAN_RADIUS.xl,
    borderTopRightRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.xl,
    borderTopWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineMd,
    color: OBSIDIAN_COLORS.textWhite,
  },
  modalKicker: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
  },
  modalBodyText: {
    ...OBSIDIAN_TYPOGRAPHY.bodyMd,
    color: OBSIDIAN_COLORS.textWhite,
  },
  modalInstructions: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    lineHeight: 18,
  },
  modalActionBtn: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    paddingVertical: 14,
    borderRadius: OBSIDIAN_RADIUS.lg,
    alignItems: 'center',
    marginTop: OBSIDIAN_SPACING.md,
  },
  modalActionBtnText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.onPrimary,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  discardModalBody: {
    ...OBSIDIAN_TYPOGRAPHY.bodyMd,
    color: OBSIDIAN_COLORS.textMuted,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: OBSIDIAN_SPACING.md,
  },
  discardBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: OBSIDIAN_SPACING.sm,
  },
  discardConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardConfirmText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: '#FF453A',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  keepLiftingBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepLiftingText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.onPrimary,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
