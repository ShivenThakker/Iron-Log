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
import { GradientButton } from '@/components/ui/GradientButton';
import { Icon, IconName } from '@/components/ui/Icon';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_SHADOWS,
} from '@/constants/tokens';
import { api } from '@/services/api';

interface TrophyItem {
  id: string;
  name: string;
  description: string;
  category: 'STREAK' | 'WORKOUTS' | 'MILESTONES' | 'SPECIAL';
  icon: IconName;
  badgeLabel: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const DEFAULT_TROPHIES: TrophyItem[] = [
  // STREAK
  { id: 't-1', name: 'Consistency', description: 'Maintain a 7-day workout streak', category: 'STREAK', icon: 'Flame', badgeLabel: '7D STREAK', unlocked: true, unlockedAt: 'Yesterday' },
  { id: 't-2', name: 'Dedicated', description: 'Maintain a 30-day workout streak', category: 'STREAK', icon: 'Lightning', badgeLabel: '30 DAYS', unlocked: false },
  { id: 't-3', name: 'Year Strong', description: 'Maintain a 365-day workout streak', category: 'STREAK', icon: 'Trophy', badgeLabel: '365 DAYS', unlocked: false },

  // WORKOUTS
  { id: 't-4', name: 'Getting Started', description: 'Complete your first workout session', category: 'WORKOUTS', icon: 'Barbell', badgeLabel: '1ST SESSION', unlocked: true, unlockedAt: 'Oct 12' },
  { id: 't-5', name: 'Regular', description: 'Complete 25 total workout sessions', category: 'WORKOUTS', icon: 'CalendarCheck', badgeLabel: '25 WORKOUTS', unlocked: false },
  { id: 't-6', name: 'Century Club', description: 'Complete 100 total workout sessions', category: 'WORKOUTS', icon: 'Sparkle', badgeLabel: '100 WORKOUTS', unlocked: false },

  // MILESTONES
  { id: 't-7', name: 'Rising Star', description: 'Hit your very first Personal Record (PR)', category: 'MILESTONES', icon: 'Trophy', badgeLabel: '1ST PR', unlocked: true, unlockedAt: 'Oct 14' },
  { id: 't-8', name: 'Achiever', description: 'Set 10 Personal Records', category: 'MILESTONES', icon: 'ChartLineUp', badgeLabel: '10 PRS', unlocked: false },
  { id: 't-9', name: 'Champion', description: 'Set 50 Personal Records', category: 'MILESTONES', icon: 'Trophy', badgeLabel: '50 PRS', unlocked: false },

  // SPECIAL
  { id: 't-10', name: 'First Step', description: 'Complete your onboarding assessment', category: 'SPECIAL', icon: 'CheckCircle', badgeLabel: 'ONBOARDING', unlocked: true, unlockedAt: 'Oct 10' },
  { id: 't-11', name: 'Early Bird', description: 'Finish a workout before 7:00 AM', category: 'SPECIAL', icon: 'Sun', badgeLabel: 'BEFORE 7 AM', unlocked: false },
  { id: 't-12', name: 'Night Owl', description: 'Finish a workout after 10:00 PM', category: 'SPECIAL', icon: 'Moon', badgeLabel: 'AFTER 10 PM', unlocked: false },
];

export default function AchievementsTab() {
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyItem | null>(null);

  // Read gamification data from GET /gamification
  const { data: gamificationData, refetch, isRefetching } = useQuery({
    queryKey: ['gamificationData'],
    queryFn: async () => {
      const res = await api.get('/gamification').catch(() => null);
      return res?.data ?? null;
    },
  });

  const currentRank = gamificationData?.currentRank?.name || 'Rookie';
  const totalXp = gamificationData?.xpRecord?.total_xp ?? 155;
  const nextRank = gamificationData?.nextRank?.name || 'Grinder';
  const nextRankMinXp = gamificationData?.nextRank?.minXp || 251;
  const currentRankMinXp = gamificationData?.currentRank?.minXp || 0;

  const xpInRank = Math.max(totalXp - currentRankMinXp, 0);
  const span = Math.max(nextRankMinXp - currentRankMinXp, 1);
  const progressRatio = Math.min(xpInRank / span, 1);
  const remainingXp = Math.max(nextRankMinXp - totalXp, 0);

  interface ApiTrophy {
    id?: string;
    name?: string;
    unlocked?: boolean;
    unlockedAt?: string | Date;
  }

  const trophies: TrophyItem[] = React.useMemo(() => {
    if (!gamificationData?.trophies?.length) return DEFAULT_TROPHIES;
    return DEFAULT_TROPHIES.map((def) => {
      const found = (gamificationData.trophies as ApiTrophy[]).find(
        (t) => t.id === def.id || t.name === def.name
      );
      return found
        ? {
            ...def,
            unlocked: !!found.unlocked,
            unlockedAt: found.unlockedAt ? String(found.unlockedAt) : undefined,
          }
        : def;
    });
  }, [gamificationData]);

  const unlockedCount = trophies.filter((t) => t.unlocked).length;
  const categories = ['STREAK', 'WORKOUTS', 'MILESTONES', 'SPECIAL'] as const;

  return (
    <ScreenContainer scrollable={false} theme="obsidian">
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={OBSIDIAN_COLORS.voltLime}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text variant="labelCaps" style={styles.kicker}>ATHLETE RANKING</Text>
              <Text variant="headlineLgMobile" style={styles.title}>Achievements</Text>
            </View>
            <Badge label="Season 1" variant="volt" />
          </View>

          {/* Hero Status Card: Tier, XP, Progress Bar */}
          <GlassCard variant="obsidianLevel1" style={styles.heroRankCard}>
            {/* Center Emblem & Rank Identity */}
            <View style={styles.rankCenterIdentity}>
              <View style={styles.shieldEmblemContainer}>
                <View style={styles.shieldCircle}>
                  <Icon name="Trophy" size={32} color={OBSIDIAN_COLORS.cyanAccent} weight="fill" />
                </View>
                <View style={styles.tierPill}>
                  <Text style={styles.tierPillText}>1</Text>
                </View>
              </View>

              <Text variant="headlineMd" style={styles.rankTitle}>
                {currentRank.toUpperCase()}
              </Text>

              {/* Total XP Pill */}
              <View style={styles.xpPill}>
                <Icon name="Flame" size={16} color={OBSIDIAN_COLORS.voltLime} weight="fill" />
                <Text style={styles.xpNumber}>{totalXp}</Text>
                <Text variant="labelCaps" style={styles.xpLabel}>TOTAL XP</Text>
              </View>
            </View>

            {/* Tier Progress Gauge */}
            <View style={styles.gaugeContainer}>
              <View style={styles.gaugeHeader}>
                <Text variant="labelCaps" style={{ color: OBSIDIAN_COLORS.textWhite }}>
                  {currentRank}
                </Text>
                <Text variant="labelCaps" style={{ color: OBSIDIAN_COLORS.voltLime, fontWeight: '700' }}>
                  {remainingXp} XP TO {nextRank.toUpperCase()}
                </Text>
                <Text variant="labelCaps" style={{ color: OBSIDIAN_COLORS.textSlate }}>
                  {nextRank}
                </Text>
              </View>

              <ProgressBar
                progress={progressRatio}
                color={OBSIDIAN_COLORS.voltLime}
                trackColor={OBSIDIAN_COLORS.surfaceContainerHighest}
                height={8}
              />

              <View style={styles.gaugeFooter}>
                <Text variant="bodySm" style={{ color: OBSIDIAN_COLORS.textSlate }}>
                  {currentRankMinXp} XP
                </Text>
                <Text variant="bodySm" style={{ color: OBSIDIAN_COLORS.textSlate }}>
                  {nextRankMinXp} XP
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Trophy Case Section */}
          <View style={styles.trophySection}>
            <View style={styles.trophySectionHeader}>
              <View style={styles.trophySectionTitleRow}>
                <Icon name="Trophy" size={20} color={OBSIDIAN_COLORS.voltLime} weight="fill" />
                <Text variant="headlineSm" style={styles.trophySectionTitle}>
                  Trophy Case
                </Text>
              </View>
              <View style={styles.trophyCounterPill}>
                <Text style={styles.trophyCounterBold}>{unlockedCount}</Text>
                <Text style={styles.trophyCounterMuted}>/ {trophies.length} UNLOCKED</Text>
              </View>
            </View>

            {/* Trophy Categories */}
            <View style={styles.categoriesStack}>
              {categories.map((cat) => {
                const catTrophies = trophies.filter((t) => t.category === cat);
                const catUnlocked = catTrophies.filter((t) => t.unlocked).length;

                return (
                  <View key={cat} style={styles.categoryBlock}>
                    <View style={styles.categoryHeader}>
                      <Text variant="labelCaps" style={styles.categoryLabel}>{cat}</Text>
                      <Text variant="labelCaps" style={{ color: OBSIDIAN_COLORS.voltLime }}>
                        {catUnlocked} OF {catTrophies.length}
                      </Text>
                    </View>

                    <View style={styles.trophiesGrid}>
                      {catTrophies.map((trophy) => (
                        <TouchableOpacity
                          key={trophy.id}
                          style={[
                            styles.trophyTile,
                            trophy.unlocked ? styles.trophyTileUnlocked : styles.trophyTileLocked,
                          ]}
                          onPress={() => setSelectedTrophy(trophy)}
                          activeOpacity={0.8}
                        >
                          {trophy.unlocked ? (
                            <View style={styles.trophyActiveStripe} />
                          ) : null}

                          <View
                            style={[
                              styles.trophyIconContainer,
                              trophy.unlocked ? styles.trophyIconUnlocked : styles.trophyIconLocked,
                            ]}
                          >
                            <Icon
                              name={trophy.unlocked ? trophy.icon : 'Lock'}
                              size={20}
                              color={trophy.unlocked ? OBSIDIAN_COLORS.voltLime : OBSIDIAN_COLORS.textSlate}
                              weight={trophy.unlocked ? 'fill' : 'regular'}
                            />
                          </View>

                          <Text
                            variant="labelCaps"
                            style={[
                              styles.trophyTileName,
                              { color: trophy.unlocked ? OBSIDIAN_COLORS.textWhite : OBSIDIAN_COLORS.textSlate },
                            ]}
                            numberOfLines={1}
                          >
                            {trophy.name}
                          </Text>

                          <Text
                            style={[
                              styles.trophyTileBadge,
                              { color: trophy.unlocked ? OBSIDIAN_COLORS.voltLime : OBSIDIAN_COLORS.textSlate },
                            ]}
                            numberOfLines={1}
                          >
                            {trophy.badgeLabel}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Trophy Detail Inspection Modal */}
        <Modal
          visible={!!selectedTrophy}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTrophy(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalTrophyCircle}>
                <Icon
                  name={selectedTrophy?.unlocked ? selectedTrophy.icon : 'Lock'}
                  size={36}
                  color={selectedTrophy?.unlocked ? OBSIDIAN_COLORS.voltLime : OBSIDIAN_COLORS.textSlate}
                  weight={selectedTrophy?.unlocked ? 'fill' : 'regular'}
                />
              </View>

              <Badge
                label={selectedTrophy?.unlocked ? 'UNLOCKED' : 'LOCKED'}
                variant={selectedTrophy?.unlocked ? 'volt' : 'darkSlate'}
                style={{ marginBottom: OBSIDIAN_SPACING.sm }}
              />

              <Text variant="headlineSm" style={styles.modalTitle}>
                {selectedTrophy?.name}
              </Text>

              <Text variant="bodyMd" style={styles.modalDescription}>
                {selectedTrophy?.description}
              </Text>

              {selectedTrophy?.unlockedAt ? (
                <Text variant="bodySm" style={styles.modalUnlockedTime}>
                  Unlocked: {selectedTrophy.unlockedAt}
                </Text>
              ) : null}

              <View style={styles.modalXpRewardRow}>
                <Icon name="Lightning" size={16} color={OBSIDIAN_COLORS.voltLime} />
                <Text style={styles.modalXpText}>+25 XP Achievement</Text>
              </View>

              <GradientButton
                variant="volt"
                title="Got it"
                onPress={() => setSelectedTrophy(null)}
                style={{ width: '100%', marginTop: OBSIDIAN_SPACING.md }}
              />
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
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: OBSIDIAN_SPACING.sm,
    marginBottom: OBSIDIAN_SPACING.xs,
  },
  kicker: {
    color: OBSIDIAN_COLORS.voltLime,
    letterSpacing: 1.5,
  },
  title: {
    color: OBSIDIAN_COLORS.textWhite,
    marginTop: 2,
  },
  heroRankCard: {
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.lg,
    marginBottom: OBSIDIAN_SPACING.lg,
    alignItems: 'center',
  },
  rankCenterIdentity: {
    alignItems: 'center',
    marginBottom: OBSIDIAN_SPACING.md,
  },
  shieldEmblemContainer: {
    position: 'relative',
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  shieldCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierPill: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierPillText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    color: OBSIDIAN_COLORS.onPrimary,
  },
  rankTitle: {
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: 1,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingVertical: 5,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    borderRadius: OBSIDIAN_RADIUS.full,
    marginTop: OBSIDIAN_SPACING.xs + 2,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  xpNumber: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    color: OBSIDIAN_COLORS.voltLime,
  },
  xpLabel: {
    color: OBSIDIAN_COLORS.textMuted,
  },
  gaugeContainer: {
    width: '100%',
    marginTop: OBSIDIAN_SPACING.xs,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gaugeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  trophySection: {
    marginTop: OBSIDIAN_SPACING.xs,
  },
  trophySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: OBSIDIAN_SPACING.md,
    paddingHorizontal: 2,
  },
  trophySectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.xs + 2,
  },
  trophySectionTitle: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  trophyCounterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: OBSIDIAN_RADIUS.full,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  trophyCounterBold: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
  },
  trophyCounterMuted: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 10,
    color: OBSIDIAN_COLORS.textSlate,
  },
  categoriesStack: {
    gap: OBSIDIAN_SPACING.lg,
  },
  categoryBlock: {
    gap: OBSIDIAN_SPACING.xs + 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  categoryLabel: {
    color: OBSIDIAN_COLORS.textMuted,
  },
  trophiesGrid: {
    flexDirection: 'row',
    gap: OBSIDIAN_SPACING.xs + 2,
  },
  trophyTile: {
    flex: 1,
    borderRadius: OBSIDIAN_RADIUS.lg,
    paddingVertical: OBSIDIAN_SPACING.md,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    position: 'relative',
    overflow: 'hidden',
  },
  trophyTileUnlocked: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderElevated,
    ...OBSIDIAN_SHADOWS.cardLevel1,
  },
  trophyTileLocked: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    opacity: 0.7,
  },
  trophyActiveStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  trophyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  trophyIconUnlocked: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
  },
  trophyIconLocked: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
  },
  trophyTileName: {
    textAlign: 'center',
    marginBottom: 3,
  },
  trophyTileBadge: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 11, 16, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: OBSIDIAN_SPACING.xl,
  },
  modalCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    ...OBSIDIAN_SHADOWS.cardLevel3,
  },
  modalTrophyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: OBSIDIAN_SPACING.md,
  },
  modalTitle: {
    color: OBSIDIAN_COLORS.textWhite,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalDescription: {
    color: OBSIDIAN_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  modalUnlockedTime: {
    color: OBSIDIAN_COLORS.voltLime,
    marginBottom: OBSIDIAN_SPACING.xs,
  },
  modalXpRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: OBSIDIAN_COLORS.voltOverlay10,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: OBSIDIAN_RADIUS.full,
    marginTop: OBSIDIAN_SPACING.xs,
  },
  modalXpText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
  },
});
