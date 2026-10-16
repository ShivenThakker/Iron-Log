import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@/constants/tokens';

export default function ProgressTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Body Progress</Text>
      
      <ScrollView>
        {/* Weight Card */}
        <View style={styles.card}>
           <Text style={styles.cardTitle}>Current Weight</Text>
           <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
             <Text style={styles.mainValue}>76.5</Text>
             <Text style={styles.unitText}> kg</Text>
           </View>
           <Text style={styles.subText}>Target: 80.0 kg</Text>
           
           <View style={styles.logBox}>
             <TextInput style={styles.input} placeholder="Enter today's weight" placeholderTextColor="#666" keyboardType="numeric" />
             <TouchableOpacity style={styles.logBtn}><Text style={styles.logBtnText}>Log</Text></TouchableOpacity>
           </View>
        </View>

        {/* Measurements Card */}
        <View style={styles.card}>
           <Text style={styles.cardTitle}>Measurements Log</Text>
           <View style={styles.measurementRow}>
               <Text style={styles.mLabel}>Chest</Text>
               <Text style={styles.mValue}>102 cm</Text>
           </View>
           <View style={styles.measurementRow}>
               <Text style={styles.mLabel}>Arms</Text>
               <Text style={styles.mValue}>40 cm</Text>
           </View>
           <View style={styles.measurementRow}>
               <Text style={styles.mLabel}>Waist</Text>
               <Text style={styles.mValue}>84 cm</Text>
           </View>
           
           <TouchableOpacity style={[styles.logBtn, {marginTop: SPACING.lg}]}><Text style={styles.logBtnText}>+ New Measurement</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, padding: SPACING.lg, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.dark.textPrimary, marginBottom: SPACING.lg },
  card: { backgroundColor: COLORS.dark.bgSecondary, padding: SPACING.xl, borderRadius: RADIUS.lg, marginBottom: SPACING.lg },
  cardTitle: { color: COLORS.dark.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: SPACING.md },
  mainValue: { color: COLORS.dark.accentRed, fontSize: 40, fontWeight: 'bold' },
  unitText: { color: COLORS.dark.textSecondary, fontSize: 20 },
  subText: { color: COLORS.dark.textSecondary, marginTop: SPACING.xs },
  logBox: { flexDirection: 'row', marginTop: SPACING.xl, gap: SPACING.sm },
  input: { flex: 1, backgroundColor: COLORS.dark.bgInput, color: 'white', borderRadius: RADIUS.sm, padding: SPACING.md },
  logBtn: { backgroundColor: COLORS.dark.accentRed, justifyContent: 'center', paddingHorizontal: SPACING.xl, borderRadius: RADIUS.sm },
  logBtnText: { color: 'white', fontWeight: 'bold' },
  measurementRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.dark.bgInput },
  mLabel: { color: COLORS.dark.textSecondary, fontSize: 16 },
  mValue: { color: COLORS.dark.textPrimary, fontWeight: 'bold', fontSize: 16 }
});
