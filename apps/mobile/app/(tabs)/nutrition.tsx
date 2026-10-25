import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GradientButton } from '@/components/ui/GradientButton';
import { Icon, IconName } from '@/components/ui/Icon';
import { ProgressRing } from '@/components/charts/ProgressRing';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
} from '@/constants/tokens';
import { api } from '@/services/api';

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const MEAL_SLOTS: { key: MealSlot; label: string; icon: IconName; accentColor: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'Sun', accentColor: OBSIDIAN_COLORS.voltLime },
  { key: 'lunch', label: 'Lunch', icon: 'Clock', accentColor: OBSIDIAN_COLORS.cyanAccent },
  { key: 'dinner', label: 'Dinner', icon: 'Moon', accentColor: OBSIDIAN_COLORS.textMuted },
  { key: 'snack', label: 'Snacks', icon: 'Cookie', accentColor: OBSIDIAN_COLORS.textMuted },
];

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function NutritionScreen() {
  const queryClient = useQueryClient();
  const todayStr = getLocalDateString();

  const [activeSlot, setActiveSlot] = useState<MealSlot>('breakfast');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualMode, setManualMode] = useState(false);

  // Manual input state
  const [manualName, setManualName] = useState('');
  const [manualCals, setManualCals] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

  // Daily Nutrition Query
  const { data: dailyData, refetch, isRefetching } = useQuery({
    queryKey: ['dailyNutrition', todayStr],
    queryFn: async () => {
      const res = await api.get(`/nutrition/daily/${todayStr}`).catch(() => null);
      return res?.data ?? null;
    },
  });

  // Food Search Query (USDA Engine)
  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ['foodSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await api.get(`/nutrition/search?q=${encodeURIComponent(searchQuery)}`).catch(() => null);
      return Array.isArray(res?.data) ? res.data : [];
    },
    enabled: searchQuery.trim().length > 1,
  });

  // Log food mutation
  const logMutation = useMutation({
    mutationFn: async (food: FoodItem & { mealSlot: MealSlot }) => {
      await api.post('/nutrition/log', {
        meal_slot: food.mealSlot,
        food_name: food.name,
        calories_kcal: food.calories,
        protein_g: food.protein,
        carbs_g: food.carbs,
        fat_g: food.fat,
        fats_g: food.fat,
        logged_date: todayStr,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyNutrition'] });
      queryClient.invalidateQueries({ queryKey: ['nutritionDashboard'] });
      setShowSearchModal(false);
      resetManualForm();
    },
  });

  const resetManualForm = () => {
    setManualName('');
    setManualCals('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
    setSearchQuery('');
    setManualMode(false);
  };

  const handleOpenSearch = (slot: MealSlot) => {
    setActiveSlot(slot);
    setSearchQuery('');
    setShowSearchModal(true);
  };

  const handleQuickAddFood = (food: FoodItem) => {
    logMutation.mutate({
      ...food,
      mealSlot: activeSlot,
    });
  };

  const handleManualSubmit = () => {
    if (!manualName.trim()) return;
    logMutation.mutate({
      name: manualName.trim(),
      calories: parseFloat(manualCals) || 0,
      protein: parseFloat(manualProtein) || 0,
      carbs: parseFloat(manualCarbs) || 0,
      fat: parseFloat(manualFat) || 0,
      mealSlot: activeSlot,
    });
  };

  // Calculations
  const consumedCals = dailyData?.totals?.calories || 1650;
  const targetCals = dailyData?.targets?.calories || 2500;
  const remainingCals = Math.max(0, targetCals - consumedCals);
  const calRatio = Math.min(consumedCals / targetCals, 1);

  const consumedP = dailyData?.totals?.protein || 140;
  const targetP = dailyData?.targets?.protein || 180;
  const consumedC = dailyData?.totals?.carbs || 195;
  const targetC = dailyData?.targets?.carbs || 250;
  const consumedF = dailyData?.totals?.fats || 50;
  const targetF = dailyData?.targets?.fats || 70;

  const mealSlotsData = dailyData?.meals || {};

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
              onRefresh={refetch}
              tintColor={OBSIDIAN_COLORS.voltLime}
            />
          }
        >
          {/* Header Row */}
          <View style={styles.header}>
            <View>
              <Text variant="labelCaps" style={styles.kicker}>MACRO ENGINE</Text>
              <Text variant="headlineLgMobile" style={styles.title}>Daily Nutrition</Text>
            </View>
            <Badge label="USDA Verified" variant="volt" />
          </View>

          {/* Calorie Hero + Macro Breakdown Card */}
          <GlassCard variant="obsidianLevel1" style={styles.heroCard}>
            {/* Radial Meter & Energy Metric Row */}
            <View style={styles.ringRow}>
              <ProgressRing
                size={112}
                strokeWidth={9}
                progress={calRatio}
                color={OBSIDIAN_COLORS.voltLime}
                trackColor={OBSIDIAN_COLORS.surfaceContainerHighest}
              >
                <View style={styles.ringCenterText}>
                  <Text style={styles.ringCalsText}>
                    {consumedCals.toLocaleString()}
                  </Text>
                  <Text variant="labelCaps" style={styles.ringSubText}>
                    / {targetCals.toLocaleString()} kcal
                  </Text>
                </View>
              </ProgressRing>

              {/* Hero Delta Stats */}
              <View style={styles.ringInfo}>
                <View style={styles.remainingValRow}>
                  <Text style={styles.remainingNumber}>
                    {remainingCals}
                  </Text>
                  <Text style={styles.remainingUnit}>
                    kcal
                  </Text>
                </View>
                <Text variant="labelCaps" style={styles.remainingSub}>
                  Remaining Today
                </Text>

                {/* Quick Macro Mini Tags */}
                <View style={styles.miniTagsRow}>
                  <View style={styles.miniTag}>
                    <Text variant="labelCaps" style={{ color: '#FF5C5F' }}>PRO</Text>
                    <Text style={styles.miniTagVal}>{consumedP}g</Text>
                  </View>
                  <View style={styles.miniTag}>
                    <Text variant="labelCaps" style={{ color: OBSIDIAN_COLORS.cyanAccent }}>CARB</Text>
                    <Text style={styles.miniTagVal}>{consumedC}g</Text>
                  </View>
                  <View style={styles.miniTag}>
                    <Text variant="labelCaps" style={{ color: OBSIDIAN_COLORS.voltLime }}>FAT</Text>
                    <Text style={styles.miniTagVal}>{consumedF}g</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Precision Progress Bars */}
            <View style={styles.macroBarsSection}>
              {/* Protein Progress */}
              <View style={styles.macroRow}>
                <View style={styles.macroHeader}>
                  <View style={styles.macroTitleRow}>
                    <View style={[styles.macroDot, { backgroundColor: '#FF5C5F' }]} />
                    <Text variant="labelCaps" style={styles.macroLabel}>Protein</Text>
                  </View>
                  <Text style={styles.macroAmount}>
                    <Text style={{ color: '#FFB3B2' }}>{consumedP}g</Text>
                    <Text style={{ color: OBSIDIAN_COLORS.textSlate }}> / {targetP}g</Text>
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.min(consumedP / targetP, 1)}
                  color="#FF5C5F"
                  trackColor={OBSIDIAN_COLORS.surfaceContainerHighest}
                  height={6}
                />
              </View>

              {/* Carbs Progress */}
              <View style={styles.macroRow}>
                <View style={styles.macroHeader}>
                  <View style={styles.macroTitleRow}>
                    <View style={[styles.macroDot, { backgroundColor: OBSIDIAN_COLORS.cyanAccent }]} />
                    <Text variant="labelCaps" style={styles.macroLabel}>Carbohydrates</Text>
                  </View>
                  <Text style={styles.macroAmount}>
                    <Text style={{ color: OBSIDIAN_COLORS.cyanAccent }}>{consumedC}g</Text>
                    <Text style={{ color: OBSIDIAN_COLORS.textSlate }}> / {targetC}g</Text>
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.min(consumedC / targetC, 1)}
                  color={OBSIDIAN_COLORS.cyanAccent}
                  trackColor={OBSIDIAN_COLORS.surfaceContainerHighest}
                  height={6}
                />
              </View>

              {/* Fats Progress */}
              <View style={styles.macroRow}>
                <View style={styles.macroHeader}>
                  <View style={styles.macroTitleRow}>
                    <View style={[styles.macroDot, { backgroundColor: OBSIDIAN_COLORS.voltLime }]} />
                    <Text variant="labelCaps" style={styles.macroLabel}>Dietary Fats</Text>
                  </View>
                  <Text style={styles.macroAmount}>
                    <Text style={{ color: OBSIDIAN_COLORS.voltLime }}>{consumedF}g</Text>
                    <Text style={{ color: OBSIDIAN_COLORS.textSlate }}> / {targetF}g</Text>
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.min(consumedF / targetF, 1)}
                  color={OBSIDIAN_COLORS.voltLime}
                  trackColor={OBSIDIAN_COLORS.surfaceContainerHighest}
                  height={6}
                />
              </View>
            </View>
          </GlassCard>

          {/* Meal Categories Section */}
          <View style={styles.slotsSection}>
            <View style={styles.slotsHeader}>
              <Text variant="labelCaps" style={styles.slotsLabel}>LOGGED MEALS</Text>
              <Text variant="bodySm" style={styles.slotsCount}>4 Slots Configured</Text>
            </View>

            <View style={styles.slotsList}>
              {MEAL_SLOTS.map((slot) => {
                const items: any[] = mealSlotsData[slot.key] || [];
                const slotCals = items.reduce((sum, item) => sum + (item.calories_kcal || 0), 0);
                const slotProtein = items.reduce((sum, item) => sum + (item.protein_g || 0), 0);

                return (
                  <GlassCard key={slot.key} variant="obsidianLevel1" style={styles.slotCard}>
                    <View style={[styles.slotColorStripe, { backgroundColor: slot.accentColor }]} />
                    <View style={styles.slotContentWrapper}>
                      <View style={styles.slotHeader}>
                        <View style={styles.slotLeft}>
                          <View style={styles.slotIconCircle}>
                            <Icon name={slot.icon} size={18} color={slot.accentColor} />
                          </View>
                          <View>
                            <View style={styles.slotTitleRow}>
                              <Text variant="headlineSm" style={styles.slotName}>
                                {slot.label}
                              </Text>
                              {slotCals > 0 ? (
                                <Badge
                                  label={`${slotCals} KCAL`}
                                  variant="volt"
                                  size="sm"
                                />
                              ) : null}
                            </View>
                            <Text variant="bodySm" style={styles.slotSub}>
                              {items.length > 0
                                ? `${items.length} item${items.length > 1 ? 's' : ''} tracked • ${slotProtein}g Protein`
                                : 'No foods logged yet'}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.addFoodBtn}
                          onPress={() => handleOpenSearch(slot.key)}
                          activeOpacity={0.7}
                        >
                          <Icon name="Plus" size={14} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />
                          <Text style={styles.addFoodBtnText}>Add</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Logged Item Chips */}
                      {items.length > 0 ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.chipsScroll}
                          contentContainerStyle={styles.chipsContent}
                        >
                          {items.map((item, idx) => (
                            <View key={item.id || idx} style={styles.itemChip}>
                              <Text style={styles.chipName} numberOfLines={1}>
                                {item.food_name || item.name}
                              </Text>
                              <Text style={styles.chipCals}>
                                {item.calories_kcal || item.calories} kcal
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                      ) : null}
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </View>

          {/* Tactical Barcode Callout Card */}
          <GlassCard variant="obsidianLevel1" style={styles.barcodeCard}>
            <View style={styles.barcodeLeft}>
              <View style={styles.barcodeIconCircle}>
                <Icon name="MagnifyingGlass" size={20} color={OBSIDIAN_COLORS.voltLime} />
              </View>
              <View>
                <Text variant="headlineSm" style={styles.barcodeTitle}>
                  Barcode Rapid Scan
                </Text>
                <Text variant="bodySm" style={styles.barcodeSub}>
                  Instantly sync verified nutrition facts
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.barcodeBtn}
              onPress={() => handleOpenSearch('lunch')}
              activeOpacity={0.8}
            >
              <Text style={styles.barcodeBtnText}>Search</Text>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>

        {/* USDA Food Search & Log Modal */}
        <Modal
          visible={showSearchModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowSearchModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text variant="headlineSm" style={styles.modalTitle}>
                    Log to {activeSlot.charAt(0).toUpperCase() + activeSlot.slice(1)}
                  </Text>
                  <Text variant="bodySm" style={styles.modalSub}>
                    Live search via USDA FoodData Central
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                  <Icon name="X" size={22} color={OBSIDIAN_COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Mode Toggle: Search vs Manual */}
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, !manualMode && styles.toggleBtnActive]}
                  onPress={() => setManualMode(false)}
                >
                  <Text style={[styles.toggleText, !manualMode && styles.toggleTextActive]}>
                    USDA Database
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, manualMode && styles.toggleBtnActive]}
                  onPress={() => setManualMode(true)}
                >
                  <Text style={[styles.toggleText, manualMode && styles.toggleTextActive]}>
                    Manual Entry
                  </Text>
                </TouchableOpacity>
              </View>

              {!manualMode ? (
                <>
                  {/* Search Input Bar */}
                  <View style={styles.searchBar}>
                    <Icon name="MagnifyingGlass" size={18} color={OBSIDIAN_COLORS.textSlate} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="e.g. Chicken breast, Oatmeal, Greek yogurt..."
                      placeholderTextColor={OBSIDIAN_COLORS.textSlate}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus
                    />
                    {searching && <ActivityIndicator size="small" color={OBSIDIAN_COLORS.voltLime} />}
                  </View>

                  {/* Search Results List */}
                  <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
                    {searchResults && searchResults.length > 0 ? (
                      searchResults.map((item: any, idx: number) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.resultItem}
                          onPress={() =>
                            handleQuickAddFood({
                              name: item.name || item.description,
                              calories: item.calories || item.calories_kcal || 0,
                              protein: item.protein || item.protein_g || 0,
                              carbs: item.carbs || item.carbs_g || 0,
                              fat: item.fat || item.fats_g || 0,
                            })
                          }
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text variant="labelInteractive" style={styles.resultName} numberOfLines={1}>
                              {item.name || item.description}
                            </Text>
                            <Text variant="bodySm" style={styles.resultMacros}>
                              {item.protein || item.protein_g || 0}g P • {item.carbs || item.carbs_g || 0}g C • {item.fat || item.fats_g || 0}g F
                            </Text>
                          </View>
                          <View style={styles.resultRight}>
                            <Text style={styles.resultCals}>
                              {item.calories || item.calories_kcal || 0} kcal
                            </Text>
                            <View style={styles.resultAddCircle}>
                              <Icon name="Plus" size={14} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : searchQuery.length > 1 ? (
                      <View style={styles.noResults}>
                        <Text variant="bodySm" style={{ color: OBSIDIAN_COLORS.textSlate, textAlign: 'center' }}>
                          No matches found. Switch to "Manual Entry" above to add a custom meal.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.searchHint}>
                        <Text variant="bodySm" style={{ color: OBSIDIAN_COLORS.textSlate, textAlign: 'center' }}>
                          Type a food name above to query thousands of USDA verified items.
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </>
              ) : (
                /* Manual Custom Entry Form */
                <ScrollView style={styles.manualForm} showsVerticalScrollIndicator={false}>
                  <Text variant="labelCaps" style={styles.fieldLabel}>FOOD NAME</Text>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="e.g. Homemade Protein Shake"
                    placeholderTextColor={OBSIDIAN_COLORS.textSlate}
                    value={manualName}
                    onChangeText={setManualName}
                  />

                  <View style={styles.manualGrid}>
                    <View style={{ flex: 1 }}>
                      <Text variant="labelCaps" style={styles.fieldLabel}>CALORIES (KCAL)</Text>
                      <TextInput
                        style={styles.manualInput}
                        placeholder="350"
                        keyboardType="numeric"
                        placeholderTextColor={OBSIDIAN_COLORS.textSlate}
                        value={manualCals}
                        onChangeText={setManualCals}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="labelCaps" style={styles.fieldLabel}>PROTEIN (G)</Text>
                      <TextInput
                        style={styles.manualInput}
                        placeholder="30"
                        keyboardType="numeric"
                        placeholderTextColor={OBSIDIAN_COLORS.textSlate}
                        value={manualProtein}
                        onChangeText={setManualProtein}
                      />
                    </View>
                  </View>

                  <View style={styles.manualGrid}>
                    <View style={{ flex: 1 }}>
                      <Text variant="labelCaps" style={styles.fieldLabel}>CARBS (G)</Text>
                      <TextInput
                        style={styles.manualInput}
                        placeholder="45"
                        keyboardType="numeric"
                        placeholderTextColor={OBSIDIAN_COLORS.textSlate}
                        value={manualCarbs}
                        onChangeText={setManualCarbs}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="labelCaps" style={styles.fieldLabel}>FAT (G)</Text>
                      <TextInput
                        style={styles.manualInput}
                        placeholder="12"
                        keyboardType="numeric"
                        placeholderTextColor={OBSIDIAN_COLORS.textSlate}
                        value={manualFat}
                        onChangeText={setManualFat}
                      />
                    </View>
                  </View>

                  <GradientButton
                    variant="volt"
                    title={logMutation.isPending ? 'Saving...' : 'Add to Meal'}
                    onPress={handleManualSubmit}
                    loading={logMutation.isPending}
                    style={{ marginTop: OBSIDIAN_SPACING.lg }}
                  />
                </ScrollView>
              )}
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
  heroCard: {
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    marginBottom: OBSIDIAN_SPACING.md,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.md,
  },
  ringCenterText: {
    alignItems: 'center',
  },
  ringCalsText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    color: OBSIDIAN_COLORS.textWhite,
    lineHeight: 24,
  },
  ringSubText: {
    color: OBSIDIAN_COLORS.textSlate,
    fontSize: 9,
    marginTop: 2,
  },
  ringInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  remainingValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  remainingNumber: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 32,
    lineHeight: 36,
    color: OBSIDIAN_COLORS.voltLime,
  },
  remainingUnit: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 16,
    color: OBSIDIAN_COLORS.textWhite,
  },
  remainingSub: {
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
  },
  miniTagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: OBSIDIAN_SPACING.sm,
  },
  miniTag: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderRadius: OBSIDIAN_RADIUS.sm,
    paddingVertical: 4,
    alignItems: 'center',
  },
  miniTagVal: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.textWhite,
    marginTop: 1,
  },
  macroBarsSection: {
    marginTop: OBSIDIAN_SPACING.md,
    gap: OBSIDIAN_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.borderGhost,
    paddingTop: OBSIDIAN_SPACING.sm + 4,
  },
  macroRow: {
    gap: 4,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  macroLabel: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  macroAmount: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
  },
  slotsSection: {
    marginTop: OBSIDIAN_SPACING.sm,
  },
  slotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  slotsLabel: {
    color: OBSIDIAN_COLORS.textMuted,
  },
  slotsCount: {
    color: OBSIDIAN_COLORS.textSlate,
  },
  slotsList: {
    gap: OBSIDIAN_SPACING.sm,
  },
  slotCard: {
    flexDirection: 'row',
    padding: 0,
    borderRadius: OBSIDIAN_RADIUS.xl,
    overflow: 'hidden',
  },
  slotColorStripe: {
    width: 4,
  },
  slotContentWrapper: {
    flex: 1,
    padding: OBSIDIAN_SPACING.md,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.sm,
    flex: 1,
  },
  slotIconCircle: {
    width: 36,
    height: 36,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotName: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  slotSub: {
    color: OBSIDIAN_COLORS.textSlate,
    marginTop: 2,
  },
  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    paddingVertical: 5,
    paddingHorizontal: OBSIDIAN_SPACING.sm + 2,
    borderRadius: OBSIDIAN_RADIUS.full,
  },
  addFoodBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.onPrimary,
    textTransform: 'uppercase',
  },
  chipsScroll: {
    marginTop: OBSIDIAN_SPACING.sm,
  },
  chipsContent: {
    gap: 6,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: OBSIDIAN_RADIUS.sm,
  },
  chipName: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.textWhite,
    maxWidth: 140,
  },
  chipCals: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.textSlate,
  },
  barcodeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: OBSIDIAN_SPACING.md,
    borderRadius: OBSIDIAN_RADIUS.xl,
    marginTop: OBSIDIAN_SPACING.md,
  },
  barcodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.md,
    flex: 1,
  },
  barcodeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.voltOverlay15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeTitle: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  barcodeSub: {
    color: OBSIDIAN_COLORS.textSlate,
    marginTop: 2,
  },
  barcodeBtn: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    paddingVertical: 8,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    borderRadius: OBSIDIAN_RADIUS.md,
  },
  barcodeBtnText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 11, 16, 0.88)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderTopLeftRadius: OBSIDIAN_RADIUS['2xl'],
    borderTopRightRadius: OBSIDIAN_RADIUS['2xl'],
    padding: OBSIDIAN_SPACING.lg,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.borderGhost,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: OBSIDIAN_SPACING.md,
  },
  modalTitle: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  modalSub: {
    color: OBSIDIAN_COLORS.textSlate,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.md,
    padding: 3,
    marginBottom: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: OBSIDIAN_RADIUS.sm,
  },
  toggleBtnActive: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  toggleText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.textSlate,
    textTransform: 'uppercase',
  },
  toggleTextActive: {
    color: OBSIDIAN_COLORS.onPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.sm,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderRadius: OBSIDIAN_RADIUS.lg,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    height: 48,
    marginBottom: OBSIDIAN_SPACING.md,
  },
  searchInput: {
    flex: 1,
    color: OBSIDIAN_COLORS.textWhite,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 14,
  },
  resultsList: {
    maxHeight: 320,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: OBSIDIAN_SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: OBSIDIAN_COLORS.borderGhost,
  },
  resultName: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  resultMacros: {
    color: OBSIDIAN_COLORS.textSlate,
    marginTop: 2,
  },
  resultRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.sm,
  },
  resultCals: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.textWhite,
  },
  resultAddCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    padding: OBSIDIAN_SPACING.xl,
    alignItems: 'center',
  },
  searchHint: {
    padding: OBSIDIAN_SPACING.xl,
    alignItems: 'center',
  },
  manualForm: {
    maxHeight: 380,
  },
  fieldLabel: {
    color: OBSIDIAN_COLORS.textMuted,
    marginBottom: 6,
  },
  manualInput: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderRadius: OBSIDIAN_RADIUS.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    color: OBSIDIAN_COLORS.textWhite,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 16,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingVertical: OBSIDIAN_SPACING.sm,
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  manualGrid: {
    flexDirection: 'row',
    gap: OBSIDIAN_SPACING.sm,
  },
});
