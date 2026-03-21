import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../../constants/tokens';

export default function RankTab() {
  // Mock data for MVP visuals
  const currentRank = { name: 'Rookie', xp: 450, icon: '🛡️' };
  const nextRank = { name: 'Iron Novice', xp: 1000 };

  const progressPct = Math.min(100, (currentRank.xp / nextRank.xp) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Your Rank</Text>
      
      <View style={styles.rankCard}>
        <Text style={styles.rankIcon}>{currentRank.icon}</Text>
        <Text style={styles.rankName}>{currentRank.name}</Text>
        <View style={styles.xpBox}>
             <Text style={styles.xpValue}>{currentRank.xp}</Text>
             <Text style={styles.xpLabel}>XP</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.nextRankText}>{nextRank.xp - currentRank.xp} XP to {nextRank.name}</Text>
      </View>

      <Text style={styles.recentTitle}>Recent XP Activity</Text>
      <ScrollView style={{flex: 1}}>
        <View style={styles.activityRow}>
           <Text style={styles.activityText}>Completed Workout Session</Text>
           <Text style={styles.activityXp}>+50 XP</Text>
        </View>
        <View style={styles.activityRow}>
           <Text style={styles.activityText}>New Personal Record</Text>
           <Text style={styles.activityXp}>+25 XP</Text>
        </View>
        <View style={styles.activityRow}>
           <Text style={styles.activityText}>Logged Bodyweight</Text>
           <Text style={styles.activityXp}>+10 XP</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, padding: SPACING.lg, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.dark.textPrimary, marginBottom: SPACING.xl },
  rankCard: { backgroundColor: COLORS.dark.bgSecondary, padding: SPACING.xl, borderRadius: RADIUS.lg, alignItems: 'center', marginBottom: SPACING.xl },
  rankIcon: { fontSize: 64, marginBottom: SPACING.sm },
  rankName: { color: COLORS.dark.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: SPACING.lg },
  xpBox: { flexDirection: 'row', alignItems: 'baseline', marginBottom: SPACING.xl },
  xpValue: { color: COLORS.dark.accentGold, fontSize: 48, fontWeight: 'bold' },
  xpLabel: { color: COLORS.dark.textSecondary, fontSize: 20, marginLeft: SPACING.xs },
  progressBarContainer: { width: '100%', height: 12, backgroundColor: COLORS.dark.bgInput, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.sm },
  progressBarFill: { height: '100%', backgroundColor: COLORS.dark.accentGold },
  nextRankText: { color: COLORS.dark.textSecondary, fontSize: 14, alignSelf: 'flex-end' },
  recentTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark.textPrimary, marginBottom: SPACING.md },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.dark.bgSecondary },
  activityText: { color: COLORS.dark.textPrimary, fontSize: 16 },
  activityXp: { color: COLORS.dark.accentGreen, fontWeight: 'bold', fontSize: 16 }
});
