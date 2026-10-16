import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@/constants/tokens';
import { api } from '@/services/api';

type XpRecord = {
  total_xp: number;
};

type RankInfo = {
  name: string;
  minXp: number;
};

type XpTransaction = {
  id: string;
  reason: string;
  amount: number;
};

export default function RankTab() {
  const [loading, setLoading] = useState(true);
  const [xpRecord, setXpRecord] = useState<XpRecord>({ total_xp: 0 });
  const [currentRank, setCurrentRank] = useState<RankInfo>({ name: 'Rookie', minXp: 0 });
  const [nextRank, setNextRank] = useState<RankInfo | null>(null);
  const [transactions, setTransactions] = useState<XpTransaction[]>([]);

  useEffect(() => {
    const loadGamification = async () => {
      try {
        const { data } = await api.get('/gamification');
        setXpRecord(data?.xpRecord ?? { total_xp: 0 });
        setCurrentRank(data?.currentRank ?? { name: 'Rookie', minXp: 0 });
        setNextRank(data?.nextRank ?? null);
        setTransactions(Array.isArray(data?.recentTransactions) ? data.recentTransactions : []);
      } catch {
        setXpRecord({ total_xp: 0 });
        setCurrentRank({ name: 'Rookie', minXp: 0 });
        setNextRank(null);
      } finally {
        setLoading(false);
      }
    };

    loadGamification();
  }, []);

  const progressPct = useMemo(() => {
    if (!nextRank) return 100;
    const span = Math.max(nextRank.minXp - currentRank.minXp, 1);
    const inRank = Math.max(xpRecord.total_xp - currentRank.minXp, 0);
    return Math.min(100, (inRank / span) * 100);
  }, [currentRank.minXp, nextRank, xpRecord.total_xp]);

  const remainingXp = nextRank ? Math.max(nextRank.minXp - xpRecord.total_xp, 0) : 0;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={COLORS.dark.accentGold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Your Rank</Text>
      
      <View style={styles.rankCard}>
        <Text style={styles.rankIcon}>🛡️</Text>
        <Text style={styles.rankName}>{currentRank.name}</Text>
        <View style={styles.xpBox}>
             <Text style={styles.xpValue}>{xpRecord.total_xp}</Text>
             <Text style={styles.xpLabel}>XP</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.nextRankText}>
          {nextRank ? `${remainingXp} XP to ${nextRank.name}` : 'Max rank reached'}
        </Text>
      </View>

      <Text style={styles.recentTitle}>Recent XP Activity</Text>
      <ScrollView style={{flex: 1}}>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No XP activity yet. Finish a workout to earn your first points.</Text>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction.id} style={styles.activityRow}>
              <Text style={styles.activityText}>{transaction.reason}</Text>
              <Text style={styles.activityXp}>{transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount} XP</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, padding: SPACING.lg, paddingTop: 60 },
  centered: { justifyContent: 'center', alignItems: 'center' },
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
  activityXp: { color: COLORS.dark.success, fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: COLORS.dark.textSecondary, fontSize: 14 }
});
