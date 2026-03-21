import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../../constants/tokens';

export default function ActiveWorkout() {
  const router = useRouter();
  const [timer, setTimer] = useState(0); 
  const [sets, setSets] = useState([{ id: '1', weight: '', reps: '', complete: false }]);

  const addSet = () => {
    setSets(prev => [...prev, { id: Math.random().toString(), weight: '', reps: '', complete: false }]);
  };

  const toggleSet = (index: number) => {
    const newSets = [...sets];
    newSets[index].complete = !newSets[index].complete;
    setSets(newSets);
  };

  const finishWorkout = () => {
    // End session natively and dismiss stack back to tabs
    router.dismissAll();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.timer}>00:00</Text>
        <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout}>
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.exerciseName}>Barbell Bench Press</Text>
        
        <View style={styles.setRowHeader}>
          <Text style={[styles.setColText, {flex: 1}]}>Set</Text>
          <Text style={[styles.setColText, {flex: 2}]}>kg</Text>
          <Text style={[styles.setColText, {flex: 2}]}>Reps</Text>
          <Text style={[styles.setColText, {flex: 1}]}>Check</Text>
        </View>

        {sets.map((s, i) => (
          <View key={s.id} style={[styles.setRow, s.complete && styles.setRowComplete]}>
            <View style={[styles.cell, {flex: 1}]}><Text style={styles.setText}>{i + 1}</Text></View>
            <View style={[styles.cell, {flex: 2}]}>
               <TextInput style={styles.input} keyboardType="numeric" placeholder="-" placeholderTextColor="#666" editable={!s.complete}/>
            </View>
            <View style={[styles.cell, {flex: 2}]}>
               <TextInput style={styles.input} keyboardType="numeric" placeholder="-" placeholderTextColor="#666" editable={!s.complete}/>
            </View>
            <TouchableOpacity style={[styles.cell, {flex: 1}, styles.checkBtn, s.complete && styles.checkBtnComplete]} onPress={() => toggleSet(i)}>
               <Text style={{color: s.complete ? COLORS.dark.bgPrimary : COLORS.dark.textSecondary}}>✓</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addSet} onPress={addSet}>
          <Text style={styles.addSetText}>+ Add Set</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, padding: SPACING.md, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  timer: { color: COLORS.dark.textPrimary, fontSize: 24, fontWeight: 'bold' },
  finishBtn: { backgroundColor: COLORS.dark.accentGold, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  finishText: { color: COLORS.dark.textPrimary, fontWeight: 'bold', fontSize: 16 },
  exerciseName: { color: COLORS.dark.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: SPACING.md },
  setRowHeader: { flexDirection: 'row', marginBottom: SPACING.sm, paddingHorizontal: SPACING.sm },
  setColText: { color: COLORS.dark.textSecondary, fontSize: 12, textAlign: 'center', fontWeight: 'bold'},
  setRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.dark.bgSecondary, borderRadius: RADIUS.sm, marginBottom: SPACING.xs, padding: SPACING.xs },
  setRowComplete: { opacity: 0.5 },
  cell: { justifyContent: 'center', alignItems: 'center' },
  setText: { color: COLORS.dark.textPrimary, fontWeight: 'bold' },
  input: { width: '80%', backgroundColor: COLORS.dark.bgInput, color: COLORS.dark.textPrimary, textAlign: 'center', borderRadius: RADIUS.xs, paddingVertical: SPACING.xs },
  checkBtn: { backgroundColor: COLORS.dark.bgInput, paddingVertical: SPACING.sm, borderRadius: RADIUS.xs, marginHorizontal: SPACING.xs },
  checkBtnComplete: { backgroundColor: COLORS.dark.accentGreen },
  addSet: { marginTop: SPACING.md, padding: SPACING.md, alignItems: 'center' },
  addSetText: { color: COLORS.dark.textSecondary, fontWeight: 'bold' }
});
