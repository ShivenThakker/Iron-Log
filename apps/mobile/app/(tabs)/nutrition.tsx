import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../constants/tokens';

export default function NutritionTab() {
  // Mock data for MVP visual layout
  const macros = {
    cals: { current: 1850, target: 2500 },
    protein: { current: 140, target: 180 },
    carbs: { current: 200, target: 250 },
    fat: { current: 50, target: 70 }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Nutrition</Text>
      
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

      <ScrollView style={{flex: 1, marginTop: SPACING.xl}}>
        {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => (
          <View key={meal} style={styles.mealCard}>
             <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
               <Text style={styles.mealTitle}>{meal}</Text>
               <TouchableOpacity><Text style={styles.addBtn}>+ Add</Text></TouchableOpacity>
             </View>
             <Text style={styles.emptyMealText}>No foods logged yet.</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, padding: SPACING.lg, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.dark.textPrimary, marginBottom: SPACING.lg },
  summaryBox: { backgroundColor: COLORS.dark.bgSecondary, padding: SPACING.xl, borderRadius: RADIUS.lg },
  macroRow: { flexDirection: 'row', justifyContent: 'center' },
  macroItem: { alignItems: 'center' },
  macroVal: { fontSize: 36, fontWeight: 'bold', color: COLORS.dark.accentGold },
  macroLabel: { fontSize: 14, color: COLORS.dark.textSecondary },
  macroItemSml: { flex: 1, alignItems: 'center' },
  macTextP: { color: COLORS.dark.accentRed, fontWeight: 'bold', fontSize: 16 },
  macTextC: { color: COLORS.dark.accentGreen, fontWeight: 'bold', fontSize: 16 },
  macTextF: { color: COLORS.dark.accentGold, fontWeight: 'bold', fontSize: 16 },
  mealCard: { backgroundColor: COLORS.dark.bgSecondary, padding: SPACING.lg, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  mealTitle: { color: COLORS.dark.textPrimary, fontSize: 18, fontWeight: 'bold' },
  addBtn: { color: COLORS.dark.accentRed, fontWeight: 'bold' },
  emptyMealText: { color: COLORS.dark.textSecondary, marginTop: SPACING.sm, fontStyle: 'italic' }
});
