import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { ProgressRing } from '@/components/charts/ProgressRing';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_TYPOGRAPHY,
} from '@/constants/tokens';
import { api } from '@/services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ProgramExerciseItem {
  exercise?: { name?: string };
  exercise_name?: string;
}

interface WorkoutDayItem {
  id?: string;
  day_name?: string;
  exercises?: ProgramExerciseItem[];
}

interface SessionExerciseSet {
  weight_kg?: number;
  reps?: number;
  exercise?: { name?: string };
}

interface WorkoutSessionItem {
  id?: string;
  notes?: string;
  started_at?: string;
  duration_seconds?: number;
  exerciseSets?: SessionExerciseSet[];
}

export default function HomeDashboard() {
  const router = useRouter();
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Queries for dynamic dashboard data
  const { data: profileData, refetch: refetchProfile, isRefetching: refetchingProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await api.get('/users/profile').catch(() => null);
      return res?.data ?? null;
    },
  });

  const { data: gamificationData, refetch: refetchGamification } = useQuery({
    queryKey: ['gamificationDashboard'],
    queryFn: async () => {
      const res = await api.get('/gamification').catch(() => null);
      return res?.data ?? null;
    },
  });

  const { data: nutritionData, refetch: refetchNutrition } = useQuery({
    queryKey: ['nutritionDashboard'],
    queryFn: async () => {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const tzOffset = new Date().getTimezoneOffset();
      const res = await api.get(`/nutrition/daily/${today}?tzOffset=${tzOffset}`).catch(() => null);
      return res?.data ?? null;
    },
  });

  // Realigned query: replace /sessions/history (404) with real GET /sessions endpoint
  const { data: recentSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['recentSessions'],
    queryFn: async () => {
      const res = await api.get('/sessions').catch(() => null);
      return Array.isArray(res?.data) ? res.data.slice(0, 5) : [];
    },
  });

  const { data: activeProgramData, refetch: refetchActiveProgram } = useQuery({
    queryKey: ['activeProgram'],
    queryFn: async () => {
      const res = await api.get('/programs/active').catch(() => null);
      return res?.data ?? null;
    },
  });

  const onRefresh = async () => {
    await Promise.all([
      refetchProfile(),
      refetchGamification(),
      refetchNutrition(),
      refetchSessions(),
      refetchActiveProgram(),
    ]);
  };

  const user = profileData?.user;
  const userName = useMemo(() => (user?.name ? user.name.split(' ')[0] : 'Lifter'), [user?.name]);
  const rank = gamificationData?.currentRank?.name || 'Rookie';
  const totalXp = gamificationData?.xpRecord?.total_xp || 0;

  // Memoized nutrition calculations
  const { caloriesConsumed, caloriesTarget, calRatio, proteinG, carbsG, fatG } = useMemo(() => {
    const consumed = nutritionData?.totals?.calories ?? 0;
    const target = profileData?.profile?.daily_calorie_target || 2500;
    const ratio = Math.min(consumed / (target || 2500), 1);
    return {
      caloriesConsumed: consumed,
      caloriesTarget: target,
      calRatio: ratio,
      proteinG: nutritionData?.totals?.protein ?? 0,
      carbsG: nutritionData?.totals?.carbs ?? 0,
      fatG: nutritionData?.totals?.fats ?? 0,
    };
  }, [nutritionData?.totals, profileData?.profile?.daily_calorie_target]);

  // Memoized dynamic workout computation
  const { todayWorkoutDay, todayWorkoutTitle, todayExercises, exerciseCount, estimatedMin } = useMemo(() => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = daysOfWeek[new Date().getDay()];
    const activeDays: WorkoutDayItem[] = activeProgramData?.workoutDays || [];
    const foundDay =
      activeDays.find((d) => d.day_name?.toLowerCase().includes(todayDayName.toLowerCase())) || activeDays[0];

    const title = foundDay?.day_name || (activeProgramData ? activeProgramData.name : 'Upper Body Hypertrophy A');
    const exercises = foundDay?.exercises || [];
    const count = exercises.length > 0 ? exercises.length : 5;
    return {
      todayWorkoutDay: foundDay,
      todayWorkoutTitle: title,
      todayExercises: exercises,
      exerciseCount: count,
      estimatedMin: count * 10,
    };
  }, [activeProgramData]);

  const todayDateFormatted = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    []
  );

  const sessionCount = recentSessions?.length || 0;

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: sessionCount >= 4 ? 96 : sessionCount > 0 ? 44 : 16,
              flexGrow: sessionCount === 0 ? 1 : undefined,
            },
          ]}
          bounces={sessionCount >= 4}
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refetchingProfile}
              onRefresh={onRefresh}
              tintColor={OBSIDIAN_COLORS.voltLime}
            />
          }
        >
          {/* Top Greeting & Rank / Account Settings Row */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.dateLabel}>{todayDateFormatted.toUpperCase()}</Text>
              <Text style={styles.greeting}>Let's grind, {userName}</Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.rankBadgeHeader,
                  pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
                ]}
                unstable_pressDelay={0}
                onPress={() => router.push('/(tabs)/achievements')}
                accessibilityLabel="View Rank and Achievements"
              >
                <Icon name="Lightning" size={13} color={OBSIDIAN_COLORS.voltLime} weight="fill" />
                <Text style={styles.rankBadgeHeaderText}>{rank.toUpperCase()}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.settingsButton,
                  pressed && { opacity: 0.6, transform: [{ scale: 0.94 }] },
                ]}
                unstable_pressDelay={0}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.15)', borderless: true }}
                onPress={() => router.push('/settings')}
                accessibilityLabel="Account and Settings"
              >
                <Icon name="Gear" size={18} color={OBSIDIAN_COLORS.textWhite} weight="bold" />
              </Pressable>
            </View>
          </View>

          {/* Active Session Carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="center"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const index = Math.min(Math.max(Math.round(offsetX / SCREEN_WIDTH), 0), 2);
              if (index !== activeCardIndex) {
                setActiveCardIndex(index);
              }
            }}
            scrollEventThrottle={16}
            style={styles.carouselContainer}
            contentContainerStyle={styles.carouselScrollContent}
          >
            {/* Card 1: Today's Workout Hero */}
            <View style={styles.carouselSlide}>
              <View style={styles.carouselCard}>
                <View style={styles.glowUnderlay} />

                <View style={styles.cardHeaderRow}>
                  <View style={styles.workoutBadge}>
                    <Text style={styles.workoutBadgeText}>TODAY'S WORKOUT</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.editSplitLink,
                      pressed && { opacity: 0.6 },
                    ]}
                    unstable_pressDelay={0}
                    onPress={() => router.push('/program/builder')}
                  >
                    <Text style={styles.editSplitText}>EDIT SPLIT</Text>
                    <Icon name="CaretRight" size={14} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                  </Pressable>
                </View>

                <Text style={styles.workoutTitle} numberOfLines={1}>
                  {todayWorkoutTitle}
                </Text>

                {/* Category Chips & Duration */}
                <View style={styles.pillsRow}>
                  {todayExercises.length > 0 ? (
                    todayExercises.slice(0, 3).map((ex: ProgramExerciseItem, i: number) => (
                      <View key={i} style={styles.categoryChip}>
                        <Text style={styles.categoryChipText}>
                          {ex.exercise?.name || ex.exercise_name || `Ex ${i + 1}`}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <>
                      <View style={styles.categoryChip}>
                        <Text style={styles.categoryChipText}>Chest</Text>
                      </View>
                      <View style={styles.categoryChip}>
                        <Text style={styles.categoryChipText}>Triceps</Text>
                      </View>
                    </>
                  )}
                  <Text style={styles.durationMeta}>
                    {exerciseCount} Exercises • ~{estimatedMin} min
                  </Text>
                </View>

                {/* High-Energy Electric Volt Lime Start Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.startWorkoutBtn,
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                  ]}
                  unstable_pressDelay={0}
                  android_ripple={{ color: 'rgba(0, 0, 0, 0.2)' }}
                  onPress={() =>
                    router.push({
                      pathname: '/workout/preview',
                      params: {
                        dayId: todayWorkoutDay?.id || '',
                        workoutName: todayWorkoutTitle,
                      },
                    })
                  }
                >
                  <Icon name="Play" size={20} color={OBSIDIAN_COLORS.onPrimary} weight="fill" />
                  <Text style={styles.startWorkoutText}>Start Workout</Text>
                </Pressable>
              </View>
            </View>

            {/* Card 2: Daily Nutrition Overview */}
            <View style={styles.carouselSlide}>
              <View style={styles.carouselCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.workoutBadge, { borderColor: 'rgba(0, 227, 253, 0.3)', backgroundColor: 'rgba(0, 227, 253, 0.1)' }]}>
                    <Text style={[styles.workoutBadgeText, { color: OBSIDIAN_COLORS.cyanAccent }]}>DAILY NUTRITION</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editSplitLink}
                    activeOpacity={0.7}
                    onPress={() => router.push('/(tabs)/nutrition')}
                  >
                    <Text style={[styles.editSplitText, { color: OBSIDIAN_COLORS.cyanAccent }]}>FULL LOG</Text>
                    <Icon name="CaretRight" size={14} color={OBSIDIAN_COLORS.cyanAccent} weight="bold" />
                  </TouchableOpacity>
                </View>

                <View style={styles.nutritionRow}>
                  <ProgressRing
                    size={88}
                    strokeWidth={8}
                    progress={calRatio}
                    color={OBSIDIAN_COLORS.voltLime}
                  >
                    <Text style={styles.ringValue}>{caloriesConsumed}</Text>
                    <Text style={styles.ringLabel}>kcal</Text>
                  </ProgressRing>

                  <View style={styles.macroBarsContainer}>
                    <View style={styles.macroItem}>
                      <View style={styles.macroTextRow}>
                        <Text style={styles.macroLabel}>Protein</Text>
                        <Text style={styles.macroValue}>{proteinG}g / 180g</Text>
                      </View>
                      <ProgressBar progress={Math.min(proteinG / 180, 1)} color={OBSIDIAN_COLORS.coralAccent} />
                    </View>

                    <View style={styles.macroItem}>
                      <View style={styles.macroTextRow}>
                        <Text style={styles.macroLabel}>Carbs</Text>
                        <Text style={styles.macroValue}>{carbsG}g / 250g</Text>
                      </View>
                      <ProgressBar progress={Math.min(carbsG / 250, 1)} color={OBSIDIAN_COLORS.cyanAccent} />
                    </View>

                    <View style={styles.macroItem}>
                      <View style={styles.macroTextRow}>
                        <Text style={styles.macroLabel}>Fats</Text>
                        <Text style={styles.macroValue}>{fatG}g / 70g</Text>
                      </View>
                      <ProgressBar progress={Math.min(fatG / 70, 1)} color={OBSIDIAN_COLORS.voltLime} />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.quickLogBtn}
                  activeOpacity={0.8}
                  onPress={() => router.push('/(tabs)/nutrition')}
                >
                  <Text style={styles.quickLogBtnText}>+ Quick Log Meal</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Card 3: Weekly Grind & Rank */}
            <View style={styles.carouselSlide}>
              <View style={styles.carouselCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.workoutBadge, { borderColor: 'rgba(204, 255, 0, 0.3)', backgroundColor: 'rgba(204, 255, 0, 0.1)' }]}>
                    <Text style={styles.workoutBadgeText}>WEEKLY GRIND</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editSplitLink}
                    activeOpacity={0.7}
                    onPress={() => router.push('/(tabs)/achievements')}
                  >
                    <Text style={styles.editSplitText}>TROPHIES</Text>
                    <Icon name="CaretRight" size={14} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                  </TouchableOpacity>
                </View>

                <View style={styles.rankProgressRow}>
                  <View style={styles.rankShield}>
                    <Icon name="Trophy" size={24} color={OBSIDIAN_COLORS.voltLime} weight="fill" />
                  </View>
                  <View style={styles.rankDetails}>
                    <Text style={styles.rankTitle}>{rank}</Text>
                    <Text style={styles.xpText}>{totalXp.toLocaleString()} Total XP Earned</Text>
                    <ProgressBar progress={0.65} color={OBSIDIAN_COLORS.voltLime} style={{ marginTop: 6 }} />
                  </View>
                </View>

                <View style={styles.weekDotsRow}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                    const completed = idx === 0 || idx === 2 || idx === 3;
                    return (
                      <View key={idx} style={styles.dayDotCol}>
                        <View style={[styles.dayDot, completed && styles.dayDotCompleted]}>
                          {completed && <Icon name="Check" size={12} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />}
                        </View>
                        <Text style={[styles.dayLabel, completed && { color: OBSIDIAN_COLORS.voltLime }]}>
                          {day}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Carousel Pagination Indicators (Volt bar + dots) */}
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((idx) => (
              <View
                key={idx}
                style={[styles.carouselDot, activeCardIndex === idx && styles.carouselDotActive]}
              />
            ))}
          </View>

          {/* Quick Action Matrix (Unified Obsidian & Volt 3-Column Grid) */}
          <View style={styles.quickMatrix}>
            <Pressable
              style={({ pressed }) => [
                styles.quickActionBtn,
                pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
              ]}
              unstable_pressDelay={0}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
              onPress={() => router.push('/program/builder')}
            >
              <View style={styles.quickIconCircle}>
                <Icon name="CalendarCheck" size={20} color={OBSIDIAN_COLORS.voltLime} />
              </View>
              <Text style={styles.quickActionText}>PLAN{'\n'}BUILDER</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickActionBtn,
                pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
              ]}
              unstable_pressDelay={0}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
              onPress={() => router.push('/workout/import')}
            >
              <View style={styles.quickIconCircle}>
                <Icon name="Table" size={20} color={OBSIDIAN_COLORS.voltLime} />
              </View>
              <Text style={styles.quickActionText}>LOG PAST{'\n'}& IMPORT</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickActionBtn,
                pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
              ]}
              unstable_pressDelay={0}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
              onPress={() => router.push('/(tabs)/body')}
            >
              <View style={styles.quickIconCircle}>
                <Icon name="Scales" size={20} color={OBSIDIAN_COLORS.voltLime} />
              </View>
              <Text style={styles.quickActionText}>LOG{'\n'}WEIGHT</Text>
            </Pressable>
          </View>

          {/* Recent Workouts Activity Hub */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Workouts</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Pressable
                  style={({ pressed }) => [
                    styles.logPastLink,
                    pressed && { opacity: 0.6 },
                  ]}
                  unstable_pressDelay={0}
                  onPress={() => router.push('/workout/import')}
                >
                  <Icon name="Plus" size={12} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                  <Text style={styles.logPastLinkText}>LOG PAST</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.analyticsLink,
                    pressed && { opacity: 0.6 },
                  ]}
                  unstable_pressDelay={0}
                  onPress={() => router.push('/(tabs)/insights')}
                >
                  <Text style={styles.analyticsLinkText}>ANALYTICS</Text>
                  <Icon name="CaretRight" size={14} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                </Pressable>
              </View>
            </View>

            {recentSessions && recentSessions.length > 0 ? (
              (recentSessions as WorkoutSessionItem[]).map((session, index: number) => {
                const volume = session.exerciseSets?.reduce(
                  (acc: number, s: SessionExerciseSet) => acc + ((s.weight_kg || 0) * (s.reps || 0)),
                  0
                ) || 0;
                const formattedDate = new Date(session.started_at || Date.now()).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric' }
                );
                const durationMin = session.duration_seconds
                  ? Math.round(session.duration_seconds / 60)
                  : 45;
                const title =
                  session.notes ||
                  (session.exerciseSets?.[0]?.exercise?.name
                    ? `${session.exerciseSets[0].exercise.name} Focus`
                    : 'Strength Session');
                const setsCount = session.exerciseSets?.length || 0;

                return (
                  <TouchableOpacity
                    key={session.id || index}
                    style={styles.historyCard}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: '/workout/summary',
                        params: { sessionId: session.id },
                      })
                    }
                  >
                    <View style={styles.historyLeft}>
                      <View style={styles.workoutIconCircle}>
                        <Icon name="Barbell" size={20} color={OBSIDIAN_COLORS.voltLime} />
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyName} numberOfLines={1}>
                          {title}
                        </Text>
                        <Text style={styles.historyMeta}>
                          {formattedDate} • {durationMin} min{setsCount > 0 ? ` • ${setsCount} sets` : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.volumeText}>
                        {volume > 0 ? `${Math.round(volume).toLocaleString()} kg` : 'Bodyweight'}
                      </Text>
                      <Text style={styles.volumeLabel}>Volume</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Icon name="Barbell" size={22} color={OBSIDIAN_COLORS.voltLime} />
                </View>
                <View style={styles.emptyTextCol}>
                  <Text style={styles.emptyTitle}>Ready to begin</Text>
                  <Text style={styles.emptyText}>
                    Tap <Text style={styles.emptyVoltHighlight}>Start Workout</Text> above to log your first session.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating AI Coach Guidance Bubble */}
        <TouchableOpacity
          style={styles.fabAi}
          activeOpacity={0.85}
          onPress={() => router.push('/ai/chat')}
        >
          <Icon name="Sparkle" size={24} color={OBSIDIAN_COLORS.voltLime} />
          <View style={styles.fabPing} />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: OBSIDIAN_SPACING.sm,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: OBSIDIAN_SPACING.lg,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  dateLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
  },
  greeting: {
    ...OBSIDIAN_TYPOGRAPHY.headlineLg,
    color: OBSIDIAN_COLORS.textWhite,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: OBSIDIAN_RADIUS.full,
  },
  rankBadgeHeaderText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    marginHorizontal: -OBSIDIAN_SPACING.md,
  },
  carouselScrollContent: {
    alignItems: 'center',
  },
  carouselSlide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    alignItems: 'center',
  },
  carouselCard: {
    width: '100%',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    padding: OBSIDIAN_SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glowUnderlay: {
    position: 'absolute',
    bottom: -30,
    left: '15%',
    right: '15%',
    height: 70,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderRadius: 9999,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: OBSIDIAN_SPACING.md,
  },
  workoutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  workoutBadgeText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
  },
  editSplitLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  editSplitText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 12,
  },
  workoutTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineMd,
    color: OBSIDIAN_COLORS.textWhite,
    marginBottom: OBSIDIAN_SPACING.xs,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: OBSIDIAN_SPACING.md,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryChipText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  durationMeta: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    marginLeft: 4,
  },
  startWorkoutBtn: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    height: 52,
    borderRadius: OBSIDIAN_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  startWorkoutText: {
    color: OBSIDIAN_COLORS.onPrimary,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.lg,
    marginBottom: OBSIDIAN_SPACING.md,
  },
  ringValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    color: OBSIDIAN_COLORS.textWhite,
  },
  ringLabel: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  macroBarsContainer: {
    flex: 1,
    gap: 6,
  },
  macroItem: {
    marginBottom: 2,
  },
  macroTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  macroLabel: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  macroValue: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textWhite,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 11,
  },
  quickLogBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 10,
    borderRadius: OBSIDIAN_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickLogBtnText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.cyanAccent,
    fontSize: 12,
  },
  rankProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.md,
    marginBottom: OBSIDIAN_SPACING.lg,
  },
  rankShield: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankDetails: {
    flex: 1,
  },
  rankTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
  },
  xpText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.voltLime,
    marginTop: 2,
  },
  weekDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: OBSIDIAN_SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.borderGhost,
  },
  dayDotCol: {
    alignItems: 'center',
    gap: 4,
  },
  dayDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDotCompleted: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  dayLabel: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: OBSIDIAN_SPACING.md,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  carouselDotActive: {
    width: 20,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  quickMatrix: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: OBSIDIAN_SPACING.xl,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.lg,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 2,
    borderColor: OBSIDIAN_COLORS.voltLime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  quickActionText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    fontSize: 10,
    textAlign: 'center',
    color: OBSIDIAN_COLORS.textMuted,
    lineHeight: 14,
  },
  section: {
    marginBottom: OBSIDIAN_SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: OBSIDIAN_SPACING.md,
  },
  sectionTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
  },
  logPastLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: OBSIDIAN_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  logPastLinkText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 11,
  },
  analyticsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  analyticsLinkText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 12,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.lg,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    padding: OBSIDIAN_SPACING.md,
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.md,
    flex: 1,
    marginRight: OBSIDIAN_SPACING.sm,
  },
  workoutIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    ...OBSIDIAN_TYPOGRAPHY.bodyMd,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: OBSIDIAN_COLORS.textWhite,
  },
  historyMeta: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  volumeText: {
    ...OBSIDIAN_TYPOGRAPHY.bodyMd,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: OBSIDIAN_COLORS.voltLime,
  },
  volumeLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: 'rgba(24, 27, 37, 0.7)',
    borderRadius: OBSIDIAN_RADIUS.lg,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emptyIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTextCol: {
    flex: 1,
  },
  emptyTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    fontSize: 14,
    color: OBSIDIAN_COLORS.textWhite,
    marginBottom: 2,
  },
  emptyText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    lineHeight: 18,
  },
  emptyVoltHighlight: {
    color: OBSIDIAN_COLORS.voltLime,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  fabAi: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: 'rgba(204, 255, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 12,
  },
  fabPing: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    borderWidth: 2,
    borderColor: OBSIDIAN_COLORS.surfaceContainerLow,
  },
});
