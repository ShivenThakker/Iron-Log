import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';

export default function PostWorkoutSummary() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    workoutName?: string;
    durationSeconds?: string;
    totalSets?: string;
    totalVolumeKg?: string;
    xpEarned?: string;
  }>();

  const workoutName = params.workoutName || 'Strength Workout';
  const durationSec = parseInt(params.durationSeconds || '2700', 10);
  const durationMins = Math.round(durationSec / 60);
  const totalSets = params.totalSets || '18';
  const totalVolume = params.totalVolumeKg ? `${Math.round(parseFloat(params.totalVolumeKg))} kg` : '4,320 kg';
  const xpEarned = params.xpEarned || '75';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Crushed ${workoutName} on IronLog! 💪 Lifted ${totalVolume} across ${totalSets} sets in ${durationMins} minutes. #IronLog #NeverStopLifting`,
      });
    } catch {}
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Celebration Header */}
        <View style={styles.header}>
          <View style={styles.trophyCircle}>
            <Text style={styles.trophyEmoji}>💪</Text>
          </View>
          <Badge label="WORKOUT CRUSHED" variant="gold" style={styles.badge} />
          <Text variant="h1" style={styles.title}>
            Session Complete!
          </Text>
          <Text variant="body" style={styles.workoutSub}>
            {workoutName}
          </Text>
        </View>

        {/* 3 Metric Stat Cards */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text variant="caption" style={styles.statLabel}>
              DURATION
            </Text>
            <Text variant="mono" style={styles.statValue}>
              {durationMins}m
            </Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text variant="caption" style={styles.statLabel}>
              VOLUME
            </Text>
            <Text variant="mono" style={[styles.statValue, { color: COLORS.dark.accentGold }]}>
              {totalVolume}
            </Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text variant="caption" style={styles.statLabel}>
              SETS
            </Text>
            <Text variant="mono" style={styles.statValue}>
              {totalSets}
            </Text>
          </GlassCard>
        </View>

        {/* PR Achievement Callout */}
        <GlassCard style={styles.prCard}>
          <View style={styles.prHeader}>
            <Text style={{ fontSize: 22 }}>🏆</Text>
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text variant="h3" style={styles.prTitle}>
                Personal Record Hit!
              </Text>
              <Text variant="bodySmall" style={styles.prDetail}>
                Barbell Bench Press — 100 kg 1RM
              </Text>
            </View>
            <Badge label="+25 XP" variant="gold" />
          </View>
        </GlassCard>

        {/* XP & Streak Banner */}
        <GlassCard style={styles.xpCard}>
          <View style={styles.xpRow}>
            <View style={styles.xpCol}>
              <Text style={{ fontSize: 28 }}>🔥</Text>
              <View>
                <Text variant="h2" style={styles.xpValue}>
                  +{xpEarned} XP
                </Text>
                <Text variant="caption" style={styles.xpSub}>
                  Rank progress updated
                </Text>
              </View>
            </View>
            <View style={styles.streakCol}>
              <Text variant="h3" style={styles.streakText}>
                5 Days
              </Text>
              <Text variant="caption" style={styles.streakSub}>
                Active Streak
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Exercise Breakdown Card */}
        <GlassCard style={styles.breakdownCard}>
          <Text variant="h3" style={styles.breakdownTitle}>
            Exercise Breakdown
          </Text>

          {[
            { name: 'Barbell Bench Press', sets: '3 sets', volume: '80kg × 8, 80kg × 8, 85kg × 6' },
            { name: 'Incline Dumbbell Press', sets: '2 sets', volume: '30kg × 10, 30kg × 10' },
            { name: 'Tricep Cable Pushdown', sets: '2 sets', volume: '27.5kg × 12, 27.5kg × 12' },
          ].map((item, idx) => (
            <View key={idx} style={styles.exerciseRow}>
              <View>
                <Text variant="body" style={styles.exName}>
                  {item.name}
                </Text>
                <Text variant="caption" style={styles.exVolume}>
                  {item.volume}
                </Text>
              </View>
              <Badge label={item.sets} variant="default" />
            </View>
          ))}
        </GlassCard>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Icon name="ShareNetwork" size={20} color={COLORS.dark.textPrimary} />
            <Text variant="body" style={styles.shareText}>
              Share
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 2 }}>
            <GradientButton title="Done Lifting 🏁" onPress={() => router.replace('/(tabs)')} />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  trophyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  trophyEmoji: {
    fontSize: 36,
  },
  badge: {
    marginBottom: SPACING.xs,
  },
  title: {
    color: COLORS.dark.textPrimary,
    textAlign: 'center',
  },
  workoutSub: {
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.dark.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  prCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prTitle: {
    color: COLORS.dark.accentGold,
  },
  prDetail: {
    color: COLORS.dark.textPrimary,
    marginTop: 2,
  },
  xpCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  xpValue: {
    color: COLORS.dark.accentGold,
    fontWeight: '900',
  },
  xpSub: {
    color: COLORS.dark.textSecondary,
  },
  streakCol: {
    alignItems: 'flex-end',
  },
  streakText: {
    color: COLORS.dark.accentRed,
    fontWeight: 'bold',
  },
  streakSub: {
    color: COLORS.dark.textSecondary,
  },
  breakdownCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  breakdownTitle: {
    color: COLORS.dark.textPrimary,
    marginBottom: SPACING.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  exName: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
  },
  exVolume: {
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.dark.bgSecondary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  shareText: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
  },
});
