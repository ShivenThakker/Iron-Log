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
import { Icon } from '@/components/ui/Icon';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
import { api } from '@/services/api';

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface LoggedItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealSlot: MealSlot;
}

const MEAL_SLOTS: { key: MealSlot; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'Sun' },
  { key: 'lunch', label: 'Lunch', icon: 'Clock' },
  { key: 'dinner', label: 'Dinner', icon: 'Moon' },
  { key: 'snack', label: 'Snacks', icon: 'Cookie' },
];

export default function NutritionScreen() {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];

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
        fats_g: food.fat,
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
  const calRatio = Math.min(consumedCals / targetCals, 1);

  const consumedP = dailyData?.totals?.protein || 140;
  const targetP = dailyData?.targets?.protein || 180;
  const consumedC = dailyData?.totals?.carbs || 195;
  const targetC = dailyData?.targets?.carbs || 250;
  const consumedF = dailyData?.totals?.fats || 50;
  const targetF = dailyData?.targets?.fats || 70;

  const mealSlotsData = dailyData?.meals || {};

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
              <Text variant="caption" style={styles.kicker}>MACRO ENGINE</Text>
              <Text variant="h1" style={styles.title}>Daily Nutrition</Text>
            </View>
            <Badge label="USDA Verified" variant="gold" />
          </View>

          {/* Calorie Ring & Macro Bars Card */}
          <GlassCard style={styles.heroCard}>
            <View style={styles.ringRow}>
              <ProgressRing
                size={140}
                strokeWidth={14}
                progress={calRatio}
                color={COLORS.dark.accentGold}
              >
                <Text variant="mono" style={styles.ringCalsText}>
                  {consumedCals}
                </Text>
                <Text variant="caption" style={styles.ringSubText}>
                  of {targetCals} kcal
                </Text>
              </ProgressRing>

              <View style={styles.ringInfo}>
                <Text variant="h3" style={styles.remainingTitle}>
                  {Math.max(0, targetCals - consumedCals)} kcal
                </Text>
                <Text variant="caption" style={styles.remainingSub}>
                  Remaining today
                </Text>

                <View style={styles.quickMacroStats}>
                  <Text variant="caption" style={{ color: COLORS.dark.accentRed }}>
                    P: {consumedP}g / {targetP}g
                  </Text>
                  <Text variant="caption" style={{ color: COLORS.dark.success }}>
                    C: {consumedC}g / {targetC}g
                  </Text>
                  <Text variant="caption" style={{ color: COLORS.dark.accentGold }}>
                    F: {consumedF}g / {targetF}g
                  </Text>
                </View>
              </View>
            </View>

            {/* Macro Progress Bars */}
            <View style={styles.macroBarsSection}>
              <View style={styles.macroRow}>
                <View style={styles.macroHeader}>
                  <Text variant="caption" style={styles.macroLabel}>Protein</Text>
                  <Text variant="caption" style={styles.macroAmount}>{consumedP}g / {targetP}g</Text>
                </View>
                <ProgressBar progress={Math.min(consumedP / targetP, 1)} color={COLORS.dark.accentRed} />
              </View>

              <View style={styles.macroRow}>
                <View style={styles.macroHeader}>
                  <Text variant="caption" style={styles.macroLabel}>Carbs</Text>
                  <Text variant="caption" style={styles.macroAmount}>{consumedC}g / {targetC}g</Text>
                </View>
                <ProgressBar progress={Math.min(consumedC / targetC, 1)} color={COLORS.dark.success} />
              </View>

              <View style={styles.macroRow}>
                <View style={styles.macroHeader}>
                  <Text variant="caption" style={styles.macroLabel}>Fats</Text>
                  <Text variant="caption" style={styles.macroAmount}>{consumedF}g / {targetF}g</Text>
                </View>
                <ProgressBar progress={Math.min(consumedF / targetF, 1)} color={COLORS.dark.accentGold} />
              </View>
            </View>
          </GlassCard>

          {/* Meal Slots Accordions */}
          <View style={styles.slotsSection}>
            {MEAL_SLOTS.map((slot) => {
              const items: any[] = mealSlotsData[slot.key] || [];
              const slotCals = items.reduce((sum, item) => sum + (item.calories_kcal || 0), 0);

              return (
                <GlassCard key={slot.key} style={styles.slotCard}>
                  <View style={styles.slotHeader}>
                    <View style={styles.slotLeft}>
                      <Text variant="h3" style={styles.slotName}>
                        {slot.label}
                      </Text>
                      {slotCals > 0 && (
                        <Text variant="caption" style={styles.slotCals}>
                          {slotCals} kcal
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.addFoodBtn}
                      onPress={() => handleOpenSearch(slot.key)}
                    >
                      <Icon name="Plus" size={16} color={COLORS.dark.accentRed} />
                      <Text variant="caption" style={styles.addFoodText}>
                        Add Food
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {items.length > 0 ? (
                    <View style={styles.itemsList}>
                      {items.map((item, idx) => (
                        <View key={item.id || idx} style={styles.foodItemRow}>
                          <View>
                            <Text variant="body" style={styles.foodName}>
                              {item.food_name || item.name}
                            </Text>
                            <Text variant="caption" style={styles.foodMacros}>
                              {item.protein_g || item.protein || 0}g P • {item.carbs_g || item.carbs || 0}g C • {item.fats_g || item.fat || 0}g F
                            </Text>
                          </View>
                          <Text variant="mono" style={styles.foodCals}>
                            {item.calories_kcal || item.calories} kcal
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text variant="caption" style={styles.emptySlotText}>
                      No foods logged yet. Tap "+ Add Food" to search USDA database.
                    </Text>
                  )}
                </GlassCard>
              );
            })}
          </View>
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
                  <Text variant="h3" style={styles.modalTitle}>
                    Log to {activeSlot.charAt(0).toUpperCase() + activeSlot.slice(1)}
                  </Text>
                  <Text variant="caption" style={styles.modalSub}>
                    Live search via USDA FoodData Central
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                  <Icon name="X" size={24} color={COLORS.dark.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Mode Toggle: Search vs Manual */}
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, !manualMode && styles.toggleBtnActive]}
                  onPress={() => setManualMode(false)}
                >
                  <Text variant="caption" style={[styles.toggleText, !manualMode && styles.toggleTextActive]}>
                    USDA Database
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, manualMode && styles.toggleBtnActive]}
                  onPress={() => setManualMode(true)}
                >
                  <Text variant="caption" style={[styles.toggleText, manualMode && styles.toggleTextActive]}>
                    Manual Entry
                  </Text>
                </TouchableOpacity>
              </View>

              {!manualMode ? (
                <>
                  {/* Search Input Bar */}
                  <View style={styles.searchBar}>
                    <Icon name="MagnifyingGlass" size={20} color={COLORS.dark.textSecondary} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="e.g. Chicken breast, Oatmeal, Greek yogurt..."
                      placeholderTextColor={COLORS.dark.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus
                    />
                    {searching && <ActivityIndicator size="small" color={COLORS.dark.accentRed} />}
                  </View>

                  {/* Search Results List */}
                  <ScrollView style={styles.resultsList}>
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
                        >
                          <View style={{ flex: 1 }}>
                            <Text variant="body" style={styles.resultName} numberOfLines={1}>
                              {item.name || item.description}
                            </Text>
                            <Text variant="caption" style={styles.resultMacros}>
                              {item.protein || item.protein_g || 0}g P • {item.carbs || item.carbs_g || 0}g C • {item.fat || item.fats_g || 0}g F
                            </Text>
                          </View>
                          <View style={styles.resultRight}>
                            <Text variant="mono" style={styles.resultCals}>
                              {item.calories || item.calories_kcal || 0} kcal
                            </Text>
                            <Icon name="PlusCircle" size={22} color={COLORS.dark.accentRed} />
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : searchQuery.length > 1 ? (
                      <View style={styles.noResults}>
                        <Text variant="caption" style={{ color: COLORS.dark.textSecondary }}>
                          No matches found. Switch to "Manual Entry" above to add custom food.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.searchHint}>
                        <Text variant="caption" style={{ color: COLORS.dark.textSecondary }}>
                          Type a food name above to query thousands of USDA verified nutritional items.
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </>
              ) : (
                /* Manual Custom Entry Form */
                <ScrollView style={styles.manualForm}>
                  <Text variant="caption" style={styles.fieldLabel}>FOOD NAME</Text>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="e.g. Homemade Protein Shake"
                    placeholderTextColor={COLORS.dark.textSecondary}
                    value={manualName}
                    onChangeText={setManualName}
                  />

                  <View style={styles.manualGrid}>
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" style={styles.fieldLabel}>CALORIES (KCAL)</Text>
                      <TextInput
                        style={styles.manualInput}
                        placeholder="350"
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.dark.textSecondary}
                        value={manualCals}
                        onChangeText={setManualCals}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" style={styles.fieldLabel}>PROTEIN (G)</Text>
                      <TextInput
                        style={styles.manualInput}
                        placeholder="30"
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.dark.textSecondary}
                        value={manualProtein}
                        onChangeText={setManualProtein}
                      />
                    </View>
                  </View>

                  <View style={styles.manualGrid}>
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" style={styles.fieldLabel}>CARBS (G)</Text>
                      <TextInput
                        style={styles.manualInput}
                        placeholder="25"
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.dark.textSecondary}
                        value={manualCarbs}
                        onChangeText={setManualCarbs}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" style={styles.fieldLabel}>FAT (G)</Text>
                      <TextInput
                        style={styles.manualInput}
                        placeholder="8"
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.dark.textSecondary}
                        value={manualFat}
                        onChangeText={setManualFat}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.manualSubmitBtn}
                    onPress={handleManualSubmit}
                    disabled={logMutation.isPending}
                  >
                    <Text variant="h3" style={styles.manualSubmitText}>
                      {logMutation.isPending ? 'Logging...' : 'Log Food Entry 🥑'}
                    </Text>
                  </TouchableOpacity>
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
  heroCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  ringCalsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ringSubText: {
    fontSize: 10,
    color: COLORS.dark.textSecondary,
  },
  ringInfo: {
    flex: 1,
  },
  remainingTitle: {
    color: COLORS.dark.textPrimary,
  },
  remainingSub: {
    color: COLORS.dark.textSecondary,
    marginBottom: SPACING.sm,
  },
  quickMacroStats: {
    gap: 2,
  },
  macroBarsSection: {
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  macroRow: {
    gap: 4,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroLabel: {
    color: COLORS.dark.textSecondary,
  },
  macroAmount: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
  },
  slotsSection: {
    gap: SPACING.md,
  },
  slotCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  slotName: {
    color: COLORS.dark.textPrimary,
  },
  slotCals: {
    color: COLORS.dark.accentGold,
    fontWeight: 'bold',
  },
  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
  },
  addFoodText: {
    color: COLORS.dark.accentRed,
    fontWeight: 'bold',
  },
  itemsList: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: SPACING.sm,
  },
  foodItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
  },
  foodMacros: {
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  foodCals: {
    color: COLORS.dark.textPrimary,
    fontSize: 14,
  },
  emptySlotText: {
    color: COLORS.dark.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 24, 0.88)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.dark.bgSecondary,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.dark.textPrimary,
  },
  modalSub: {
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark.bgInput,
    borderRadius: RADIUS.full,
    padding: 3,
    marginBottom: SPACING.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.dark.accentRed,
  },
  toggleText: {
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.dark.bgInput,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    color: COLORS.dark.textPrimary,
    fontSize: 15,
  },
  resultsList: {
    maxHeight: 320,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  resultName: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
  },
  resultMacros: {
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  resultRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  resultCals: {
    color: COLORS.dark.accentGold,
    fontSize: 14,
  },
  noResults: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  searchHint: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  manualForm: {
    paddingVertical: SPACING.sm,
  },
  fieldLabel: {
    color: COLORS.dark.textSecondary,
    marginBottom: 4,
    letterSpacing: 1,
  },
  manualInput: {
    backgroundColor: COLORS.dark.bgInput,
    color: COLORS.dark.textPrimary,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    fontSize: 15,
    marginBottom: SPACING.md,
  },
  manualGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  manualSubmitBtn: {
    backgroundColor: COLORS.dark.accentRed,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  manualSubmitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
