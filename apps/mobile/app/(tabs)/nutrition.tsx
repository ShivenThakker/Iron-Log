import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@/constants/tokens';
import { api } from '@/services/api';

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type MealEntry = {
  food_name: string;
  calories_kcal: string;
  protein_g: string;
  carbs_g: string;
  fats_g: string;
};

export default function NutritionTab() {
  const [activeMealForm, setActiveMealForm] = useState<MealSlot | null>(null);
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState<MealEntry>({
    food_name: '',
    calories_kcal: '',
    protein_g: '',
    carbs_g: '',
    fats_g: '',
  });
  const [mealLogs, setMealLogs] = useState<Record<MealSlot, string[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  });

  const handleOpenForm = (meal: MealSlot) => {
    setActiveMealForm(meal);
    setEntry({ food_name: '', calories_kcal: '', protein_g: '', carbs_g: '', fats_g: '' });
  };

  const handleSaveMeal = async () => {
    if (!activeMealForm || !entry.food_name.trim()) return;
    setSaving(true);

    try {
      await api.post('/nutrition/log', {
        meal_slot: activeMealForm,
        food_name: entry.food_name,
        calories_kcal: Number(entry.calories_kcal || 0),
        protein_g: Number(entry.protein_g || 0),
        carbs_g: Number(entry.carbs_g || 0),
        fats_g: Number(entry.fats_g || 0),
      });
    } catch {
      // Keep optimistic UI even if backend fails during MVP testing
    }

    setMealLogs((prev) => ({
      ...prev,
      [activeMealForm]: [...prev[activeMealForm], entry.food_name],
    }));
    setActiveMealForm(null);
    setSaving(false);
  };

  const macros = useMemo(() => {
    const cals = Number(entry.calories_kcal || 0);
    const protein = Number(entry.protein_g || 0);
    const carbs = Number(entry.carbs_g || 0);
    const fat = Number(entry.fats_g || 0);
    return {
      cals: { current: 1850 + cals, target: 2500 },
      protein: { current: 140 + protein, target: 180 },
      carbs: { current: 200 + carbs, target: 250 },
      fat: { current: 50 + fat, target: 70 },
    };
  }, [entry]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Nutrition</Text>
      <Text style={styles.subtitle}>Track intake by meal and stay within your macro targets.</Text>
      
      {/* Macros Summary Box */}
      <View style={styles.summaryBox}>
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
             <Text style={styles.macroVal}>{macros.cals.current}</Text>
             <Text style={styles.macroLabel}>/ {macros.cals.target} kcal</Text>
          </View>
        </View>
        <View style={[styles.macroRow, {marginTop: SPACING.lg}]}>
          <View style={styles.macroItemSml}><Text style={styles.macTextP}>{macros.protein.current}g P</Text></View>
          <View style={styles.macroItemSml}><Text style={styles.macTextC}>{macros.carbs.current}g C</Text></View>
          <View style={styles.macroItemSml}><Text style={styles.macTextF}>{macros.fat.current}g F</Text></View>
        </View>
      </View>

      <ScrollView style={{flex: 1, marginTop: SPACING.lg}}>
        {([
          { label: 'Breakfast', value: 'breakfast' as MealSlot },
          { label: 'Lunch', value: 'lunch' as MealSlot },
          { label: 'Dinner', value: 'dinner' as MealSlot },
          { label: 'Snacks', value: 'snack' as MealSlot },
        ]).map((meal) => (
          <View key={meal.value} style={styles.mealCard}>
             <View style={styles.mealHeader}>
               <Text style={styles.mealTitle}>{meal.label}</Text>
               <TouchableOpacity onPress={() => handleOpenForm(meal.value)} style={styles.addBtnWrap}><Text style={styles.addBtn}>+ Add</Text></TouchableOpacity>
             </View>
             {mealLogs[meal.value].length === 0 ? (
               <Text style={styles.emptyMealText}>No foods logged yet.</Text>
             ) : (
               mealLogs[meal.value].map((item, idx) => (
                 <Text key={`${item}-${idx}`} style={styles.loggedMealItem}>• {item}</Text>
               ))
             )}

             {activeMealForm === meal.value && (
               <View style={styles.formCard}>
                 <TextInput
                   style={styles.formInput}
                   value={entry.food_name}
                   onChangeText={(food_name) => setEntry((prev) => ({ ...prev, food_name }))}
                   placeholder="Food name"
                   placeholderTextColor={COLORS.dark.textSecondary}
                 />
                 <View style={styles.formRow}>
                   <TextInput
                     style={[styles.formInput, styles.formInputHalf]}
                     value={entry.calories_kcal}
                     onChangeText={(calories_kcal) => setEntry((prev) => ({ ...prev, calories_kcal }))}
                     keyboardType="numeric"
                     placeholder="kcal"
                     placeholderTextColor={COLORS.dark.textSecondary}
                   />
                   <TextInput
                     style={[styles.formInput, styles.formInputHalf]}
                     value={entry.protein_g}
                     onChangeText={(protein_g) => setEntry((prev) => ({ ...prev, protein_g }))}
                     keyboardType="numeric"
                     placeholder="protein"
                     placeholderTextColor={COLORS.dark.textSecondary}
                   />
                 </View>
                 <View style={styles.formRow}>
                   <TextInput
                     style={[styles.formInput, styles.formInputHalf]}
                     value={entry.carbs_g}
                     onChangeText={(carbs_g) => setEntry((prev) => ({ ...prev, carbs_g }))}
                     keyboardType="numeric"
                     placeholder="carbs"
                     placeholderTextColor={COLORS.dark.textSecondary}
                   />
                   <TextInput
                     style={[styles.formInput, styles.formInputHalf]}
                     value={entry.fats_g}
                     onChangeText={(fats_g) => setEntry((prev) => ({ ...prev, fats_g }))}
                     keyboardType="numeric"
                     placeholder="fat"
                     placeholderTextColor={COLORS.dark.textSecondary}
                   />
                 </View>
                 <View style={styles.formActionRow}>
                   <TouchableOpacity onPress={() => setActiveMealForm(null)} style={styles.cancelBtn}>
                     <Text style={styles.cancelBtnText}>Cancel</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={handleSaveMeal} style={styles.saveBtn} disabled={saving}>
                     <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
                   </TouchableOpacity>
                 </View>
               </View>
             )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, padding: SPACING.lg, paddingTop: 60 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.dark.textPrimary, marginBottom: SPACING.xs },
  subtitle: { color: COLORS.dark.textSecondary, marginBottom: SPACING.lg, fontSize: 14 },
  summaryBox: { backgroundColor: COLORS.dark.bgSecondary, padding: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.dark.bgInput },
  macroRow: { flexDirection: 'row', justifyContent: 'center' },
  macroItem: { alignItems: 'center' },
  macroVal: { fontSize: 36, fontWeight: 'bold', color: COLORS.dark.accentGold },
  macroLabel: { fontSize: 14, color: COLORS.dark.textSecondary },
  macroItemSml: { flex: 1, alignItems: 'center' },
  macTextP: { color: COLORS.dark.accentRed, fontWeight: 'bold', fontSize: 16 },
  macTextC: { color: COLORS.dark.success, fontWeight: 'bold', fontSize: 16 },
  macTextF: { color: COLORS.dark.accentGold, fontWeight: 'bold', fontSize: 16 },
  mealCard: { backgroundColor: COLORS.dark.bgSecondary, padding: SPACING.lg, borderRadius: RADIUS.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.dark.bgInput },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealTitle: { color: COLORS.dark.textPrimary, fontSize: 18, fontWeight: 'bold' },
  addBtnWrap: { backgroundColor: COLORS.dark.bgInput, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  addBtn: { color: COLORS.dark.accentRed, fontWeight: 'bold' },
  emptyMealText: { color: COLORS.dark.textSecondary, marginTop: SPACING.sm, fontStyle: 'italic' },
  loggedMealItem: { color: COLORS.dark.textPrimary, marginTop: SPACING.sm },
  formCard: { marginTop: SPACING.md, backgroundColor: COLORS.dark.bgPrimary, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.dark.bgInput },
  formRow: { flexDirection: 'row', gap: SPACING.sm },
  formInput: { backgroundColor: COLORS.dark.bgInput, color: COLORS.dark.textPrimary, borderRadius: RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.sm },
  formInputHalf: { flex: 1 },
  formActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm },
  cancelBtn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  cancelBtnText: { color: COLORS.dark.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: COLORS.dark.accentRed, borderRadius: RADIUS.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  saveBtnText: { color: COLORS.dark.textPrimary, fontWeight: '700' }
});
