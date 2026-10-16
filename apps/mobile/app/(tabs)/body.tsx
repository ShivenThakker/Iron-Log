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
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
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
  const [timeRange, setTimeRange] = useState<'30' | '90'>('30');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showMeasureModal, setShowMeasureModal] = useState(false);

  // Form inputs
  const [inputWeight, setInputWeight] = useState('');
  const [chestInput, setChestInput] = useState('');
  const [armsInput, setArmsInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [thighsInput, setThighsInput] = useState('');

  // Fetch weight history & target weight from API
  const { data: weightData, refetch, isRefetching } = useQuery({
    queryKey: ['weightHistory', timeRange],
    queryFn: async () => {
      const res = await api.get(`/body/weight/history?days=${timeRange}`).catch(() => null);
      return res?.data ?? null;
    },
  });

  // Fetch measurements history
  const { data: measureData } = useQuery({
    queryKey: ['measurementsHistory'],
    queryFn: async () => {
      const res = await api.get('/body/measurements/history').catch(() => null);
      return res?.data ?? null;
    },
  });

  // Log weight mutation
  const logWeightMutation = useMutation({
    mutationFn: async (weight: number) => {
      await api.post('/body/weight', {
        weight_kg: weight,
        logged_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightHistory'] });
      setShowWeightModal(false);
      setInputWeight('');
    },
  });

  // Log measurements mutation
  const logMeasureMutation = useMutation({
    mutationFn: async (measurements: Record<string, number>) => {
      await api.post('/body/measurements', {
        chest_cm: measurements.chest,
        arms_cm: measurements.arms,
        waist_cm: measurements.waist,
        thighs_cm: measurements.thighs,
        logged_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurementsHistory'] });
      setShowMeasureModal(false);
      setChestInput('');
      setArmsInput('');
      setWaistInput('');
      setThighsInput('');
    },
  });

  const chartPoints: WeightPoint[] = Array.isArray(weightData?.history) && weightData.history.length > 0
    ? weightData.history.map((item: any) => ({
        date: new Date(item.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: Number(item.weight_kg),
        movingAvg: item.moving_avg_7d ? Number(item.moving_avg_7d) : undefined,
      }))
    : DEFAULT_WEIGHT_HISTORY;

  const currentWeight = chartPoints.length > 0 ? chartPoints[chartPoints.length - 1].weight : 78.5;
  const startWeight = chartPoints.length > 0 ? chartPoints[0].weight : 80.5;
  const deltaWeight = (currentWeight - startWeight).toFixed(1);
  const isLoss = Number(deltaWeight) <= 0;
  const goalWeight = weightData?.targetWeight || 75.0;

  const measurements = measureData?.latest || {
    chest: 104,
    arms: 39.5,
    waist: 83,
    thighs: 60,
  };

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
    <ScreenContainer scrollable={false}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={COLORS.dark.accentRed}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text variant="caption" style={styles.kicker}>BODY COMPOSITION</Text>
              <Text variant="h1" style={styles.title}>Body Progress</Text>
            </View>
            <TouchableOpacity
              style={styles.quickLogBtn}
              onPress={() => setShowWeightModal(true)}
            >
              <Icon name="Plus" size={16} color="#FFFFFF" />
              <Text variant="caption" style={styles.quickLogText}>
                Log Weight
              </Text>
            </TouchableOpacity>
          </View>

          {/* Current Weight Hero Card */}
          <GlassCard style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View>
                <Text variant="caption" style={styles.heroLabel}>CURRENT WEIGHT</Text>
                <View style={styles.weightNumRow}>
                  <Text variant="mono" style={styles.weightMainNum}>
                    {currentWeight}
                  </Text>
                  <Text variant="h2" style={styles.weightUnit}>
                    kg
                  </Text>
                </View>
              </View>

              <View style={styles.deltaBox}>
                <Badge
                  label={`${isLoss ? '↓' : '↑'} ${Math.abs(Number(deltaWeight))} kg`}
                  variant={isLoss ? 'green' : 'gold'}
                />
                <Text variant="caption" style={styles.deltaSub}>
                  vs. 30 days ago
                </Text>
              </View>
            </View>

            {/* Time range filters */}
            <View style={styles.rangeRow}>
              <View style={styles.rangeTabs}>
                <TouchableOpacity
                  style={[styles.rangeTab, timeRange === '30' && styles.rangeTabActive]}
                  onPress={() => setTimeRange('30')}
                >
                  <Text variant="caption" style={[styles.rangeTabText, timeRange === '30' && styles.rangeTabTextActive]}>
                    Last 30 Days
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rangeTab, timeRange === '90' && styles.rangeTabActive]}
                  onPress={() => setTimeRange('90')}
                >
                  <Text variant="caption" style={[styles.rangeTabText, timeRange === '90' && styles.rangeTabTextActive]}>
                    Last 90 Days
                  </Text>
                </TouchableOpacity>
              </View>

              <Text variant="caption" style={styles.goalText}>
                Goal: {goalWeight} kg
              </Text>
            </View>

            {/* Interactive Weight Chart with Moving Average */}
            <WeightChart data={chartPoints} goalWeight={goalWeight} />
          </GlassCard>

          {/* Body Measurements Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="h3" style={styles.sectionTitle}>
                Body Measurements
              </Text>
              <TouchableOpacity
                style={styles.measureLogBtn}
                onPress={() => setShowMeasureModal(true)}
              >
                <Text variant="caption" style={styles.measureLogBtnText}>
                  + Log Measurements
                </Text>
              </TouchableOpacity>
            </View>

            <GlassCard style={styles.measurementsCard}>
              {[
                { label: 'Chest', value: measurements.chest, unit: 'cm', change: '+1.5 cm', changeType: 'green' },
                { label: 'Arms / Biceps', value: measurements.arms, unit: 'cm', change: '+0.8 cm', changeType: 'green' },
                { label: 'Waist', value: measurements.waist, unit: 'cm', change: '-2.0 cm', changeType: 'green' },
                { label: 'Thighs', value: measurements.thighs, unit: 'cm', change: '+1.0 cm', changeType: 'green' },
              ].map((row, idx) => (
                <View key={idx} style={styles.measureRow}>
                  <View>
                    <Text variant="body" style={styles.measureLabel}>{row.label}</Text>
                    <Text variant="caption" style={styles.measureSub}>Last updated 3 days ago</Text>
                  </View>
                  <View style={styles.measureRight}>
                    <Text variant="mono" style={styles.measureValue}>
                      {row.value} {row.unit}
                    </Text>
                    <Badge label={row.change} variant={row.changeType as any} />
                  </View>
                </View>
              ))}
            </GlassCard>
          </View>
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
                <Text variant="h3" style={styles.modalTitle}>Log Today's Weight</Text>
                <TouchableOpacity onPress={() => setShowWeightModal(false)}>
                  <Icon name="X" size={22} color={COLORS.dark.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text variant="caption" style={styles.modalLabel}>ENTER WEIGHT (KG)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                placeholder="e.g. 78.2"
                placeholderTextColor={COLORS.dark.textSecondary}
                value={inputWeight}
                onChangeText={setInputWeight}
                autoFocus
              />

              <GradientButton
                title={logWeightMutation.isPending ? 'Saving...' : 'Save Weight Log'}
                onPress={handleWeightSubmit}
                loading={logWeightMutation.isPending}
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
                <Text variant="h3" style={styles.modalTitle}>Log Measurements</Text>
                <TouchableOpacity onPress={() => setShowMeasureModal(false)}>
                  <Icon name="X" size={22} color={COLORS.dark.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.measureGrid}>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" style={styles.modalLabel}>CHEST (CM)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="104"
                    placeholderTextColor={COLORS.dark.textSecondary}
                    value={chestInput}
                    onChangeText={setChestInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" style={styles.modalLabel}>ARMS (CM)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="39.5"
                    placeholderTextColor={COLORS.dark.textSecondary}
                    value={armsInput}
                    onChangeText={setArmsInput}
                  />
                </View>
              </View>

              <View style={styles.measureGrid}>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" style={styles.modalLabel}>WAIST (CM)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="83"
                    placeholderTextColor={COLORS.dark.textSecondary}
                    value={waistInput}
                    onChangeText={setWaistInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" style={styles.modalLabel}>THIGHS (CM)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="60"
                    placeholderTextColor={COLORS.dark.textSecondary}
                    value={thighsInput}
                    onChangeText={setThighsInput}
                  />
                </View>
              </View>

              <GradientButton
                title={logMeasureMutation.isPending ? 'Saving...' : 'Save Measurements'}
                onPress={handleMeasureSubmit}
                loading={logMeasureMutation.isPending}
                style={{ marginTop: SPACING.md }}
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
  quickLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.dark.accentRed,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
  },
  quickLogText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  heroCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  heroLabel: {
    color: COLORS.dark.textSecondary,
    letterSpacing: 1,
  },
  weightNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  weightMainNum: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  weightUnit: {
    color: COLORS.dark.textSecondary,
  },
  deltaBox: {
    alignItems: 'flex-end',
    gap: 4,
  },
  deltaSub: {
    color: COLORS.dark.textSecondary,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  rangeTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark.bgInput,
    borderRadius: RADIUS.full,
    padding: 2,
  },
  rangeTab: {
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  rangeTabActive: {
    backgroundColor: COLORS.dark.accentRed,
  },
  rangeTabText: {
    color: COLORS.dark.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  rangeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  goalText: {
    color: COLORS.dark.accentGold,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.dark.textPrimary,
  },
  measureLogBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  measureLogBtnText: {
    color: COLORS.dark.accentGold,
    fontWeight: 'bold',
  },
  measurementsCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    gap: SPACING.md,
  },
  measureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  measureLabel: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
  },
  measureSub: {
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  measureRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  measureValue: {
    color: COLORS.dark.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 24, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    color: COLORS.dark.textPrimary,
  },
  modalLabel: {
    color: COLORS.dark.textSecondary,
    marginBottom: 4,
    letterSpacing: 1,
  },
  modalInput: {
    backgroundColor: COLORS.dark.bgInput,
    color: COLORS.dark.textPrimary,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  measureGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
});
