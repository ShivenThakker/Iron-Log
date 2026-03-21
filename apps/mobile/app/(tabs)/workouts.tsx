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
      <Text style={styles.title}>Your Programs</Text>
      
      <ScrollView>
        <TouchableOpacity style={styles.programCard} onPress={handleStartWorkout}>
          <Text style={styles.programName}>My First Program</Text>
          <Text style={styles.programSub}>Tap to start an ad-hoc workout log</Text>
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
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.dark.textPrimary, marginBottom: SPACING.lg },
  programCard: { backgroundColor: COLORS.dark.bgSecondary, padding: SPACING.xl, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  programName: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark.textPrimary },
  programSub: { fontSize: 14, color: COLORS.dark.textSecondary, marginTop: SPACING.xs },
  startEmptyButton: { backgroundColor: COLORS.dark.accentRed, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.xl },
  startEmptyText: { color: COLORS.dark.textPrimary, fontSize: 18, fontWeight: 'bold' }
});
