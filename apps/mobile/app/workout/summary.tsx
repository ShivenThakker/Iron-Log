import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_TYPOGRAPHY,
} from '@/constants/tokens';
import { api } from '@/services/api';

export default function PostWorkoutSummary() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    workoutName?: string;
    durationSeconds?: string;
    totalSets?: string;
    totalVolumeKg?: string;
    xpEarned?: string;
    sessionId?: string;
    hasPr?: string;
    prExercise?: string;
    prValue?: string;
    exerciseBreakdown?: string;
  }>();

  interface BreakdownItem {
    name: string;
    sets: string;
    volume: string;
  }

  const breakdownList: BreakdownItem[] = React.useMemo(() => {
    if (!params.exerciseBreakdown) return [];
    try {
      const parsed = JSON.parse(params.exerciseBreakdown);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.exerciseBreakdown]);

  const workoutName = params.workoutName || 'Workout Session';
  const durationSec = parseInt(params.durationSeconds || '0', 10);
  const durationMins = Math.max(1, Math.round(durationSec / 60));
  const totalSets = params.totalSets || '0';
  const totalVolumeNum = params.totalVolumeKg ? Math.round(parseFloat(params.totalVolumeKg)) : 0;
  const xpEarned = params.xpEarned || '50';

  // Gamification query to show real streak and rank progress
  const { data: gamificationData } = useQuery({
    queryKey: ['gamificationSummary'],
    queryFn: async () => {
      const res = await api.get('/gamification').catch(() => null);
      return res?.data ?? null;
    },
  });

  const currentRankName = gamificationData?.currentRank?.name || 'Vanguard';
  const currentStreak = gamificationData?.currentStreak || 5;
  const totalXp = gamificationData?.xpRecord?.total_xp || 780;
  const nextRankXp = gamificationData?.nextRank?.min_xp || 1000;
  const xpProgress = Math.min(1, totalXp / (nextRankXp || 1000));

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Crushed ${workoutName} on IronLog! 💪 Lifted ${totalVolumeNum.toLocaleString()} kg across ${totalSets} sets in ${durationMins} minutes. #IronLog #ObsidianKinetic`,
      });
    } catch {}
  };

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.7}
            onPress={() => router.replace('/(tabs)')}
          >
            <Icon name="X" size={22} color={OBSIDIAN_COLORS.textWhite} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Hero Celebration */}
          <View style={styles.heroSection}>
            <View style={styles.microBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.microBadgeText}>WORKOUT CRUSHED</Text>
            </View>

            <View style={styles.radiantHeroContainer}>
              <View style={styles.heroBlurRing} />
              <View style={styles.heroCircle}>
                <Icon name="Barbell" size={32} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
              </View>
            </View>

            <Text style={styles.celebrationTitle}>Session Complete!</Text>
            <Text style={styles.celebrationSubtitle}>{workoutName} • Today</Text>
          </View>

          {/* Primary Metric Stats Trio */}
          <View style={styles.statsTrioRow}>
            {/* Stat 1: Duration */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>DURATION</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statMetricText}>{durationMins}</Text>
                <Text style={styles.statUnitText}>m</Text>
              </View>
            </View>

            {/* Stat 2: Total Volume (Highlight Volt) */}
            <View style={[styles.statCard, styles.statCardVolt]}>
              <View style={styles.voltTopStripe} />
              <Text style={[styles.statLabel, { color: OBSIDIAN_COLORS.voltLime }]}>VOLUME</Text>
              <View style={styles.statValueRow}>
                <Text style={[styles.statMetricText, { color: OBSIDIAN_COLORS.voltLime }]}>
                  {totalVolumeNum.toLocaleString()}
                </Text>
                <Text style={[styles.statUnitText, { color: OBSIDIAN_COLORS.voltLime }]}>KG</Text>
              </View>
            </View>

            {/* Stat 3: Total Sets */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>SETS</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statMetricText}>{totalSets}</Text>
              </View>
            </View>
          </View>

          {/* Personal Record (PR) Card */}
          {params.hasPr === 'true' ? (
            <View style={styles.prCard}>
              <View style={styles.prLeftStripe} />
              <View style={styles.prContent}>
                <View style={styles.prIconBox}>
                  <Icon name="Trophy" size={22} color={OBSIDIAN_COLORS.voltLime} weight="fill" />
                </View>
                <View style={styles.prInfo}>
                  <Text style={styles.prTitle}>Personal Record Hit!</Text>
                  <Text style={styles.prDetail}>
                    {params.prExercise || 'Exercise'} — {params.prValue || 'New Record'}
                  </Text>
                </View>
                <View style={styles.prXpBadge}>
                  <Text style={styles.prXpText}>+25 XP</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Gamification / Streak & XP Card */}
          <View style={styles.gamificationCard}>
            <View style={styles.gamificationTop}>
              <View style={styles.xpInfoLeft}>
                <View style={styles.fireIconBox}>
                  <Icon name="Flame" size={20} color={OBSIDIAN_COLORS.voltLime} weight="fill" />
                </View>
                <View>
                  <Text style={styles.xpGainText}>+{xpEarned} XP</Text>
                  <Text style={styles.rankUpdatedText}>Rank Progress Updated</Text>
                </View>
              </View>

              <View style={styles.streakBadge}>
                <Icon name="Lightning" size={14} color={OBSIDIAN_COLORS.voltLime} weight="fill" />
                <Text style={styles.streakValue}>{currentStreak} Days</Text>
                <Text style={styles.streakLabel}>STREAK</Text>
              </View>
            </View>

            {/* Rank Progress Bar */}
            <View style={styles.rankProgressSection}>
              <View style={styles.rankProgressHeader}>
                <Text style={styles.rankTierName}>Tier • {currentRankName}</Text>
                <Text style={styles.rankXpNums}>
                  {totalXp} / {nextRankXp} XP
                </Text>
              </View>
              <ProgressBar progress={xpProgress} color={OBSIDIAN_COLORS.voltLime} />
            </View>
          </View>

          {/* Exercise Breakdown Section */}
          <View style={styles.breakdownSection}>
            <View style={styles.breakdownHeaderRow}>
              <Text style={styles.breakdownTitle}>Exercise Breakdown</Text>
              <View style={styles.breakdownCountBadge}>
                <Text style={styles.breakdownCountText}>
                  {breakdownList.length} {breakdownList.length === 1 ? 'EXERCISE' : 'EXERCISES'}
                </Text>
              </View>
            </View>

            {breakdownList.length > 0 ? (
              breakdownList.map((item, idx) => (
                <View key={idx} style={styles.breakdownCard}>
                  <View style={styles.breakdownInfo}>
                    <Text style={styles.exName}>{item.name}</Text>
                    <Text style={styles.exVolume}>{item.volume}</Text>
                  </View>
                  <View style={styles.setsPill}>
                    <Icon name="CheckCircle" size={14} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                    <Text style={styles.setsPillText}>{item.sets}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownInfo}>
                  <Text style={styles.exName}>Workout Completed</Text>
                  <Text style={styles.exVolume}>{totalSets} working sets completed</Text>
                </View>
              </View>
            )}
          </View>

          {/* Bottom Action Matrix */}
          <View style={styles.actionMatrix}>
            <TouchableOpacity
              style={styles.shareBtn}
              activeOpacity={0.8}
              onPress={handleShare}
            >
              <Icon name="ShareNetwork" size={20} color={OBSIDIAN_COLORS.textWhite} />
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              activeOpacity={0.88}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.doneText}>Done Lifting</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surface,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: OBSIDIAN_SPACING.xs,
    paddingBottom: OBSIDIAN_SPACING.xs,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: OBSIDIAN_SPACING.xs,
    paddingBottom: 60,
    gap: OBSIDIAN_SPACING.md,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: OBSIDIAN_SPACING.xs,
  },
  microBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  microBadgeText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  radiantHeroContainer: {
    position: 'relative',
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlurRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
  },
  heroCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  celebrationTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineLgMobile,
    color: OBSIDIAN_COLORS.textWhite,
    marginTop: 8,
  },
  celebrationSubtitle: {
    ...OBSIDIAN_TYPOGRAPHY.bodyMd,
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
  },
  statsTrioRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  statCardVolt: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    position: 'relative',
    overflow: 'hidden',
  },
  voltTopStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  statLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  statMetricText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 24,
    color: OBSIDIAN_COLORS.textWhite,
  },
  statUnitText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  prCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    position: 'relative',
    overflow: 'hidden',
  },
  prLeftStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  prContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 4,
  },
  prIconBox: {
    width: 42,
    height: 42,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prInfo: {
    flex: 1,
  },
  prTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 15,
  },
  prDetail: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
    fontSize: 11,
  },
  prXpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  prXpText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
  },
  gamificationCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 12,
  },
  gamificationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fireIconBox: {
    width: 36,
    height: 36,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpGainText: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 16,
  },
  rankUpdatedText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: OBSIDIAN_RADIUS.md,
  },
  streakValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.textWhite,
  },
  streakLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 9,
  },
  rankProgressSection: {
    gap: 6,
    paddingTop: 2,
  },
  rankProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankTierName: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  rankXpNums: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
  },
  breakdownSection: {
    gap: 8,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  breakdownTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 16,
  },
  breakdownCountBadge: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: OBSIDIAN_RADIUS.md,
  },
  breakdownCountText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 9,
  },
  breakdownCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownInfo: {
    flex: 1,
    paddingRight: 8,
  },
  exName: {
    ...OBSIDIAN_TYPOGRAPHY.bodyMd,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: OBSIDIAN_COLORS.textWhite,
  },
  exVolume: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
    fontSize: 11,
  },
  setsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: OBSIDIAN_RADIUS.md,
  },
  setsPillText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 10,
  },
  actionMatrix: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: OBSIDIAN_SPACING.sm,
  },
  shareBtn: {
    height: 54,
    paddingHorizontal: 20,
    borderRadius: OBSIDIAN_RADIUS.xl,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 14,
  },
  doneBtn: {
    flex: 1,
    height: 54,
    borderRadius: OBSIDIAN_RADIUS.xl,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  doneText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: OBSIDIAN_COLORS.onPrimary,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
