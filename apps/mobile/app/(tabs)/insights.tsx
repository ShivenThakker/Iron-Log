import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { MuscleHeatmap, MuscleHeatmapData } from '@/components/charts/MuscleHeatmap';
import { MuscleRadar, MuscleBalanceScores } from '@/components/charts/MuscleRadar';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
import { api } from '@/services/api';

const DEFAULT_HEATMAP_DATA: MuscleHeatmapData = {
  chest: 0.85,
  back: 0.65,
  shoulders: 0.5,
  biceps: 0.7,
  triceps: 0.9,
  core: 0.3,
  quads: 0.45,
  hamstrings: 0.2,
  glutes: 0.4,
  calves: 0.15,
};

const DEFAULT_RADAR_SCORES: MuscleBalanceScores = {
  chest: 85,
  back: 65,
  shoulders: 50,
  arms: 80,
  legs: 45,
  core: 30,
};

const DEFAULT_EQUIPMENT_DATA = [
  { name: 'Barbell', percentage: 42, color: COLORS.dark.accentRed },
  { name: 'Dumbbells', percentage: 28, color: COLORS.dark.accentGold },
  { name: 'Cables', percentage: 18, color: COLORS.dark.accentCyan },
  { name: 'Machines', percentage: 12, color: COLORS.dark.success },
];

export default function InsightsTab() {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'all'>('30');

  // Fetch overview stats
  const { data: overviewData, refetch: refetchOverview, isRefetching } = useQuery({
    queryKey: ['analyticsOverview', timeRange],
    queryFn: async () => {
      const res = await api.get(`/analytics/overview?days=${timeRange}`).catch(() => null);
      return res?.data ?? null;
    },
  });

  // Fetch heatmap data
  const { data: heatmapApiData, refetch: refetchHeatmap } = useQuery({
    queryKey: ['muscleHeatmap', timeRange],
    queryFn: async () => {
      const res = await api.get(`/analytics/muscle-heatmap?days=${timeRange}`).catch(() => null);
      return res?.data ?? null;
    },
  });

  // Fetch radar balance data
  const { data: radarApiData, refetch: refetchRadar } = useQuery({
    queryKey: ['muscleBalance', timeRange],
    queryFn: async () => {
      const res = await api.get(`/analytics/muscle-balance?days=${timeRange}`).catch(() => null);
      return res?.data ?? null;
    },
  });

  // Fetch equipment usage distribution
  const { data: equipmentApiData, refetch: refetchEquipment } = useQuery({
    queryKey: ['equipmentDistribution', timeRange],
    queryFn: async () => {
      const res = await api.get('/analytics/equipment-distribution').catch(() => null);
      return res?.data ?? null;
    },
  });

  const onRefresh = async () => {
    await Promise.all([
      refetchOverview(),
      refetchHeatmap(),
      refetchRadar(),
      refetchEquipment(),
    ]);
  };

  const heatmapData: MuscleHeatmapData = heatmapApiData?.muscles || DEFAULT_HEATMAP_DATA;
  const radarScores: MuscleBalanceScores = radarApiData?.scores || DEFAULT_RADAR_SCORES;
  const equipmentData = equipmentApiData?.distribution || DEFAULT_EQUIPMENT_DATA;

  const totalVolume = overviewData?.total_volume_kg
    ? `${(overviewData.total_volume_kg / 1000).toFixed(1)}k`
    : '24.5k';
  const totalSessions = overviewData?.total_sessions || 14;
  const avgDuration = overviewData?.avg_duration_minutes || 48;
  const prsCount = overviewData?.prs_hit || 6;

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={COLORS.dark.accentRed}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text variant="caption" style={styles.kicker}>ADVANCED ANALYTICS</Text>
              <Text variant="h1" style={styles.title}>Insights</Text>
            </View>
            <Badge label="AI Powered" variant="gold" />
          </View>

          {/* Time Range Filter Bar */}
          <View style={styles.filterBar}>
            {[
              { key: '7', label: '7 Days' },
              { key: '30', label: '30 Days' },
              { key: '90', label: '90 Days' },
              { key: 'all', label: 'All Time' },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterBtn, timeRange === f.key && styles.filterBtnActive]}
                onPress={() => setTimeRange(f.key as any)}
              >
                <Text
                  variant="caption"
                  style={[styles.filterBtnText, timeRange === f.key && styles.filterBtnTextActive]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 2x2 Workout Stats Grid */}
          <View style={styles.statsGrid}>
            <GlassCard style={styles.statBox}>
              <View style={styles.statIconCircle}>
                <Icon name="Barbell" size={18} color={COLORS.dark.accentRed} />
              </View>
              <Text variant="mono" style={styles.statVal}>
                {totalVolume} kg
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                Total Volume Lifted
              </Text>
            </GlassCard>

            <GlassCard style={styles.statBox}>
              <View style={styles.statIconCircle}>
                <Icon name="CalendarCheck" size={18} color={COLORS.dark.accentGold} />
              </View>
              <Text variant="mono" style={styles.statVal}>
                {totalSessions}
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                Workouts Completed
              </Text>
            </GlassCard>

            <GlassCard style={styles.statBox}>
              <View style={styles.statIconCircle}>
                <Icon name="Clock" size={18} color={COLORS.dark.accentCyan} />
              </View>
              <Text variant="mono" style={styles.statVal}>
                {avgDuration}m
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                Avg. Session Length
              </Text>
            </GlassCard>

            <GlassCard style={styles.statBox}>
              <View style={styles.statIconCircle}>
                <Icon name="Trophy" size={18} color={COLORS.dark.success} />
              </View>
              <Text variant="mono" style={styles.statVal}>
                {prsCount}
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                Personal Records Set
              </Text>
            </GlassCard>
          </View>

          {/* Signature GymStreak Feature: Muscle Heatmap */}
          <GlassCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text variant="h3" style={styles.chartTitle}>
                  Muscle Volume Heatmap
                </Text>
                <Text variant="caption" style={styles.chartSubtitle}>
                  Dynamic 3D body volume distribution
                </Text>
              </View>
              <Badge label="GymStreak Engine" variant="red" />
            </View>

            <MuscleHeatmap data={heatmapData} />
          </GlassCard>

          {/* 6-Axis Muscle Balance Radar Chart */}
          <GlassCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text variant="h3" style={styles.chartTitle}>
                  Muscle Balance Radar
                </Text>
                <Text variant="caption" style={styles.chartSubtitle}>
                  6-axis symmetry and muscular equilibrium
                </Text>
              </View>
              <Badge label="Radar" variant="blue" />
            </View>

            <MuscleRadar scores={radarScores} size={280} />
          </GlassCard>

          {/* Equipment Distribution Card */}
          <GlassCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text variant="h3" style={styles.chartTitle}>
                  Equipment Distribution
                </Text>
                <Text variant="caption" style={styles.chartSubtitle}>
                  Breakdown of training tools used
                </Text>
              </View>
            </View>

            <View style={styles.equipmentBars}>
              {equipmentData.map((item: any, idx: number) => (
                <View key={idx} style={styles.equipItem}>
                  <View style={styles.equipHeader}>
                    <Text variant="bodySmall" style={styles.equipName}>
                      {item.name}
                    </Text>
                    <Text variant="caption" style={styles.equipPct}>
                      {item.percentage}%
                    </Text>
                  </View>
                  <ProgressBar progress={item.percentage / 100} color={item.color || COLORS.dark.accentRed} />
                </View>
              ))}
            </View>
          </GlassCard>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  kicker: {
    color: COLORS.dark.accentGold,
    letterSpacing: 1.5,
  },
  title: {
    color: COLORS.dark.textPrimary,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark.bgInput,
    borderRadius: RADIUS.full,
    padding: 3,
    marginBottom: SPACING.lg,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  filterBtnActive: {
    backgroundColor: COLORS.dark.accentRed,
  },
  filterBtnText: {
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statBox: {
    width: '48.5%',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  chartCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  chartTitle: {
    color: COLORS.dark.textPrimary,
  },
  chartSubtitle: {
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  equipmentBars: {
    gap: SPACING.md,
  },
  equipItem: {
    gap: 4,
  },
  equipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  equipName: {
    color: COLORS.dark.textPrimary,
  },
  equipPct: {
    color: COLORS.dark.accentGold,
    fontWeight: 'bold',
  },
});
