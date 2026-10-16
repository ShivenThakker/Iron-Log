import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
import { api } from '@/services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;

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
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/nutrition/daily/${today}`).catch(() => null);
      return res?.data ?? null;
    },
  });

  const { data: recentSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['recentSessions'],
    queryFn: async () => {
      const res = await api.get('/sessions/history').catch(() => null);
      return Array.isArray(res?.data) ? res.data.slice(0, 3) : [];
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
  const userName = user?.name ? user.name.split(' ')[0] : 'Lifter';
  const rank = gamificationData?.currentRank?.name || 'Rookie';
  const totalXp = gamificationData?.xpRecord?.total_xp || 0;
  const streak = gamificationData?.currentStreak || 3;

  // Nutrition calculations
  const caloriesConsumed = nutritionData?.totals?.calories || 1650;
  const caloriesTarget = profileData?.profile?.daily_calorie_target || 2500;
  const calRatio = Math.min(caloriesConsumed / (caloriesTarget || 2500), 1);
  const proteinG = nutritionData?.totals?.protein || 135;
  const carbsG = nutritionData?.totals?.carbs || 190;
  const fatG = nutritionData?.totals?.fats || 52;

  // Today's dynamic workout computation
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = daysOfWeek[new Date().getDay()];
  const activeDays = activeProgramData?.workoutDays || [];
  const todayWorkoutDay = activeDays.find((d: any) =>
    d.day_name?.toLowerCase().includes(todayDayName.toLowerCase())
  ) || activeDays[0];

  const todayWorkoutTitle = todayWorkoutDay?.day_name || (activeProgramData ? activeProgramData.name : 'Upper Body Hypertrophy A');
  const todayExercises = todayWorkoutDay?.exercises || [];
  const exerciseCount = todayExercises.length > 0 ? todayExercises.length : 5;
  const estimatedMin = exerciseCount * 10;

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refetchingProfile}
              onRefresh={onRefresh}
              tintColor={COLORS.dark.accentRed}
            />
          }
        >
          {/* Header Row */}
          <View style={styles.header}>
            <View>
              <Text variant="caption" style={styles.dateLabel}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
              </Text>
              <Text variant="h1" style={styles.greeting}>
                Let's grind, {userName}
              </Text>
            </View>

            <TouchableOpacity style={styles.profileBadge} onPress={() => router.push('/settings')}>
              <Badge label={`⚡ ${rank}`} variant="gold" />
            </TouchableOpacity>
          </View>

          {/* GymStreak Hero Carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / CARD_WIDTH);
              setActiveCardIndex(index);
            }}
            scrollEventThrottle={16}
            style={styles.carouselContainer}
          >
            {/* Card 1: Today's Workout */}
            <GlassCard style={styles.carouselCard}>
              <View style={styles.cardHeaderRow}>
                <Badge label="TODAY'S WORKOUT" variant="red" />
                <TouchableOpacity onPress={() => router.push('/program/builder')}>
                  <Text variant="caption" style={styles.seeAllLink}>
                    Edit Split →
                  </Text>
                </TouchableOpacity>
              </View>

              <Text variant="h2" style={styles.workoutTitle} numberOfLines={1}>
                {todayWorkoutTitle}
              </Text>

              <View style={styles.pillsRow}>
                {todayExercises.length > 0 ? (
                  todayExercises.slice(0, 3).map((ex: any, i: number) => (
                    <Badge key={i} label={ex.exercise?.name || ex.exercise_name || `Ex ${i + 1}`} variant="default" />
                  ))
                ) : (
                  <>
                    <Badge label="Chest" variant="default" />
                    <Badge label="Triceps" variant="default" />
                  </>
                )}
                <Text variant="caption" style={styles.durationText}>
                  {exerciseCount} Exercises • ~{estimatedMin} min
                </Text>
              </View>

              <View style={styles.cardActionWrapper}>
                <GradientButton
                  title="Start Workout"
                  icon={<Icon name="Play" size={18} color="#FFFFFF" />}
                  onPress={() => router.push('/workout/active')}
                />
              </View>
            </GlassCard>

            {/* Card 2: Daily Nutrition */}
            <GlassCard style={styles.carouselCard}>
              <View style={styles.cardHeaderRow}>
                <Badge label="DAILY NUTRITION" variant="gold" />
                <TouchableOpacity onPress={() => router.push('/(tabs)/nutrition')}>
                  <Text variant="caption" style={styles.seeAllLink}>
                    Full Log →
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.nutritionRow}>
                <ProgressRing
                  size={95}
                  strokeWidth={9}
                  progress={calRatio}
                  color={COLORS.dark.accentGold}
                >
                  <Text variant="mono" style={styles.ringValue}>
                    {caloriesConsumed}
                  </Text>
                  <Text variant="caption" style={styles.ringLabel}>
                    kcal
                  </Text>
                </ProgressRing>

                <View style={styles.macroBarsContainer}>
                  <View style={styles.macroItem}>
                    <View style={styles.macroTextRow}>
                      <Text variant="caption" style={styles.macroLabel}>Protein</Text>
                      <Text variant="caption" style={styles.macroValue}>{proteinG}g / 180g</Text>
                    </View>
                    <ProgressBar progress={Math.min(proteinG / 180, 1)} color={COLORS.dark.accentRed} />
                  </View>

                  <View style={styles.macroItem}>
                    <View style={styles.macroTextRow}>
                      <Text variant="caption" style={styles.macroLabel}>Carbs</Text>
                      <Text variant="caption" style={styles.macroValue}>{carbsG}g / 250g</Text>
                    </View>
                    <ProgressBar progress={Math.min(carbsG / 250, 1)} color={COLORS.dark.success} />
                  </View>

                  <View style={styles.macroItem}>
                    <View style={styles.macroTextRow}>
                      <Text variant="caption" style={styles.macroLabel}>Fats</Text>
                      <Text variant="caption" style={styles.macroValue}>{fatG}g / 70g</Text>
                    </View>
                    <ProgressBar progress={Math.min(fatG / 70, 1)} color={COLORS.dark.accentGold} />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.logMealBtn}
                onPress={() => router.push('/(tabs)/nutrition')}
              >
                <Text variant="bodySmall" style={styles.logMealBtnText}>
                  + Quick Log Meal
                </Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Card 3: Weekly Progress & Rank */}
            <GlassCard style={styles.carouselCard}>
              <View style={styles.cardHeaderRow}>
                <Badge label="WEEKLY GRIND" variant="blue" />
                <Text variant="caption" style={styles.seeAllLink}>
                  3 of 4 Sessions
                </Text>
              </View>

              <View style={styles.rankProgressRow}>
                <View style={styles.rankShield}>
                  <Text style={styles.shieldEmoji}>🛡️</Text>
                </View>
                <View style={styles.rankDetails}>
                  <Text variant="h3" style={styles.rankTitle}>
                    {rank}
                  </Text>
                  <Text variant="caption" style={styles.xpText}>
                    {totalXp} Total XP Earned
                  </Text>
                  <ProgressBar progress={0.65} color={COLORS.dark.accentGold} style={{ marginTop: 6 }} />
                </View>
              </View>

              <View style={styles.weekDotsRow}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                  const completed = idx === 0 || idx === 2 || idx === 3;
                  return (
                    <View key={idx} style={styles.dayDotCol}>
                      <View style={[styles.dayDot, completed && styles.dayDotCompleted]}>
                        {completed && <Icon name="Check" size={12} color="#FFFFFF" />}
                      </View>
                      <Text variant="caption" style={styles.dayLabel}>
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </GlassCard>
          </ScrollView>

          {/* Carousel Pagination Dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((idx) => (
              <View
                key={idx}
                style={[styles.carouselDot, activeCardIndex === idx && styles.carouselDotActive]}
              />
            ))}
          </View>

          {/* Quick Shortcuts */}
          <View style={styles.shortcutsRow}>
            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => router.push('/program/builder')}
            >
              <View style={[styles.shortcutIconBg, { backgroundColor: 'rgba(233, 69, 96, 0.15)' }]}>
                <Icon name="CalendarCheck" size={20} color={COLORS.dark.accentRed} />
              </View>
              <Text variant="caption" style={styles.shortcutText}>
                Plan Builder
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => router.push('/workout/active')}
            >
              <View style={[styles.shortcutIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Icon name="Barbell" size={20} color={COLORS.dark.accentGold} />
              </View>
              <Text variant="caption" style={styles.shortcutText}>
                Active Session
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => router.push('/ai/chat')}
            >
              <View style={[styles.shortcutIconBg, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
                <Icon name="Sparkle" size={20} color={COLORS.dark.aiPurple} />
              </View>
              <Text variant="caption" style={styles.shortcutText}>
                AI Coach
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => router.push('/(tabs)/body')}
            >
              <View style={[styles.shortcutIconBg, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <Icon name="Scales" size={20} color={COLORS.dark.success} />
              </View>
              <Text variant="caption" style={styles.shortcutText}>
                Log Weight
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent Workouts Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text variant="h3" style={styles.sectionTitle}>
                Recent Workouts
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/insights')}>
                <Text variant="caption" style={styles.seeAllLink}>
                  Analytics →
                </Text>
              </TouchableOpacity>
            </View>

            {recentSessions && recentSessions.length > 0 ? (
              recentSessions.map((session: any, index: number) => (
                <GlassCard key={session.id || index} style={styles.historyCard}>
                  <View style={styles.historyLeft}>
                    <View style={styles.workoutIconCircle}>
                      <Icon name="Barbell" size={20} color={COLORS.dark.accentRed} />
                    </View>
                    <View>
                      <Text variant="body" style={styles.historyName}>
                        {session.name || 'Strength Session'}
                      </Text>
                      <Text variant="caption" style={styles.historyMeta}>
                        {new Date(session.started_at || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {session.duration_seconds ? `${Math.round(session.duration_seconds / 60)} min` : '45 min'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text variant="mono" style={styles.volumeText}>
                      {session.total_volume_kg ? `${Math.round(session.total_volume_kg)} kg` : '3,850 kg'}
                    </Text>
                    <Text variant="caption" style={styles.historyMeta}>
                      Volume
                    </Text>
                  </View>
                </GlassCard>
              ))
            ) : (
              <GlassCard style={styles.emptyCard}>
                <Icon name="Barbell" size={28} color={COLORS.dark.textSecondary} />
                <Text variant="bodySmall" style={styles.emptyText}>
                  No recent workouts yet. Tap "Start Workout" above to crush your first session!
                </Text>
              </GlassCard>
            )}
          </View>
        </ScrollView>

        {/* Floating AI Coach Chat Bubble */}
        <TouchableOpacity
          style={styles.fabAi}
          activeOpacity={0.85}
          onPress={() => router.push('/ai/chat')}
        >
          <Icon name="Sparkle" size={24} color="#FFFFFF" />
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
    paddingHorizontal: SPACING.md,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  dateLabel: {
    color: COLORS.dark.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  greeting: {
    color: COLORS.dark.textPrimary,
  },
  profileBadge: {
    marginTop: 4,
  },
  carouselContainer: {
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  carouselCard: {
    width: CARD_WIDTH,
    marginRight: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  fireEmoji: {
    fontSize: 13,
  },
  streakNum: {
    color: COLORS.dark.accentRed,
    fontWeight: 'bold',
  },
  workoutTitle: {
    color: COLORS.dark.textPrimary,
    marginBottom: SPACING.xs,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  durationText: {
    color: COLORS.dark.textSecondary,
    marginLeft: SPACING.xs,
  },
  cardActionWrapper: {
    marginTop: SPACING.xs,
  },
  seeAllLink: {
    color: COLORS.dark.accentGold,
    fontWeight: '600',
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  ringValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ringLabel: {
    fontSize: 10,
    color: COLORS.dark.textSecondary,
  },
  macroBarsContainer: {
    flex: 1,
    gap: SPACING.xs,
  },
  macroItem: {
    marginBottom: 4,
  },
  macroTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  macroLabel: {
    color: COLORS.dark.textSecondary,
    fontSize: 11,
  },
  macroValue: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
    fontSize: 11,
  },
  logMealBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  logMealBtnText: {
    color: COLORS.dark.accentGold,
    fontWeight: 'bold',
  },
  rankProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  rankShield: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldEmoji: {
    fontSize: 26,
  },
  rankDetails: {
    flex: 1,
  },
  rankTitle: {
    color: COLORS.dark.textPrimary,
  },
  xpText: {
    color: COLORS.dark.accentGold,
    marginTop: 2,
  },
  weekDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: COLORS.dark.accentRed,
  },
  dayLabel: {
    color: COLORS.dark.textSecondary,
    fontSize: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginVertical: SPACING.md,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  carouselDotActive: {
    width: 18,
    backgroundColor: COLORS.dark.accentRed,
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  shortcutIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutText: {
    color: COLORS.dark.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.dark.textPrimary,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  workoutIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(233, 69, 96, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyName: {
    color: COLORS.dark.textPrimary,
    fontWeight: 'bold',
  },
  historyMeta: {
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  volumeText: {
    color: COLORS.dark.accentGold,
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  fabAi: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.dark.aiPurple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.dark.aiPurple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  fabPing: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.dark.accentGold,
    borderWidth: 2,
    borderColor: COLORS.dark.bgPrimary,
  },
});
