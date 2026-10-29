import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_TYPOGRAPHY,
} from '@/constants/tokens';
import { api, getCachedExercises } from '@/services/api';

interface PreviewExercise {
  id: string;
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  equipment?: string;
  categoryTag: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  instructions?: string;
  lastSession?: {
    weightKg: number;
    reps: number;
  };
  pr?: {
    weightKg: number;
    reps: number;
    estimated1RM?: number;
  };
}

const DEFAULT_PREVIEW_EXERCISES: PreviewExercise[] = [
  {
    id: 'p-1',
    exerciseId: 'bench-press-1',
    name: 'Barbell Bench Press',
    primaryMuscle: 'Chest, Triceps, Anterior Deltoids',
    equipment: 'Barbell',
    categoryTag: 'PRIMARY COMPOUND',
    targetSets: 4,
    targetReps: '8 - 10',
    restSeconds: 120,
    instructions:
      'Keep your shoulder blades retracted and feet flat on the floor. Lower the barbell with control to mid-chest, then drive forcefully back up.',
  },
  {
    id: 'p-2',
    exerciseId: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    primaryMuscle: 'Upper Chest, Anterior Deltoids',
    equipment: 'Dumbbell',
    categoryTag: 'HYPERTROPHY',
    targetSets: 3,
    targetReps: '10 - 12',
    restSeconds: 90,
    instructions:
      'Set bench to 30 degrees. Press dumbbells up in a slight arc, squeezing the upper chest at peak contraction.',
  },
  {
    id: 'p-3',
    exerciseId: 'cable-pushdowns',
    name: 'Tricep Cable Pushdown',
    primaryMuscle: 'Triceps (Lateral & Medial heads)',
    equipment: 'Cable',
    categoryTag: 'ISOLATION',
    targetSets: 3,
    targetReps: '12 - 15',
    restSeconds: 60,
    instructions:
      'Keep elbows pinned to your sides. Push straight down, lock out the triceps, and control the eccentric return.',
  },
];

export default function WorkoutPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dayId?: string; workoutName?: string }>();

  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<PreviewExercise[]>(DEFAULT_PREVIEW_EXERCISES);
  const [dayTitle, setDayTitle] = useState(params.workoutName || "Today's Workout");
  const [daySubtitle, setDaySubtitle] = useState('Scheduled Session');
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<PreviewExercise | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadSessionPreview = async () => {
      try {
        const [activeProgRes, historyRes, exData] = await Promise.all([
          api.get('/programs/active').catch(() => null),
          api.get('/sessions/exercise-history').catch(() => ({ data: {} })),
          getCachedExercises().catch(() => []),
        ]);

        if (!isMounted) return;

        const historyMap = historyRes?.data && typeof historyRes.data === 'object' ? historyRes.data : {};
        const activeProg = activeProgRes?.data;

        if (activeProg && Array.isArray(activeProg.workoutDays) && activeProg.workoutDays.length > 0) {
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const todayName = daysOfWeek[new Date().getDay()];
          const matchedDay =
            activeProg.workoutDays.find((d: any) => d.id === params.dayId) ||
            activeProg.workoutDays.find((d: any) => d.day_name?.toLowerCase().includes(todayName.toLowerCase())) ||
            activeProg.workoutDays[0];

          if (matchedDay) {
            setDayTitle(matchedDay.day_name || activeProg.name || 'Workout Session');
            setDaySubtitle(`${activeProg.name || 'Active Program'} • ${matchedDay.day_name || todayName}`);

            if (Array.isArray(matchedDay.exercises) && matchedDay.exercises.length > 0) {
              const loaded: PreviewExercise[] = matchedDay.exercises.map((dayEx: any, idx: number) => {
                const exId = dayEx.exercise_id || dayEx.exercise?.id || `ex-${idx}`;
                const name = dayEx.exercise?.name || dayEx.exercise_name || `Exercise ${idx + 1}`;
                const normName = name.toLowerCase().trim();
                const hist = historyMap[exId] || historyMap[normName];

                const setsCount = dayEx.target_sets || 3;
                const targetReps = String(dayEx.target_reps || '8 - 10');
                const restSeconds = dayEx.rest_seconds ?? 90;
                const equip = dayEx.exercise?.equipment || 'Gym';

                let tag = 'HYPERTROPHY';
                if (idx === 0 || setsCount >= 4) {
                  tag = 'PRIMARY COMPOUND';
                } else if (equip.toLowerCase().includes('cable') || equip.toLowerCase().includes('dumbbell') || targetReps.includes('12')) {
                  tag = 'ISOLATION';
                }

                return {
                  id: `prev-${idx + 1}`,
                  exerciseId: exId,
                  name,
                  primaryMuscle: dayEx.exercise?.primary_muscle || 'Full Body',
                  equipment: equip,
                  categoryTag: tag,
                  targetSets: setsCount,
                  targetReps,
                  restSeconds,
                  instructions: dayEx.exercise?.instructions || '',
                  lastSession: hist?.lastSession
                    ? { weightKg: hist.lastSession.weightKg, reps: hist.lastSession.reps }
                    : undefined,
                  pr: hist?.pr
                    ? { weightKg: hist.pr.weightKg, reps: hist.pr.reps, estimated1RM: hist.pr.estimated1RM }
                    : undefined,
                };
              });

              setExercises(loaded);
              setLoading(false);
              return;
            }
          }
        }

        // Fallback: match with default exercises
        if (Array.isArray(exData) && exData.length > 0) {
          interface DbExerciseItem {
            id: string;
            name: string;
            primary_muscle?: string;
            equipment?: string;
            instructions?: string;
          }
          const dbList = exData as DbExerciseItem[];

          setExercises((prev) =>
            prev.map((ex) => {
              const matched = dbList.find(
                (db) =>
                  db.name.toLowerCase().includes(ex.name.toLowerCase()) ||
                  ex.name.toLowerCase().includes(db.name.toLowerCase())
              );
              const resolvedId = matched?.id || ex.exerciseId;
              const hist = historyMap[resolvedId] || historyMap[ex.name.toLowerCase().trim()];
              return {
                ...ex,
                exerciseId: resolvedId,
                primaryMuscle: matched?.primary_muscle || ex.primaryMuscle,
                equipment: matched?.equipment || ex.equipment,
                instructions: matched?.instructions || ex.instructions,
                lastSession: hist?.lastSession
                  ? { weightKg: hist.lastSession.weightKg, reps: hist.lastSession.reps }
                  : undefined,
                pr: hist?.pr
                  ? { weightKg: hist.pr.weightKg, reps: hist.pr.reps, estimated1RM: hist.pr.estimated1RM }
                  : undefined,
              };
            })
          );
        }
      } catch {
        // Fallback gracefully to default previews
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSessionPreview();
    return () => {
      isMounted = false;
    };
  }, [params.dayId, params.workoutName]);

  const totalSets = useMemo(
    () => exercises.reduce((sum, ex) => sum + (ex.targetSets || 0), 0),
    [exercises]
  );

  const estimatedMinutes = useMemo(() => Math.round(totalSets * 2.5) + 5, [totalSets]);

  const handleStartWorkout = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
    router.push({
      pathname: '/workout/active',
      params: {
        dayId: params.dayId || '',
        workoutName: dayTitle,
      },
    });
  };

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="CaretLeft" size={20} color={OBSIDIAN_COLORS.textWhite} weight="bold" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerBadge}>WORKOUT PREVIEW</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {dayTitle}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={OBSIDIAN_COLORS.voltLime} />
            <Text style={styles.loadingText}>Loading today's exercises...</Text>
          </View>
        ) : (
          <>
            {/* Scrollable Exercise Plan List */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Overview Metrics Strip */}
              <View style={styles.statsStrip}>
                <View style={styles.statPill}>
                  <Icon name="Barbell" size={14} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                  <Text style={styles.statPillText}>{exercises.length} Exercises</Text>
                </View>
                <View style={styles.statPill}>
                  <Icon name="Flame" size={14} color={OBSIDIAN_COLORS.coralAccent} weight="fill" />
                  <Text style={styles.statPillText}>{totalSets} Total Sets</Text>
                </View>
                <View style={styles.statPill}>
                  <Icon name="Clock" size={14} color={OBSIDIAN_COLORS.cyanAccent} weight="bold" />
                  <Text style={styles.statPillText}>~{estimatedMinutes} Min</Text>
                </View>
              </View>

              {/* Section Header */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>TODAY'S EXERCISE LINEUP</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{exercises.length}</Text>
                </View>
              </View>

              {/* Exercise Cards */}
              {exercises.map((ex, exIdx) => {
                const hasLastSession = ex.lastSession && (ex.lastSession.weightKg > 0 || ex.lastSession.reps > 0);
                const hasPR = ex.pr && ex.pr.weightKg > 0;

                return (
                  <View key={ex.id || `ex-${exIdx}`} style={styles.exerciseCard}>
                    {/* Volt Left Accent Bar */}
                    <View style={styles.exerciseVoltBar} />

                    <View style={styles.exerciseCardContent}>
                      {/* Top Info Row */}
                      <View style={styles.exerciseTopRow}>
                        <View style={styles.exerciseInfoRow}>
                          <View style={styles.exerciseNumBox}>
                            <Text style={styles.exerciseNumText}>{exIdx + 1}</Text>
                          </View>
                          <View style={styles.exerciseTextGroup}>
                            <View style={styles.exerciseNameRow}>
                              <Text style={styles.exerciseNameText} numberOfLines={1}>
                                {ex.name}
                              </Text>
                              <TouchableOpacity
                                style={styles.exerciseInfoBtn}
                                activeOpacity={0.7}
                                onPress={() => setSelectedExerciseForModal(ex)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Icon name="Info" size={16} color={OBSIDIAN_COLORS.cyanAccent} />
                              </TouchableOpacity>
                            </View>

                            <View style={styles.exerciseMetaRow}>
                              <View style={styles.tagChip}>
                                <Text style={styles.tagChipText}>{ex.categoryTag}</Text>
                              </View>
                              <Text style={styles.muscleTargetText} numberOfLines={1}>
                                {ex.primaryMuscle}
                              </Text>
                              {ex.equipment ? (
                                <Text style={styles.equipmentText}>• {ex.equipment}</Text>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* 3 Metrics Parameter Grid */}
                      <View style={styles.metricsGrid}>
                        <View style={styles.metricBox}>
                          <Text style={styles.metricLabel}>TARGET VOLUME</Text>
                          <Text style={styles.metricValue}>{ex.targetSets} Sets</Text>
                        </View>

                        <View style={styles.metricBox}>
                          <Text style={styles.metricLabel}>TARGET REPS</Text>
                          <Text style={styles.metricValue}>{ex.targetReps}</Text>
                        </View>

                        <View style={styles.metricBox}>
                          <Text style={styles.metricLabel}>REST PERIOD</Text>
                          <Text style={styles.metricValue}>{ex.restSeconds}s</Text>
                        </View>
                      </View>

                      {/* Performance Baseline Strip */}
                      <View style={styles.baselineRow}>
                        <View style={styles.baselineItem}>
                          <Icon name="Clock" size={12} color={OBSIDIAN_COLORS.cyanAccent} />
                          <Text style={styles.baselineLabel}>Last Session:</Text>
                          <Text style={styles.baselineValue}>
                            {hasLastSession ? `${ex.lastSession!.weightKg} kg × ${ex.lastSession!.reps}` : '—'}
                          </Text>
                        </View>
                        <View style={styles.baselineItem}>
                          <Icon name="Trophy" size={12} color={OBSIDIAN_COLORS.voltLime} />
                          <Text style={styles.baselineLabel}>Best PR:</Text>
                          <Text style={[styles.baselineValue, { color: OBSIDIAN_COLORS.voltLime }]}>
                            {hasPR ? `${ex.pr!.weightKg} kg` : '—'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Pinned Bottom CTA (Fixed, never disappears on scroll) */}
            <View style={styles.fixedBottomContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.startWorkoutBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
                unstable_pressDelay={0}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.2)' }}
                onPress={handleStartWorkout}
              >
                <Icon name="Play" size={22} color={OBSIDIAN_COLORS.onPrimary} weight="fill" />
                <Text style={styles.startWorkoutText}>Start Workout • {totalSets} Sets</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Exercise Details & Instructions Modal */}
        <Modal
          visible={selectedExerciseForModal !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedExerciseForModal(null)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedExerciseForModal(null)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <Icon name="Barbell" size={18} color={OBSIDIAN_COLORS.voltLime} />
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {selectedExerciseForModal?.name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedExerciseForModal(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="X" size={18} color={OBSIDIAN_COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalMetaRow}>
                  <View style={styles.modalMetaItem}>
                    <Text style={styles.modalMetaLabel}>TARGET MUSCLES</Text>
                    <Text style={styles.modalMetaValue}>
                      {selectedExerciseForModal?.primaryMuscle || 'Full Body'}
                    </Text>
                  </View>
                  <View style={styles.modalMetaItem}>
                    <Text style={styles.modalMetaLabel}>EQUIPMENT</Text>
                    <Text style={styles.modalMetaValue}>
                      {selectedExerciseForModal?.equipment || 'Gym'}
                    </Text>
                  </View>
                </View>

                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsTitle}>FORM & COACHING INSTRUCTIONS</Text>
                  <Text style={styles.instructionsText}>
                    {selectedExerciseForModal?.instructions ||
                      'Maintain strict form, stabilize core, and control the eccentric movement through the full range of motion.'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalDismissBtn}
                activeOpacity={0.8}
                onPress={() => setSelectedExerciseForModal(null)}
              >
                <Text style={styles.modalDismissBtnText}>Got it</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerBadge: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
    letterSpacing: 1,
  },
  headerTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 17,
    marginTop: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: OBSIDIAN_SPACING.md,
    paddingBottom: 110, // Generous padding so last exercise isn't obstructed by pinned button
    gap: 12,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: OBSIDIAN_RADIUS.lg,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  statPillText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
  },
  countBadgeText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
  },
  exerciseCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.xl,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    position: 'relative',
    overflow: 'hidden',
  },
  exerciseVoltBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  exerciseCardContent: {
    padding: OBSIDIAN_SPACING.md,
    paddingLeft: OBSIDIAN_SPACING.md + 4,
    gap: 12,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  exerciseNumBox: {
    width: 24,
    height: 24,
    borderRadius: OBSIDIAN_RADIUS.sm,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  exerciseNumText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
  },
  exerciseTextGroup: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseNameText: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    fontSize: 15,
    color: OBSIDIAN_COLORS.textWhite,
    flexShrink: 1,
  },
  exerciseInfoBtn: {
    padding: 3,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: OBSIDIAN_RADIUS.sm,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
  },
  tagChipText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 9,
  },
  muscleTargetText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  equipmentText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  metricLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 9,
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.textWhite,
  },
  baselineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  baselineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 17, 21, 0.95)',
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  startWorkoutBtn: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    borderRadius: OBSIDIAN_RADIUS.full,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  startWorkoutText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 15,
    color: OBSIDIAN_COLORS.onPrimary,
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: OBSIDIAN_SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 8,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    fontSize: 15,
    color: OBSIDIAN_COLORS.textWhite,
    flex: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 12,
  },
  modalMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalMetaItem: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  modalMetaLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 9,
    marginBottom: 2,
  },
  modalMetaValue: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.textWhite,
  },
  instructionsBox: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 4,
  },
  instructionsTitle: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 9,
  },
  instructionsText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  modalDismissBtn: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderRadius: OBSIDIAN_RADIUS.lg,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  modalDismissBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.textWhite,
  },
});
