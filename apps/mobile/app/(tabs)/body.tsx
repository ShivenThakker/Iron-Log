import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { GradientButton } from '@/components/ui/GradientButton';
import { Icon } from '@/components/ui/Icon';
import { WeightChart, WeightPoint } from '@/components/charts/WeightChart';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
} from '@/constants/tokens';
import { api } from '@/services/api';

const DEFAULT_WEIGHT_HISTORY: WeightPoint[] = [
  { date: 'Oct 01', weight: 80.5, movingAvg: 80.5 },
  { date: 'Oct 04', weight: 80.1, movingAvg: 80.3 },
  { date: 'Oct 07', weight: 79.8, movingAvg: 80.0 },
  { date: 'Oct 10', weight: 79.4, movingAvg: 79.7 },
  { date: 'Oct 13', weight: 79.0, movingAvg: 79.4 },
  { date: 'Oct 16', weight: 78.5, movingAvg: 79.0 },
];

export default function BodyTab() {
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<'30' | '90' | 'all'>('30');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showMeasureModal, setShowMeasureModal] = useState(false);
  const [showHeightModal, setShowHeightModal] = useState(false);

  // Form inputs
  const [inputWeight, setInputWeight] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [chestInput, setChestInput] = useState('');
  const [armsInput, setArmsInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [thighsInput, setThighsInput] = useState('');

  // User profile query (height & profile info)
  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await api.get('/users/profile').catch(() => null);
      return res?.data ?? null;
    },
  });

  // Realigned to real backend endpoint: GET /body/weight?period=30|90|all
  const { data: weightData, refetch: refetchWeight, isRefetching } = useQuery({
    queryKey: ['weightHistory', timeRange],
    queryFn: async () => {
      const res = await api.get(`/body/weight?period=${timeRange}`).catch(() => null);
      return res?.data ?? null;
    },
  });

  // Realigned to real backend endpoint: GET /body/measurement
  const { data: measurementData, refetch: refetchMeasurements } = useQuery({
    queryKey: ['bodyMeasurements'],
    queryFn: async () => {
      const res = await api.get('/body/measurement').catch(() => null);
      return res?.data ?? null;
    },
  });

  // Height update mutation: PATCH /users/profile
  const updateHeightMutation = useMutation({
    mutationFn: async (height: number) => {
      await api.patch('/users/profile', {
        height_cm: height,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setShowHeightModal(false);
      setHeightInput('');
    },
  });

  // Log weight mutation: POST /body/weight
  const logWeightMutation = useMutation({
    mutationFn: async (weight: number) => {
      await api.post('/body/weight', {
        weight_kg: weight,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightHistory'] });
      setShowWeightModal(false);
      setInputWeight('');
    },
  });

  // Log measurements mutation: POST /body/measurement (realigned singular endpoint)
  const logMeasureMutation = useMutation({
    mutationFn: async (measurements: Record<string, number>) => {
      await api.post('/body/measurement', {
        chest_cm: measurements.chest,
        left_arm_cm: measurements.arms,
        waist_cm: measurements.waist,
        left_thigh_cm: measurements.thighs,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyMeasurements'] });
      setShowMeasureModal(false);
      setChestInput('');
      setArmsInput('');
      setWaistInput('');
      setThighsInput('');
    },
  });

  interface BodyWeightRecord {
    id?: string;
    weight_kg: number | string;
    logged_at: string | Date;
    moving_avg_kg?: number | string;
  }

  const rawLogs = Array.isArray(weightData?.history)
    ? weightData.history
    : (weightData?.history?.history ?? []);
  const historyList: BodyWeightRecord[] = Array.isArray(rawLogs) ? rawLogs : [];

  const chartPoints: WeightPoint[] = React.useMemo(() => {
    if (historyList.length === 0) return [];
    return historyList.map((item) => ({
      date: new Date(item.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: Number(item.weight_kg),
      movingAvg: item.moving_avg_kg ? Number(item.moving_avg_kg) : undefined,
    }));
  }, [historyList]);

  const currentWeight = weightData?.currentWeight ??
    (chartPoints.length > 0 ? chartPoints[chartPoints.length - 1].weight : 78.5);
  const startWeight = weightData?.startingWeight ??
    (chartPoints.length > 0 ? chartPoints[0].weight : currentWeight);
  const deltaWeight = (currentWeight - startWeight).toFixed(1);
  const isLoss = Number(deltaWeight) <= 0;
  const goalWeight = weightData?.goal?.goal_weight_kg ??
    weightData?.history?.goal?.goal_weight_kg ?? 75.0;

  const latestMsmt = measurementData?.latest;
  const measurements = {
    chest: latestMsmt?.chest_cm ?? 104,
    arms: latestMsmt?.left_arm_cm ?? latestMsmt?.right_arm_cm ?? 39.5,
    waist: latestMsmt?.waist_cm ?? 83,
    thighs: latestMsmt?.left_thigh_cm ?? latestMsmt?.right_thigh_cm ?? 60,
  };

  // BMI Calculations based on height and latest logged weight
  const heightCm = profileData?.profile?.height_cm ?? 180;
  const heightM = heightCm / 100;
  const bmiVal = heightM > 0 && currentWeight > 0
    ? parseFloat((currentWeight / (heightM * heightM)).toFixed(1))
    : 24.2;

  const getBmiCategory = (val: number) => {
    if (val < 18.5) {
      return {
        label: 'Underweight',
        color: OBSIDIAN_COLORS.cyanAccent,
        sub: 'BMI < 18.5',
      };
    }
    if (val < 25.0) {
      return {
        label: 'Normal Weight',
        color: OBSIDIAN_COLORS.voltLime,
        sub: 'BMI 18.5 – 24.9',
      };
    }
    if (val < 30.0) {
      return {
        label: 'Overweight',
        color: '#FFB800',
        sub: 'BMI 25.0 – 29.9',
      };
    }
    return {
      label: 'Obese',
      color: OBSIDIAN_COLORS.coralAccent,
      sub: 'BMI ≥ 30.0',
    };
  };

  const bmiCategory = getBmiCategory(bmiVal);
  const minHealthyKg = (18.5 * heightM * heightM).toFixed(1);
  const maxHealthyKg = (24.9 * heightM * heightM).toFixed(1);
  const bmiScaleProgress = Math.min(Math.max(((bmiVal - 15) / (35 - 15)) * 100, 3), 97);

  const handleWeightSubmit = () => {
    const val = parseFloat(inputWeight);
    if (!val || val <= 0) return;
    logWeightMutation.mutate(val);
  };

  const handleMeasureSubmit = () => {
    logMeasureMutation.mutate({
      chest: parseFloat(chestInput) || measurements.chest,
      arms: parseFloat(armsInput) || measurements.arms,
      waist: parseFloat(waistInput) || measurements.waist,
      thighs: parseFloat(thighsInput) || measurements.thighs,
    });
  };

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
              onRefresh={() => {
                refetchWeight();
                refetchMeasurements();
                refetchProfile();
              }}
              tintColor={OBSIDIAN_COLORS.voltLime}
            />
          }
        >
          {/* Header Row */}
          <View style={styles.header}>
            <View>
              <Text variant="labelCaps" style={styles.kicker}>BODY COMPOSITION</Text>
              <Text variant="headlineLgMobile" style={styles.title}>BODY PROGRESS</Text>
            </View>
            <TouchableOpacity
              style={styles.quickLogBtn}
              onPress={() => setShowWeightModal(true)}
              activeOpacity={0.8}
            >
              <Icon name="Plus" size={16} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />
              <Text style={styles.quickLogText}>
                Log Weight
              </Text>
            </TouchableOpacity>
          </View>

          {/* Primary Weight Analytics Card */}
          <GlassCard variant="obsidianLevel1" style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View>
                <Text variant="labelCaps" style={styles.heroLabel}>CURRENT WEIGHT</Text>
                <View style={styles.weightNumRow}>
                  <Text style={styles.weightMainNum}>
                    {currentWeight}
                  </Text>
                  <Text style={styles.weightUnit}>
                    kg
                  </Text>
                </View>
              </View>

              <View style={styles.deltaBox}>
                <Badge
                  label={`${isLoss ? '↓' : '↑'} ${Math.abs(Number(deltaWeight))} kg`}
                  variant="volt"
                />
                <Text variant="bodySm" style={styles.deltaSub}>
                  {timeRange === '30' ? 'vs 30 days ago' : timeRange === '90' ? 'vs 90 days ago' : 'vs start'}
                </Text>
              </View>
            </View>

            {/* Time range filters */}
            <View style={styles.rangeRow}>
              <View style={styles.rangeTabs}>
                {(['30', '90', 'all'] as const).map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[styles.rangeTab, timeRange === range && styles.rangeTabActive]}
                    onPress={() => setTimeRange(range)}
                  >
                    <Text
                      style={[
                        styles.rangeTabText,
                        timeRange === range && styles.rangeTabTextActive,
                      ]}
                    >
                      {range === '30' ? 'Last 30 Days' : range === '90' ? 'Last 90 Days' : 'All Time'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Interactive Weight Chart with Moving Average and Volt glow */}
            <WeightChart data={chartPoints} goalWeight={goalWeight} theme="obsidian" />
          </GlassCard>

          {/* Body Measurements Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="Sparkle" size={18} color={OBSIDIAN_COLORS.voltLime} />
                <Text variant="headlineSm" style={styles.sectionTitle}>
                  Body Measurements
                </Text>
              </View>
              <TouchableOpacity
                style={styles.measureLogBtn}
                onPress={() => setShowMeasureModal(true)}
                activeOpacity={0.7}
              >
                <Icon name="Plus" size={14} color={OBSIDIAN_COLORS.voltLime} />
                <Text style={styles.measureLogBtnText}>Log</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.measureGridStack}>
              {[
                { label: 'Chest', value: measurements.chest, unit: 'cm', change: '+1.5 cm', isPositive: true, icon: 'ArrowFatUp' as const },
                { label: 'Arms / Biceps', value: measurements.arms, unit: 'cm', change: '+0.8 cm', isPositive: true, icon: 'ArrowFatUp' as const },
                { label: 'Waist', value: measurements.waist, unit: 'cm', change: '-2.0 cm', isPositive: true, icon: 'ArrowFatDown' as const },
                { label: 'Thighs', value: measurements.thighs, unit: 'cm', change: '+1.0 cm', isPositive: true, icon: 'ArrowFatUp' as const },
              ].map((row, idx) => (
                <GlassCard key={idx} variant="obsidianLevel1" style={styles.measureCardRow}>
                  <View style={styles.measureLeft}>
                    <View style={styles.measureIconCircle}>
                      <Icon name="ChartLineUp" size={18} color={OBSIDIAN_COLORS.voltLime} />
                    </View>
                    <View>
                      <Text variant="labelInteractive" style={styles.measureLabel}>{row.label}</Text>
                      <Text variant="bodySm" style={styles.measureSub}>Last updated 3 days ago</Text>
                    </View>
                  </View>
                  <View style={styles.measureRight}>
                    <View style={styles.measureValRow}>
                      <Text style={styles.measureValue}>{row.value}</Text>
                      <Text style={styles.measureUnit}>{row.unit}</Text>
                    </View>
                    <Badge label={row.change} variant="volt" size="sm" />
                  </View>
                </GlassCard>
              ))}
            </View>
          </View>

          {/* BMI & Body Composition Analytics Card */}
          <GlassCard variant="obsidianLevel1" style={styles.bmiCard}>
            <View style={styles.bmiHeader}>
              <View>
                <View style={styles.bmiTitleRow}>
                  <Icon name="Scales" size={18} color={OBSIDIAN_COLORS.voltLime} />
                  <Text variant="headlineSm" style={styles.bmiTitle}>Body Mass Index (BMI)</Text>
                </View>
                <Text variant="bodySm" style={styles.bmiSub}>Calculated from latest weight & height</Text>
              </View>

              <TouchableOpacity
                style={styles.heightBadgeBtn}
                onPress={() => {
                  setHeightInput(String(heightCm));
                  setShowHeightModal(true);
                }}
                activeOpacity={0.7}
              >
                <Icon name="PencilSimple" size={13} color={OBSIDIAN_COLORS.voltLime} />
                <Text style={styles.heightBadgeText}>{heightCm} cm</Text>
              </TouchableOpacity>
            </View>

            {/* Main Score and Category */}
            <View style={styles.bmiScoreRow}>
              <View style={styles.bmiScoreLeft}>
                <Text style={[styles.bmiScoreNum, { color: bmiCategory.color }]}>
                  {bmiVal.toFixed(1)}
                </Text>
                <View style={styles.bmiCategoryCol}>
                  <View style={[styles.categoryPill, { backgroundColor: `${bmiCategory.color}22`, borderColor: bmiCategory.color }]}>
                    <Text style={[styles.categoryPillText, { color: bmiCategory.color }]}>
                      {bmiCategory.label}
                    </Text>
                  </View>
                  <Text variant="bodySm" style={styles.bmiRangeText}>{bmiCategory.sub}</Text>
                </View>
              </View>

              <View style={styles.healthyRangeBox}>
                <Text variant="labelCaps" style={styles.healthyRangeLabel}>HEALTHY RANGE</Text>
                <Text style={styles.healthyRangeVal}>{minHealthyKg} – {maxHealthyKg} kg</Text>
              </View>
            </View>

            {/* Spectrum Bar with Indicator Pin */}
            <View style={styles.spectrumContainer}>
              <View style={styles.spectrumTrack}>
                <View style={[styles.spectrumSegment, { flex: 3.5, backgroundColor: OBSIDIAN_COLORS.cyanAccent }]} />
                <View style={[styles.spectrumSegment, { flex: 6.4, backgroundColor: OBSIDIAN_COLORS.voltLime }]} />
                <View style={[styles.spectrumSegment, { flex: 5.0, backgroundColor: '#FFB800' }]} />
                <View style={[styles.spectrumSegment, { flex: 5.1, backgroundColor: OBSIDIAN_COLORS.coralAccent }]} />
              </View>

              {/* Pin indicator */}
              <View style={[styles.spectrumIndicator, { left: `${bmiScaleProgress}%` }]}>
                <View style={[styles.spectrumPin, { borderColor: bmiCategory.color }]} />
              </View>
            </View>

            {/* Scale Labels */}
            <View style={styles.spectrumLabelsRow}>
              <Text style={styles.spectrumLabel}>Under (18.5)</Text>
              <Text style={styles.spectrumLabel}>Normal (25)</Text>
              <Text style={styles.spectrumLabel}>Over (30)</Text>
              <Text style={styles.spectrumLabel}>Obese</Text>
            </View>

            {/* Athlete Nuance Note */}
            <View style={styles.athleteNoteBox}>
              <Icon name="Info" size={15} color={OBSIDIAN_COLORS.voltLime} />
              <Text style={styles.athleteNoteText}>
                For lifters & athletes with high muscle mass, BMI may classify you as overweight even with low body fat.
              </Text>
            </View>
          </GlassCard>
        </ScrollView>

        {/* Log Weight Modal */}
        <Modal
          visible={showWeightModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWeightModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text variant="headlineSm" style={styles.modalTitle}>Log Today's Weight</Text>
                <TouchableOpacity onPress={() => setShowWeightModal(false)}>
                  <Icon name="X" size={20} color={OBSIDIAN_COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <Text variant="labelCaps" style={styles.modalLabel}>ENTER WEIGHT (KG)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                placeholder="e.g. 78.5"
                placeholderTextColor={OBSIDIAN_COLORS.textSlate}
                value={inputWeight}
                onChangeText={setInputWeight}
                autoFocus
              />

              <View style={styles.quickStepRow}>
                {[-0.5, -0.2, +0.2, +0.5].map((delta) => (
                  <TouchableOpacity
                    key={delta}
                    style={styles.quickStepBtn}
                    onPress={() => {
                      const cur = parseFloat(inputWeight) || currentWeight;
                      setInputWeight((cur + delta).toFixed(1));
                    }}
                  >
                    <Text style={styles.quickStepText}>{delta > 0 ? `+${delta}` : delta} kg</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <GradientButton
                variant="volt"
                title={logWeightMutation.isPending ? 'Saving...' : 'Save Weight Log'}
                onPress={handleWeightSubmit}
                loading={logWeightMutation.isPending}
                style={{ marginTop: OBSIDIAN_SPACING.md }}
              />
            </View>
          </View>
        </Modal>

        {/* Log Measurements Modal */}
        <Modal
          visible={showMeasureModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMeasureModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text variant="headlineSm" style={styles.modalTitle}>Log Measurements</Text>
                <TouchableOpacity onPress={() => setShowMeasureModal(false)}>
                  <Icon name="X" size={20} color={OBSIDIAN_COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.measureInputGrid}>
                <View style={{ flex: 1 }}>
                  <Text variant="labelCaps" style={styles.modalLabel}>CHEST (CM)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="104"
                    placeholderTextColor={OBSIDIAN_COLORS.textSlate}
                    value={chestInput}
                    onChangeText={setChestInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="labelCaps" style={styles.modalLabel}>ARMS (CM)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="39.5"
                    placeholderTextColor={OBSIDIAN_COLORS.textSlate}
                    value={armsInput}
                    onChangeText={setArmsInput}
                  />
                </View>
              </View>

              <View style={styles.measureInputGrid}>
                <View style={{ flex: 1 }}>
                  <Text variant="labelCaps" style={styles.modalLabel}>WAIST (CM)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="83"
                    placeholderTextColor={OBSIDIAN_COLORS.textSlate}
                    value={waistInput}
                    onChangeText={setWaistInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="labelCaps" style={styles.modalLabel}>THIGHS (CM)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="60"
                    placeholderTextColor={OBSIDIAN_COLORS.textSlate}
                    value={thighsInput}
                    onChangeText={setThighsInput}
                  />
                </View>
              </View>

              <GradientButton
                variant="volt"
                title={logMeasureMutation.isPending ? 'Saving...' : 'Save Measurements'}
                onPress={handleMeasureSubmit}
                loading={logMeasureMutation.isPending}
                style={{ marginTop: OBSIDIAN_SPACING.lg }}
              />
            </View>
          </View>
        </Modal>

        {/* Height Update Modal */}
        <Modal
          visible={showHeightModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowHeightModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text variant="headlineSm" style={styles.modalTitle}>Set Height</Text>
                <TouchableOpacity onPress={() => setShowHeightModal(false)}>
                  <Icon name="X" size={20} color={OBSIDIAN_COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <Text variant="labelCaps" style={styles.modalLabel}>HEIGHT (CM)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                placeholder="e.g. 180"
                placeholderTextColor={OBSIDIAN_COLORS.textSlate}
                value={heightInput}
                onChangeText={setHeightInput}
                autoFocus
              />

              <GradientButton
                variant="volt"
                title={updateHeightMutation.isPending ? 'Saving...' : 'Save Height'}
                onPress={() => {
                  const val = parseFloat(heightInput);
                  if (val && val > 50 && val < 250) {
                    updateHeightMutation.mutate(val);
                  }
                }}
                loading={updateHeightMutation.isPending}
                style={{ marginTop: OBSIDIAN_SPACING.md }}
              />
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
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  kicker: {
    color: OBSIDIAN_COLORS.voltLime,
    letterSpacing: 1.5,
  },
  title: {
    color: OBSIDIAN_COLORS.textWhite,
    marginTop: 2,
  },
  quickLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    paddingVertical: OBSIDIAN_SPACING.xs + 3,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    borderRadius: OBSIDIAN_RADIUS.full,
  },
  quickLogText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.onPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroCard: {
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    marginBottom: OBSIDIAN_SPACING.md,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  heroLabel: {
    color: OBSIDIAN_COLORS.textMuted,
  },
  weightNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  weightMainNum: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 38,
    lineHeight: 44,
    color: OBSIDIAN_COLORS.textWhite,
  },
  weightUnit: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 16,
    color: OBSIDIAN_COLORS.voltLime,
  },
  deltaBox: {
    alignItems: 'flex-end',
  },
  deltaSub: {
    color: OBSIDIAN_COLORS.textSlate,
    marginTop: 4,
  },
  rangeRow: {
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  rangeTabs: {
    flexDirection: 'row',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: OBSIDIAN_RADIUS.sm,
  },
  rangeTabActive: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  rangeTabText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.textSlate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rangeTabTextActive: {
    color: OBSIDIAN_COLORS.onPrimary,
  },
  section: {
    marginTop: OBSIDIAN_SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.xs + 2,
  },
  sectionTitle: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  measureLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingVertical: 5,
    paddingHorizontal: OBSIDIAN_SPACING.sm + 2,
    borderRadius: OBSIDIAN_RADIUS.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  measureLogBtnText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.voltLime,
    textTransform: 'uppercase',
  },
  measureGridStack: {
    gap: OBSIDIAN_SPACING.xs + 2,
  },
  measureCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: OBSIDIAN_SPACING.sm + 2,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    borderRadius: OBSIDIAN_RADIUS.lg,
  },
  measureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.md,
  },
  measureIconCircle: {
    width: 38,
    height: 38,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  measureLabel: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  measureSub: {
    color: OBSIDIAN_COLORS.textSlate,
    marginTop: 2,
  },
  measureRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  measureValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  measureValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    color: OBSIDIAN_COLORS.textWhite,
  },
  measureUnit: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.textSlate,
  },
  bmiCard: {
    padding: OBSIDIAN_SPACING.lg,
    borderRadius: OBSIDIAN_RADIUS.xl,
    marginTop: OBSIDIAN_SPACING.lg,
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: OBSIDIAN_SPACING.md,
  },
  bmiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bmiTitle: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  bmiSub: {
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
  },
  heightBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingVertical: 4,
    paddingHorizontal: OBSIDIAN_SPACING.sm + 2,
    borderRadius: OBSIDIAN_RADIUS.full,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderElevated,
  },
  heightBadgeText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
  },
  bmiScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: OBSIDIAN_SPACING.lg,
  },
  bmiScoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.md,
  },
  bmiScoreNum: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 40,
    lineHeight: 46,
  },
  bmiCategoryCol: {
    gap: 3,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: OBSIDIAN_RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  categoryPillText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bmiRangeText: {
    color: OBSIDIAN_COLORS.textSlate,
    fontSize: 11,
  },
  healthyRangeBox: {
    alignItems: 'flex-end',
  },
  healthyRangeLabel: {
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 1,
  },
  healthyRangeVal: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.textWhite,
    marginTop: 2,
  },
  spectrumContainer: {
    position: 'relative',
    height: 14,
    justifyContent: 'center',
    marginBottom: 6,
  },
  spectrumTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: OBSIDIAN_RADIUS.full,
    overflow: 'hidden',
    gap: 2,
  },
  spectrumSegment: {
    height: '100%',
    borderRadius: 2,
  },
  spectrumIndicator: {
    position: 'absolute',
    top: 0,
    marginLeft: -5,
  },
  spectrumPin: {
    width: 10,
    height: 14,
    borderRadius: 3,
    backgroundColor: OBSIDIAN_COLORS.textWhite,
    borderWidth: 2,
  },
  spectrumLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: OBSIDIAN_SPACING.md,
  },
  spectrumLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: OBSIDIAN_COLORS.textSlate,
  },
  athleteNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    padding: OBSIDIAN_SPACING.sm,
    borderRadius: OBSIDIAN_RADIUS.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  athleteNoteText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: OBSIDIAN_COLORS.textMuted,
    flex: 1,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 11, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: OBSIDIAN_SPACING.xl,
  },
  modalCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.lg,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: OBSIDIAN_SPACING.md,
  },
  modalTitle: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  modalLabel: {
    color: OBSIDIAN_COLORS.textMuted,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderRadius: OBSIDIAN_RADIUS.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    color: OBSIDIAN_COLORS.textWhite,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingVertical: OBSIDIAN_SPACING.sm,
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  quickStepRow: {
    flexDirection: 'row',
    gap: OBSIDIAN_SPACING.xs,
    marginBottom: OBSIDIAN_SPACING.xs,
  },
  quickStepBtn: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHighest,
    borderRadius: OBSIDIAN_RADIUS.sm,
    paddingVertical: 6,
    alignItems: 'center',
  },
  quickStepText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.textWhite,
  },
  measureInputGrid: {
    flexDirection: 'row',
    gap: OBSIDIAN_SPACING.sm,
    marginBottom: OBSIDIAN_SPACING.xs,
  },
});
