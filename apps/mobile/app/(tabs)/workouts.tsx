import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../../constants/tokens';

export default function WorkoutsTab() {
  const router = useRouter();

  const handleStartWorkout = () => {
    // Navigate straight to ad-hoc workout mode
    router.push('/workout/active');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout</Text>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Today</Text>
        <Text style={styles.heroTitle}>Upper Body A</Text>
        <Text style={styles.heroSub}>3 exercises • ~45 min</Text>
      </View>
      
      <ScrollView>
        <TouchableOpacity style={styles.programCard} onPress={handleStartWorkout}>
          <Text style={styles.programName}>My First Program</Text>
          <Text style={styles.programSub}>Tap to start and log your working sets</Text>
        </TouchableOpacity>

        {/* Start Empty Workout Button */}
        <TouchableOpacity style={styles.startEmptyButton} onPress={handleStartWorkout}>
          <Text style={styles.startEmptyText}>+ Start Empty Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, padding: SPACING.lg, paddingTop: 60 },
  title: { fontSize: 30, fontWeight: 'bold', color: COLORS.dark.textPrimary, marginBottom: SPACING.md },
  heroCard: { backgroundColor: COLORS.dark.bgSecondary, padding: SPACING.lg, borderRadius: RADIUS.lg, marginBottom: SPACING.lg },
  heroLabel: { color: COLORS.dark.accentGold, fontWeight: '700', marginBottom: SPACING.xs },
  heroTitle: { color: COLORS.dark.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: SPACING.xs },
  heroSub: { color: COLORS.dark.textSecondary, fontSize: 14 },
  programCard: { backgroundColor: COLORS.dark.bgSecondary, padding: SPACING.xl, borderRadius: RADIUS.lg, marginBottom: SPACING.md },
  programName: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark.textPrimary },
  programSub: { fontSize: 14, color: COLORS.dark.textSecondary, marginTop: SPACING.xs },
  startEmptyButton: { backgroundColor: COLORS.dark.accentRed, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.xl },
  startEmptyText: { color: COLORS.dark.textPrimary, fontSize: 18, fontWeight: 'bold' }
});
