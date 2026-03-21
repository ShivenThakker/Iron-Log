import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../constants/tokens';

export default function InsightsTab() {
  const stats = {
    totalSessions: 14,
    prCount: 5,
    totalVolumeKg: 12500,
    streak: 3
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      
      <ScrollView>
        <View style={styles.row}>
           <View style={styles.statBox}>
              <Text style={styles.statVal}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.statVal}>{stats.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
           </View>
        </View>

        <View style={styles.row}>
           <View style={styles.statBox}>
              <Text style={styles.statVal}>{stats.prCount}</Text>
              <Text style={styles.statLabel}>PRs Hit</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.statVal}>{stats.totalVolumeKg/1000}k</Text>
              <Text style={styles.statLabel}>Kg Lifted</Text>
           </View>
        </View>

        <View style={styles.chartPlaceholder}>
           <Text style={styles.chartText}>Volume Over Time (Chart UI)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, padding: SPACING.lg, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.dark.textPrimary, marginBottom: SPACING.xl },
  row: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  statBox: { flex: 1, backgroundColor: COLORS.dark.bgSecondary, padding: SPACING.xl, borderRadius: RADIUS.lg, alignItems: 'center' },
  statVal: { color: COLORS.dark.accentRed, fontSize: 32, fontWeight: 'bold' },
  statLabel: { color: COLORS.dark.textSecondary, fontSize: 16, marginTop: SPACING.xs },
  chartPlaceholder: { height: 200, backgroundColor: COLORS.dark.bgSecondary, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl },
  chartText: { color: COLORS.dark.textSecondary, fontStyle: 'italic' }
});
