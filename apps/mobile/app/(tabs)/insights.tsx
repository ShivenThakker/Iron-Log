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
import { WorkoutActivityGrid } from '@/components/charts/WorkoutActivityGrid';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
} from '@/constants/tokens';
import { api } from '@/services/api';

const DEFAULT_HEATMAP_DATA: MuscleHeatmapData = {};

const DEFAULT_RADAR_SCORES: MuscleBalanceScores = {
  chest: 85,
  back: 65,
  shoulders: 50,
  biceps: 75,
  triceps: 80,
  forearms: 45,
  legs: 45,
  core: 30,
};

const DEFAULT_EQUIPMENT_DATA = [
  { name: 'Barbell', percentage: 42, color: OBSIDIAN_COLORS.voltLime },
  { name: 'Dumbbell', percentage: 28, color: OBSIDIAN_COLORS.cyanAccent },
  { name: 'Cable', percentage: 18, color: OBSIDIAN_COLORS.secondary },
  { name: 'Machine', percentage: 12, color: OBSIDIAN_COLORS.primaryFixedDim },
];

export default function InsightsTab() {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'all'>('30');

  const periodDays = timeRange === 'all' ? 365 : parseInt(timeRange, 10);

  // Realigned endpoint 1: GET /analytics/stats?period=...
  const { data: statsData, refetch: refetchStats, isRefetching } = useQuery({
    queryKey: ['analyticsStats', timeRange],
    queryFn: async () => {
      const param = timeRange === 'all' ? 'all' : periodDays;
      const res = await api.get(`/analytics/stats?period=${param}`).catch(() => null);
      return res?.data ?? null;
    },
  });

  // Realigned endpoint 2: GET /analytics/heatmap?period=...
  const { data: heatmapApiData, refetch: refetchHeatmap } = useQuery({
    queryKey: ['muscleHeatmap', timeRange],
    queryFn: async () => {
      const param = timeRange === 'all' ? 'all' : periodDays;
      const res = await api.get(`/analytics/heatmap?period=${param}`).catch(() => null);
      return res?.data ?? null;
    },
  });

  // Realigned endpoint 3: GET /analytics/radar?period=...
  const { data: radarApiData, refetch: refetchRadar } = useQuery({
    queryKey: ['muscleRadar', timeRange],
    queryFn: async () => {
      const param = timeRange === 'all' ? 'all' : periodDays;
      const res = await api.get(`/analytics/radar?period=${param}`).catch(() => null);
      return res?.data ?? null;
    },
  });

  // Realigned endpoint 4: GET /analytics/equipment
  const { data: equipmentApiData, refetch: refetchEquipment } = useQuery({
    queryKey: ['equipmentUsage'],
    queryFn: async () => {
      const res = await api.get('/analytics/equipment').catch(() => null);
      return res?.data ?? null;
    },
  });

  // Realigned endpoint 5: GET /analytics/activity
  const { data: activityApiData, refetch: refetchActivity } = useQuery({
    queryKey: ['workoutActivityYear'],
    queryFn: async () => {
      const res = await api.get('/analytics/activity').catch(() => null);
      return res?.data ?? null;
    },
  });

  const onRefresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchHeatmap(),
      refetchRadar(),
      refetchEquipment(),
      refetchActivity(),
    ]);
  };

  // Process Heatmap Data: API returns { muscles: { Chest: { intensity }, ... } }
  const heatmapData: MuscleHeatmapData = React.useMemo(() => {
    if (!heatmapApiData?.muscles) return DEFAULT_HEATMAP_DATA;
    const mapped: MuscleHeatmapData = {};
    for (const [key, val] of Object.entries(heatmapApiData.muscles)) {
      const lower = key.toLowerCase();
      const intensity = typeof val === 'object' && val !== null && 'intensity' in val
        ? Number((val as { intensity: unknown }).intensity) || 0
        : 0;
      mapped[lower] = intensity;
    }
    return mapped;
  }, [heatmapApiData]);

  // Process Radar Data: API returns [ { axis: 'Shoulders', value: 0.49 }, ... ]
  const radarScores: MuscleBalanceScores = React.useMemo(() => {
    if (!Array.isArray(radarApiData) || radarApiData.length === 0) return DEFAULT_RADAR_SCORES;
    const scores: MuscleBalanceScores = {};
    for (const item of radarApiData) {
      if (!item || !item.axis) continue;
      const key = item.axis.toLowerCase().trim() as keyof MuscleBalanceScores;
      const raw = item.value ?? 0;
      // Backend returns normalized 0.0 - 1.0 decimal; MuscleRadar expects 0 - 100 scale
      scores[key] = raw <= 1.0 && raw > 0 ? Math.round(raw * 100) : Math.round(raw);
    }
    return scores;
  }, [radarApiData]);

  const equilibrium = React.useMemo(() => {
    const rawScores = Object.values(radarScores).filter((v): v is number => typeof v === 'number');
    const nonZero = rawScores.filter((v) => v > 0);
    if (nonZero.length < 3) {
      return { label: 'BUILDING DATA', color: OBSIDIAN_COLORS.textMuted };
    }
    const avg = rawScores.reduce((sum, v) => sum + v, 0) / 8;
    const score = Math.max(10, Math.min(99, Math.round(avg * 0.85 + (nonZero.length / 8) * 30)));
    if (score >= 80) return { label: `${score}% OPTIMAL`, color: OBSIDIAN_COLORS.voltLime };
    if (score >= 60) return { label: `${score}% BALANCED`, color: OBSIDIAN_COLORS.cyanAccent };
    return { label: `${score}% DEVELOPING`, color: OBSIDIAN_COLORS.coralAccent };
  }, [radarScores]);

  interface EquipmentApiItem {
    name: string;
    count?: number;
    percentage: number;
  }

  // Process Equipment Data: API returns [ { name, count, percentage }, ... ]
  const equipmentData = React.useMemo(() => {
    if (!Array.isArray(equipmentApiData) || equipmentApiData.length === 0) {
      return DEFAULT_EQUIPMENT_DATA;
    }
    const colorMap: Record<string, string> = {
      Barbell: OBSIDIAN_COLORS.voltLime,
      Barbells: OBSIDIAN_COLORS.voltLime,
      Dumbbell: OBSIDIAN_COLORS.cyanAccent,
      Dumbbells: OBSIDIAN_COLORS.cyanAccent,
      Cable: OBSIDIAN_COLORS.secondary,
      Cables: OBSIDIAN_COLORS.secondary,
      Machine: OBSIDIAN_COLORS.primaryFixedDim,
      Machines: OBSIDIAN_COLORS.primaryFixedDim,
      Bodyweight: OBSIDIAN_COLORS.coralAccent,
      Custom: OBSIDIAN_COLORS.textMuted,
      Bands: OBSIDIAN_COLORS.voltLime,
    };
    return (equipmentApiData as EquipmentApiItem[]).map((item) => {
      const cleanName = item.name.trim();
      const normalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
      return {
        name: normalizedName,
        percentage: Math.round(item.percentage),
        color: colorMap[normalizedName] || colorMap[item.name] || OBSIDIAN_COLORS.voltLime,
      };
    });
  }, [equipmentApiData]);

  const totalVolumeKg = statsData?.totalVolumeKg ?? 0;
  const totalVolumeStr = totalVolumeKg >= 1000 ? `${(totalVolumeKg / 1000).toFixed(1)}k` : `${totalVolumeKg}`;
  const totalSessions = statsData?.totalSessions ?? 0;
  const avgDuration = Math.round(statsData?.avgSessionDurationMin ?? 0);
  const prsCount = statsData?.prCount ?? 0;

  return (
    <ScreenContainer scrollable={false} theme="obsidian">
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={OBSIDIAN_COLORS.voltLime}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text variant="labelCaps" style={styles.kicker}>ADVANCED ANALYTICS</Text>
              <Text variant="headlineLgMobile" style={styles.title}>Insights</Text>
            </View>
            <Badge label="Analytics" variant="volt" />
          </View>

          {/* Time Period Filter Pills */}
          <View style={styles.filterBar}>
            {([
              { key: '7', label: '7 DAYS' },
              { key: '30', label: '30 DAYS' },
              { key: '90', label: '90 DAYS' },
              { key: 'all', label: 'ALL TIME' },
            ] as const).map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterBtn, timeRange === f.key && styles.filterBtnActive]}
                onPress={() => setTimeRange(f.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    timeRange === f.key && styles.filterBtnTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Key Metrics 2x2 Bento Grid */}
          <View style={styles.bentoGrid}>
            {/* Total Volume */}
            <GlassCard variant="obsidianLevel1" style={styles.bentoCard}>
              <View style={styles.bentoHeader}>
                <Text variant="labelCaps" style={styles.bentoLabel}>Total Volume</Text>
                <View style={styles.bentoIconBox}>
                  <Icon name="Barbell" size={16} color={OBSIDIAN_COLORS.voltLime} />
                </View>
              </View>
              <View>
                <View style={styles.bentoValRow}>
                  <Text style={styles.bentoVal}>{totalVolumeStr}</Text>
                  <Text style={styles.bentoUnit}>KG</Text>
                </View>
                <View style={styles.bentoSubRow}>
                  <Icon name="ChartLineUp" size={12} color={OBSIDIAN_COLORS.voltLime} />
                  <Text style={styles.bentoTrendingText}>+8.4%</Text>
                  <Text style={styles.bentoSubMuted}>vs avg</Text>
                </View>
              </View>
            </GlassCard>

            {/* Completed Workouts */}
            <GlassCard variant="obsidianLevel1" style={styles.bentoCard}>
              <View style={styles.bentoHeader}>
                <Text variant="labelCaps" style={styles.bentoLabel}>Completed</Text>
                <View style={styles.bentoIconBox}>
                  <Icon name="CalendarCheck" size={16} color={OBSIDIAN_COLORS.cyanAccent} />
                </View>
              </View>
              <View>
                <View style={styles.bentoValRow}>
                  <Text style={styles.bentoVal}>{totalSessions}</Text>
                  <Text style={styles.bentoUnitMuted}>SESSIONS</Text>
                </View>
                <View style={styles.bentoSubRow}>
                  <View style={[styles.statusDot, { backgroundColor: OBSIDIAN_COLORS.cyanAccent }]} />
                  <Text style={[styles.bentoTrendingText, { color: OBSIDIAN_COLORS.cyanAccent }]}>Consistent</Text>
                  <Text style={styles.bentoSubMuted}>cadence</Text>
                </View>
              </View>
            </GlassCard>

            {/* Avg Session Length */}
            <GlassCard variant="obsidianLevel1" style={styles.bentoCard}>
              <View style={styles.bentoHeader}>
                <Text variant="labelCaps" style={styles.bentoLabel}>Avg Duration</Text>
                <View style={styles.bentoIconBox}>
                  <Icon name="Timer" size={16} color={OBSIDIAN_COLORS.voltLime} />
                </View>
              </View>
              <View>
                <View style={styles.bentoValRow}>
                  <Text style={styles.bentoVal}>{avgDuration}</Text>
                  <Text style={styles.bentoUnit}>MIN</Text>
                </View>
                <View style={styles.bentoSubRow}>
                  <Icon name="Lightning" size={12} color={OBSIDIAN_COLORS.voltLime} />
                  <Text style={styles.bentoSubMuted}>Target zone met</Text>
                </View>
              </View>
            </GlassCard>

            {/* PRs Set */}
            <GlassCard variant="obsidianLevel1" style={styles.bentoCard}>
              <View style={styles.bentoHeader}>
                <Text variant="labelCaps" style={styles.bentoLabel}>Records</Text>
                <View style={styles.bentoIconBox}>
                  <Icon name="Trophy" size={16} color={OBSIDIAN_COLORS.voltLime} />
                </View>
              </View>
              <View>
                <View style={styles.bentoValRow}>
                  <Text style={[styles.bentoVal, { color: OBSIDIAN_COLORS.voltLime }]}>{prsCount}</Text>
                  <Text style={styles.bentoUnitMuted}>NEW PRS</Text>
                </View>
                <View style={styles.bentoSubRow}>
                  <Icon name="Sparkle" size={12} color={OBSIDIAN_COLORS.voltLime} />
                  <Text style={[styles.bentoTrendingText, { color: OBSIDIAN_COLORS.voltLime }]}>Peak strength</Text>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* GitHub-style Year Workout Activity Grid */}
          <GlassCard variant="obsidianLevel1" style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View>
                <Text variant="headlineSm" style={styles.sectionCardTitle}>
                  Year-at-a-Glance Consistency
                </Text>
                <Text variant="labelCaps" style={styles.sectionCardSub}>
                  Annual 52-Week Workout Activity Matrix
                </Text>
              </View>
            </View>

            <WorkoutActivityGrid data={activityApiData} />
          </GlassCard>

          {/* Muscle Volume Heatmap Card */}
          <GlassCard variant="obsidianLevel1" style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View>
                <Text variant="headlineSm" style={styles.sectionCardTitle}>
                  Muscle Volume Heatmap
                </Text>
                <Text variant="labelCaps" style={styles.sectionCardSub}>
                  Dynamic 3D Biometric Distribution
                </Text>
              </View>
              <Badge label="VOLUME" variant="volt" size="sm" />
            </View>

            <MuscleHeatmap data={heatmapData} theme="obsidian" />
          </GlassCard>

          {/* Muscle Balance Radar Card */}
          <GlassCard variant="obsidianLevel1" style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View>
                <Text variant="headlineSm" style={styles.sectionCardTitle}>
                  Muscle Balance Radar
                </Text>
                <Text variant="labelCaps" style={styles.sectionCardSub}>
                  8-Axis Muscular Equilibrium
                </Text>
              </View>
              <Badge label="8-AXIS" variant="cyan" size="sm" />
            </View>

            <View style={{ alignItems: 'center', marginVertical: OBSIDIAN_SPACING.sm }}>
              <MuscleRadar scores={radarScores} size={280} theme="obsidian" />
            </View>

            <View style={styles.equilibriumRow}>
              <View style={styles.equilibriumLeft}>
                <Icon name="CheckCircle" size={16} color={equilibrium.color} />
                <Text variant="bodySm" style={{ color: OBSIDIAN_COLORS.textWhite }}>
                  Equilibrium Score
                </Text>
              </View>
              <Text variant="labelCaps" style={{ color: equilibrium.color, fontWeight: '700' }}>
                {equilibrium.label}
              </Text>
            </View>
          </GlassCard>

          {/* Equipment Distribution Section */}
          <GlassCard variant="obsidianLevel1" style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View>
                <Text variant="headlineSm" style={styles.sectionCardTitle}>
                  Equipment Distribution
                </Text>
                <Text variant="labelCaps" style={styles.sectionCardSub}>
                  Breakdown of Training Tools Used
                </Text>
              </View>
              <View style={styles.bentoIconBox}>
                <Icon name="ChartLineUp" size={16} color={OBSIDIAN_COLORS.textMuted} />
              </View>
            </View>

            <View style={styles.equipmentStack}>
              {equipmentData.map((item, idx) => (
                <View key={idx} style={styles.equipmentRow}>
                  <View style={styles.equipmentHeader}>
                    <Text variant="bodySm" style={{ color: OBSIDIAN_COLORS.textWhite, fontWeight: '500' }}>
                      {item.name}
                    </Text>
                    <Text variant="labelCaps" style={{ color: item.color, fontWeight: '700' }}>
                      {item.percentage}%
                    </Text>
                  </View>
                  <ProgressBar
                    progress={item.percentage / 100}
                    color={item.color}
                    trackColor={OBSIDIAN_COLORS.surfaceContainerHighest}
                    height={6}
                  />
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Weekly AI Coaching Summary Prompt */}
          <GlassCard variant="obsidianLevel2" style={styles.aiCoachingCard}>
            <View style={styles.aiIconCircle}>
              <Icon name="Robot" size={20} color={OBSIDIAN_COLORS.onPrimary} weight="fill" />
            </View>
            <View style={styles.aiTextCol}>
              <Text variant="headlineSm" style={{ color: OBSIDIAN_COLORS.textWhite }}>
                Hypertrophy Recommendation
              </Text>
              <Text variant="bodySm" style={styles.aiSummaryText}>
                Chest & Triceps are stimulated at peak volume, with Delts & Lats at moderate intensity. Prioritize horizontal rowing and posterior chain in your next 3 sessions to retain peak balance symmetry.
              </Text>
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
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: OBSIDIAN_SPACING.sm,
    marginBottom: OBSIDIAN_SPACING.xs,
  },
  kicker: {
    color: OBSIDIAN_COLORS.voltLime,
    letterSpacing: 1.5,
  },
  title: {
    color: OBSIDIAN_COLORS.textWhite,
    marginTop: 2,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: 3,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    marginBottom: OBSIDIAN_SPACING.md,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: OBSIDIAN_RADIUS.sm,
  },
  filterBtnActive: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  filterBtnText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.textSlate,
    letterSpacing: 0.5,
  },
  filterBtnTextActive: {
    color: OBSIDIAN_COLORS.onPrimary,
    fontWeight: '700',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: OBSIDIAN_SPACING.sm,
    marginBottom: OBSIDIAN_SPACING.md,
  },
  bentoCard: {
    width: '48.5%',
    padding: OBSIDIAN_SPACING.md,
    borderRadius: OBSIDIAN_RADIUS.xl,
    justifyContent: 'space-between',
    minHeight: 104,
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bentoLabel: {
    color: OBSIDIAN_COLORS.textMuted,
  },
  bentoIconBox: {
    width: 26,
    height: 26,
    borderRadius: OBSIDIAN_RADIUS.sm,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bentoVal: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 26,
    lineHeight: 30,
    color: OBSIDIAN_COLORS.textWhite,
  },
  bentoUnit: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
  },
  bentoUnitMuted: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 10,
    color: OBSIDIAN_COLORS.textSlate,
  },
  bentoSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  bentoTrendingText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.voltLime,
  },
  bentoSubMuted: {
    fontSize: 10,
    color: OBSIDIAN_COLORS.textSlate,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionCard: {
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    marginBottom: OBSIDIAN_SPACING.md,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  sectionCardTitle: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  sectionCardSub: {
    color: OBSIDIAN_COLORS.textSlate,
    marginTop: 2,
  },
  equilibriumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderRadius: OBSIDIAN_RADIUS.md,
    paddingVertical: OBSIDIAN_SPACING.sm,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    marginTop: OBSIDIAN_SPACING.xs,
  },
  equilibriumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  equipmentStack: {
    gap: OBSIDIAN_SPACING.md,
    marginTop: OBSIDIAN_SPACING.xs,
  },
  equipmentRow: {
    gap: 6,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiCoachingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: OBSIDIAN_SPACING.md,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    marginBottom: OBSIDIAN_SPACING.md,
  },
  aiIconCircle: {
    width: 38,
    height: 38,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  aiTextCol: {
    flex: 1,
  },
  aiSummaryText: {
    color: OBSIDIAN_COLORS.textMuted,
    lineHeight: 20,
    marginTop: 4,
  },
});
