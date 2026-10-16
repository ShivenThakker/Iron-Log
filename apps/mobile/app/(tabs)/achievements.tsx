import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
import { api } from '@/services/api';

interface TrophyItem {
  id: string;
  name: string;
  description: string;
  category: 'STREAK' | 'WORKOUTS' | 'MILESTONES' | 'SPECIAL';
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const DEFAULT_TROPHIES: TrophyItem[] = [
  // STREAK
  { id: 't-1', name: 'Consistency', description: 'Maintain a 7-day workout streak', category: 'STREAK', icon: '🔥', unlocked: true, unlockedAt: 'Yesterday' },
  { id: 't-2', name: 'Dedicated', description: 'Maintain a 30-day workout streak', category: 'STREAK', icon: '⚡', unlocked: false },
  { id: 't-3', name: 'Year Strong', description: 'Maintain a 365-day workout streak', category: 'STREAK', icon: '👑', unlocked: false },

  // WORKOUTS
  { id: 't-4', name: 'Getting Started', description: 'Complete your first workout session', category: 'WORKOUTS', icon: '🏋️', unlocked: true, unlockedAt: 'Oct 12' },
  { id: 't-5', name: 'Regular', description: 'Complete 25 total workout sessions', category: 'WORKOUTS', icon: '💪', unlocked: false },
  { id: 't-6', name: 'Century Club', description: 'Complete 100 total workout sessions', category: 'WORKOUTS', icon: '💯', unlocked: false },

  // MILESTONES
  { id: 't-7', name: 'Rising Star', description: 'Hit your very first Personal Record (PR)', category: 'MILESTONES', icon: '⭐', unlocked: true, unlockedAt: 'Oct 14' },
  { id: 't-8', name: 'Achiever', description: 'Set 10 Personal Records', category: 'MILESTONES', icon: '🎯', unlocked: false },
  { id: 't-9', name: 'Champion', description: 'Set 50 Personal Records', category: 'MILESTONES', icon: '🏆', unlocked: false },

  // SPECIAL
  { id: 't-10', name: 'First Step', description: 'Complete your onboarding assessment', category: 'SPECIAL', icon: '🚀', unlocked: true, unlockedAt: 'Oct 10' },
  { id: 't-11', name: 'Early Bird', description: 'Finish a workout before 7:00 AM', category: 'SPECIAL', icon: '🌅', unlocked: false },
  { id: 't-12', name: 'Night Owl', description: 'Finish a workout after 10:00 PM', category: 'SPECIAL', icon: '🌙', unlocked: false },
];

const XP_ACTIONS = [
  { action: 'Complete a Workout', xp: '+50 XP', icon: 'Barbell' },
  { action: 'Set Personal Record (PR)', xp: '+25 XP', icon: 'Trophy' },
  { action: 'Maintain Weekly Streak', xp: '+10 XP', icon: 'Flame' },
  { action: 'Log Daily Nutrition', xp: '+5 XP', icon: 'ForkKnife' },
  { action: 'Log Body Weight', xp: '+5 XP', icon: 'Scales' },
  { action: 'Complete Onboarding', xp: '+100 XP', icon: 'CheckCircle' },
];

export default function AchievementsTab() {
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyItem | null>(null);

  const { data: gamificationData, refetch, isRefetching } = useQuery({
    queryKey: ['gamificationData'],
    queryFn: async () => {
      const res = await api.get('/gamification').catch(() => null);
      return res?.data ?? null;
    },
  });

  const currentRank = gamificationData?.currentRank?.name || 'Rookie';
  const totalXp = gamificationData?.xpRecord?.total_xp || 140;
  const nextRank = gamificationData?.nextRank?.name || 'Grinder';
  const nextRankMinXp = gamificationData?.nextRank?.minXp || 251;
  const currentRankMinXp = gamificationData?.currentRank?.minXp || 0;

  const xpInRank = Math.max(totalXp - currentRankMinXp, 0);
  const span = Math.max(nextRankMinXp - currentRankMinXp, 1);
  const progressRatio = Math.min(xpInRank / span, 1);
  const remainingXp = Math.max(nextRankMinXp - totalXp, 0);

  const trophies: TrophyItem[] = gamificationData?.trophies?.length
    ? gamificationData.trophies
    : DEFAULT_TROPHIES;

  const categories = ['STREAK', 'WORKOUTS', 'MILESTONES', 'SPECIAL'] as const;

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
              tintColor={COLORS.dark.accentGold}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text variant="caption" style={styles.kicker}>ATHLETE RANKING</Text>
              <Text variant="h1" style={styles.title}>Achievements</Text>
            </View>
            <Badge label="Season 1" variant="gold" />
          </View>

          {/* Hero Rank Emblem Card (GymStreak Inspired) */}
          <GlassCard style={styles.heroRankCard}>
            <View style={styles.rankEmblem}>
              <Text style={styles.emblemEmoji}>🛡️</Text>
              <View style={styles.rankGlow} />
            </View>

            <Badge label="CURRENT STATUS" variant="gold" style={styles.statusBadge} />
            <Text variant="h1" style={styles.rankName}>
              {currentRank.toUpperCase()}
            </Text>

            <View style={styles.xpRow}>
              <Text style={styles.fireEmoji}>🔥</Text>
              <Text variant="mono" style={styles.xpCount}>
                {totalXp}
              </Text>
              <Text variant="body" style={styles.xpSuffix}>
                TOTAL XP
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text variant="caption" style={styles.rankStep}>
                  {currentRank}
                </Text>
                <Text variant="caption" style={styles.xpRemaining}>
                  {remainingXp} XP TO {nextRank.toUpperCase()}
                </Text>
                <Text variant="caption" style={styles.rankStep}>
                  {nextRank}
                </Text>
              </View>
              <ProgressBar progress={progressRatio} color={COLORS.dark.accentGold} height={10} />
            </View>
          </GlassCard>

          {/* Trophy Case Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="h3" style={styles.sectionTitle}>
                Trophy Case
              </Text>
              <Text variant="caption" style={styles.trophyCount}>
                {trophies.filter((t) => t.unlocked).length} / {trophies.length} Unlocked
              </Text>
            </View>

            {categories.map((cat) => {
              const catTrophies = trophies.filter((t) => t.category === cat);
              return (
                <View key={cat} style={styles.categoryBlock}>
                  <Text variant="caption" style={styles.categoryTitle}>
                    {cat}
                  </Text>
                  <View style={styles.trophiesGrid}>
                    {catTrophies.map((trophy) => (
                      <TouchableOpacity
                        key={trophy.id}
                        style={[styles.trophyCard, trophy.unlocked && styles.trophyCardUnlocked]}
                        onPress={() => setSelectedTrophy(trophy)}
                      >
                        <View style={[styles.trophyIconCircle, trophy.unlocked && styles.trophyIconUnlocked]}>
                          <Text style={styles.trophyEmoji}>
                            {trophy.unlocked ? trophy.icon : '🔒'}
                          </Text>
                        </View>
                        <Text
                          variant="caption"
                          style={[styles.trophyName, trophy.unlocked && styles.trophyNameUnlocked]}
                          numberOfLines={1}
                        >
                          {trophy.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          {/* How to Earn XP Card */}
          <GlassCard style={styles.howToCard}>
            <Text variant="h3" style={styles.howToTitle}>
              How to Earn XP
            </Text>
            <View style={styles.howToList}>
              {XP_ACTIONS.map((item, idx) => (
                <View key={idx} style={styles.howToRow}>
                  <View style={styles.howToLeft}>
                    <Icon name={item.icon as any} size={18} color={COLORS.dark.accentGold} />
                    <Text variant="bodySmall" style={styles.howToAction}>
                      {item.action}
                    </Text>
                  </View>
                  <Badge label={item.xp} variant="gold" />
                </View>
              ))}
            </View>
          </GlassCard>
        </ScrollView>

        {/* Trophy Detail Modal */}
        <Modal
          visible={!!selectedTrophy}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTrophy(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[styles.modalTrophyCircle, selectedTrophy?.unlocked && styles.modalTrophyUnlocked]}>
                <Text style={{ fontSize: 50 }}>
                  {selectedTrophy?.unlocked ? selectedTrophy.icon : '🔒'}
                </Text>
              </View>

              <Badge
                label={selectedTrophy?.unlocked ? 'UNLOCKED TROPHY' : 'LOCKED'}
                variant={selectedTrophy?.unlocked ? 'gold' : 'default'}
                style={styles.modalBadge}
              />

              <Text variant="h2" style={styles.modalTrophyTitle}>
                {selectedTrophy?.name}
              </Text>

              <Text variant="body" style={styles.modalTrophyDesc}>
                {selectedTrophy?.description}
              </Text>

              {selectedTrophy?.unlockedAt && (
                <Text variant="caption" style={styles.modalUnlockedDate}>
                  Unlocked: {selectedTrophy.unlockedAt}
                </Text>
              )}

              <TouchableOpacity
                style={styles.modalDismissBtn}
                onPress={() => setSelectedTrophy(null)}
              >
                <Text variant="body" style={styles.modalDismissText}>
                  Close
                </Text>
              </TouchableOpacity>
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
  heroRankCard: {
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  rankEmblem: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  emblemEmoji: {
    fontSize: 64,
  },
  rankGlow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    zIndex: -1,
  },
  statusBadge: {
    marginBottom: 4,
  },
  rankName: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.lg,
  },
  fireEmoji: {
    fontSize: 22,
  },
  xpCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.dark.accentGold,
  },
  xpSuffix: {
    color: COLORS.dark.textSecondary,
    fontWeight: 'bold',
  },
  progressContainer: {
    width: '100%',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rankStep: {
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
  },
  xpRemaining: {
    color: COLORS.dark.accentGold,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.dark.textPrimary,
  },
  trophyCount: {
    color: COLORS.dark.textSecondary,
  },
  categoryBlock: {
    marginBottom: SPACING.lg,
  },
  categoryTitle: {
    color: COLORS.dark.accentGold,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  trophiesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trophyCard: {
    width: '31%',
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    opacity: 0.6,
  },
  trophyCardUnlocked: {
    opacity: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  trophyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.dark.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  trophyIconUnlocked: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  trophyEmoji: {
    fontSize: 24,
  },
  trophyName: {
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
  },
  trophyNameUnlocked: {
    color: COLORS.dark.textPrimary,
    fontWeight: 'bold',
  },
  howToCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  howToTitle: {
    color: COLORS.dark.textPrimary,
    marginBottom: SPACING.md,
  },
  howToList: {
    gap: SPACING.sm,
  },
  howToRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  howToLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  howToAction: {
    color: COLORS.dark.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 24, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTrophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.dark.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTrophyUnlocked: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  modalBadge: {
    marginBottom: SPACING.xs,
  },
  modalTrophyTitle: {
    color: COLORS.dark.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  modalTrophyDesc: {
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  modalUnlockedDate: {
    color: COLORS.dark.accentGold,
    marginBottom: SPACING.md,
  },
  modalDismissBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    width: '100%',
    alignItems: 'center',
  },
  modalDismissText: {
    color: COLORS.dark.textPrimary,
    fontWeight: 'bold',
  },
});
