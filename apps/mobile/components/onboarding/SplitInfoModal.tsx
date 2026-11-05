import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_TYPOGRAPHY,
} from '@/constants/tokens';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';

export interface SplitInfoItem {
  id: string;
  name: string;
  badge: string;
  daysPerWeek: string;
  summary: string;
  targetMuscles: string[];
  schedulePreview: string;
  bestFor: string;
  proTip: string;
}

export const SPLIT_DETAILS: SplitInfoItem[] = [
  {
    id: 'Push / Pull / Legs',
    name: 'Push / Pull / Legs (PPL)',
    badge: 'MOST POPULAR',
    daysPerWeek: '3–6 Days / Week',
    summary:
      'Organizes your training by movement direction. Pushing muscles one day, pulling muscles the next, followed by lower body.',
    targetMuscles: [
      'Push: Chest, Front & Side Shoulders, Triceps',
      'Pull: Back, Rear Delts, Biceps, Forearms',
      'Legs: Quads, Hamstrings, Glutes, Calves, Core',
    ],
    schedulePreview: 'Mon: Push • Tue: Pull • Wed: Legs • Thu: Push • Fri: Pull • Sat: Legs / Rest',
    bestFor:
      'Lifters wanting optimal muscle growth frequency (hitting muscles 2x per week) with zero interference between movements.',
    proTip:
      'Because pushing movements don’t fatigue your pulling muscles, you recover faster between consecutive training sessions.',
  },
  {
    id: 'Upper / Lower',
    name: 'Upper / Lower Split',
    badge: 'TIME EFFICIENT',
    daysPerWeek: '4 Days / Week',
    summary:
      'Divides workouts into upper-body sessions and lower-body sessions. Perfect balance of volume, intensity, and recovery.',
    targetMuscles: [
      'Upper Days: Chest, Back, Shoulders, Biceps, Triceps',
      'Lower Days: Quads, Hamstrings, Glutes, Calves, Abs',
    ],
    schedulePreview: 'Mon: Upper A • Tue: Lower A • Wed: Rest • Thu: Upper B • Fri: Lower B • Sat/Sun: Rest',
    bestFor:
      'Athletes and busy individuals who want to train exactly 4 days per week with 3 full recovery days for life and other sports.',
    proTip:
      'Great for joint longevity and steady progressive overload on heavy compound lifts like bench and squat.',
  },
  {
    id: 'Full Body',
    name: 'Full Body Split',
    badge: 'MAX FREQUENCY',
    daysPerWeek: '2–3 Days / Week',
    summary:
      'Trains all major muscle groups in every session using high-yield compound lifts with 48 hours of recovery between workouts.',
    targetMuscles: [
      'Workout A: Squat, Bench Press, Cable Row, Overhead Press, Biceps',
      'Workout B: Deadlift/Hinge, Lat Pulldown, Incline Dumbbell, Leg Press, Triceps, Abs',
    ],
    schedulePreview: 'Mon: Full Body A • Tue: Rest • Wed: Full Body B • Thu: Rest • Fri: Full Body C • Sat/Sun: Rest',
    bestFor:
      'Beginners building neuromuscular foundations, busy lifters who can only hit the gym 2–3 times a week, or athletes in-season.',
    proTip:
      'Super forgiving if you miss a session—each muscle group is still stimulated 2 to 3 times every week.',
  },
  {
    id: 'Arnold Split',
    name: 'Arnold Split',
    badge: 'CLASSIC HYPERTROPHY',
    daysPerWeek: '5–6 Days / Week',
    summary:
      'The legendary routine pioneered by Arnold Schwarzenegger. Pairs opposing muscle groups (chest & back, shoulders & arms) for insane pumps.',
    targetMuscles: [
      'Day 1 & 4: Chest & Back (Antagonist supersets)',
      'Day 2 & 5: Shoulders & Arms (Biceps, Triceps, Forearms)',
      'Day 3 & 6: Legs & Core (Quads, Hamstrings, Calves, Abs)',
    ],
    schedulePreview: 'Mon: Chest & Back • Tue: Shoulders & Arms • Wed: Legs • Thu: Chest & Back • Fri: Shoulders & Arms • Sat: Legs',
    bestFor:
      'Intermediate to advanced lifters prioritizing arm and shoulder development with high-volume, muscle-sculpting workouts.',
    proTip:
      'Antagonist supersets (e.g. bench press followed immediately by cable row) create extraordinary blood flow and time efficiency.',
  },
];

export interface SplitInfoModalProps {
  visible: boolean;
  selectedSplit: string;
  onSelectSplit: (splitId: string) => void;
  onClose: () => void;
}

export const SplitInfoModal: React.FC<SplitInfoModalProps> = ({
  visible,
  selectedSplit,
  onSelectSplit,
  onClose,
}) => {
  const handleSelect = (splitId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onSelectSplit(splitId);
    onClose();
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeContainer}>
        {/* Sticky Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.headerKickerRow}>
              <Icon name="Info" size={14} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
              <Text style={styles.headerKicker}>TRAINING SPLITS GUIDE</Text>
            </View>
            <Text style={styles.headerTitle}>Select Your Training Style</Text>
          </View>
          <TouchableOpacity
            style={styles.closeIconBtn}
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Close training splits guide"
          >
            <Icon name="X" size={20} color={OBSIDIAN_COLORS.textWhite} weight="bold" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content Body */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Explanation Banner */}
          <View style={styles.introBanner}>
            <View style={styles.introBannerIconBox}>
              <Icon name="Sparkle" size={20} color={OBSIDIAN_COLORS.voltLime} weight="fill" />
            </View>
            <View style={styles.introBannerContent}>
              <Text style={styles.introBannerTitle}>What is a Workout Split?</Text>
              <Text style={styles.introBannerText}>
                A split determines how your muscle groups are organized across your training days.
                Picking the right split ensures you hit each muscle with enough volume while allowing
                48–72 hours of recovery for muscle synthesis.
              </Text>
            </View>
          </View>

          {/* Split Cards List */}
          <View style={styles.splitList}>
            {SPLIT_DETAILS.map((split) => {
              const isSelected = selectedSplit === split.id;
              return (
                <View
                  key={split.id}
                  style={[
                    styles.splitCard,
                    isSelected && styles.splitCardSelected,
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.badgeRow}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{split.badge}</Text>
                        </View>
                        <View style={styles.daysBadge}>
                          <Icon name="CalendarCheck" size={11} color={OBSIDIAN_COLORS.textMuted} />
                          <Text style={styles.daysBadgeText}>{split.daysPerWeek}</Text>
                        </View>
                      </View>
                      <Text style={styles.splitCardTitle}>{split.name}</Text>
                    </View>

                    {isSelected && (
                      <View style={styles.activePill}>
                        <Icon name="Check" size={12} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />
                        <Text style={styles.activePillText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>

                  {/* Summary */}
                  <Text style={styles.summaryText}>{split.summary}</Text>

                  {/* Muscle Breakdown */}
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeaderRow}>
                      <Icon name="Lightning" size={13} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                      <Text style={styles.sectionHeaderLabel}>TARGET MUSCLES</Text>
                    </View>
                    <View style={styles.musclesList}>
                      {split.targetMuscles.map((muscleLine, idx) => (
                        <View key={idx} style={styles.muscleRow}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.muscleLineText}>{muscleLine}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Weekly Schedule Preview */}
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeaderRow}>
                      <Icon name="Clock" size={13} color={OBSIDIAN_COLORS.cyanAccent} weight="bold" />
                      <Text style={styles.sectionHeaderLabel}>WEEKLY ROUTINE</Text>
                    </View>
                    <View style={styles.scheduleBox}>
                      <Text style={styles.scheduleText}>{split.schedulePreview}</Text>
                    </View>
                  </View>

                  {/* Best For */}
                  <View style={styles.bestForBox}>
                    <Text style={styles.bestForLabel}>BEST FOR:</Text>
                    <Text style={styles.bestForText}>{split.bestFor}</Text>
                  </View>

                  {/* Pro Tip */}
                  <View style={styles.proTipBox}>
                    <Icon name="CheckCircle" size={14} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                    <Text style={styles.proTipText}>{split.proTip}</Text>
                  </View>

                  {/* CTA Action Button */}
                  <TouchableOpacity
                    style={[
                      styles.selectSplitBtn,
                      isSelected && styles.selectSplitBtnActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleSelect(split.id)}
                  >
                    {isSelected ? (
                      <>
                        <Icon name="Check" size={16} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />
                        <Text style={styles.selectSplitBtnTextActive}>CURRENTLY SELECTED</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.selectSplitBtnText}>SELECT THIS SPLIT</Text>
                        <Icon name="CaretRight" size={15} color={OBSIDIAN_COLORS.textWhite} weight="bold" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surface,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: OBSIDIAN_SPACING.lg,
    paddingTop: Platform.OS === 'android' ? 36 : OBSIDIAN_SPACING.sm,
    paddingBottom: OBSIDIAN_SPACING.md,
    backgroundColor: OBSIDIAN_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: OBSIDIAN_SPACING.md,
  },
  headerKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerKicker: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.voltLime,
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    color: OBSIDIAN_COLORS.textWhite,
  },
  closeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: OBSIDIAN_SPACING.lg,
    paddingBottom: OBSIDIAN_SPACING['2xl'],
  },
  introBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(204, 255, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    borderRadius: OBSIDIAN_RADIUS.md,
    padding: OBSIDIAN_SPACING.md,
    marginBottom: OBSIDIAN_SPACING.lg,
    gap: 12,
  },
  introBannerIconBox: {
    width: 34,
    height: 34,
    borderRadius: OBSIDIAN_RADIUS.sm,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  introBannerContent: {
    flex: 1,
  },
  introBannerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: OBSIDIAN_COLORS.voltLime,
    marginBottom: 4,
  },
  introBannerText: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 12.5,
    lineHeight: 18,
    color: OBSIDIAN_COLORS.textMuted,
  },
  splitList: {
    gap: OBSIDIAN_SPACING.lg,
  },
  splitCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: OBSIDIAN_SPACING.lg,
    gap: 12,
  },
  splitCardSelected: {
    borderColor: 'rgba(204, 255, 0, 0.45)',
    backgroundColor: 'rgba(204, 255, 0, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderRadius: OBSIDIAN_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    color: OBSIDIAN_COLORS.voltLime,
    letterSpacing: 0.5,
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: OBSIDIAN_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  daysBadgeText: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 10.5,
    color: OBSIDIAN_COLORS.textMuted,
  },
  splitCardTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    color: OBSIDIAN_COLORS.textWhite,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    borderRadius: OBSIDIAN_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activePillText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    color: OBSIDIAN_COLORS.onPrimary,
    letterSpacing: 0.5,
  },
  summaryText: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: OBSIDIAN_COLORS.textMuted,
  },
  sectionBlock: {
    gap: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderLabel: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10.5,
    color: OBSIDIAN_COLORS.textMuted,
    letterSpacing: 0.8,
  },
  musclesList: {
    gap: 4,
    paddingLeft: 4,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  muscleLineText: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 12,
    color: OBSIDIAN_COLORS.textWhite,
  },
  scheduleBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: OBSIDIAN_RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  scheduleText: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 11.5,
    color: OBSIDIAN_COLORS.textMuted,
    lineHeight: 17,
  },
  bestForBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: OBSIDIAN_RADIUS.sm,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: OBSIDIAN_COLORS.cyanAccent,
    gap: 2,
  },
  bestForLabel: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 9.5,
    color: OBSIDIAN_COLORS.cyanAccent,
    letterSpacing: 0.5,
  },
  bestForText: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: OBSIDIAN_COLORS.textMuted,
  },
  proTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.04)',
    borderRadius: OBSIDIAN_RADIUS.sm,
    padding: 10,
  },
  proTipText: {
    flex: 1,
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  selectSplitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: OBSIDIAN_RADIUS.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: 4,
  },
  selectSplitBtnActive: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    borderColor: OBSIDIAN_COLORS.voltLime,
  },
  selectSplitBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12.5,
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: 0.5,
  },
  selectSplitBtnTextActive: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12.5,
    color: OBSIDIAN_COLORS.onPrimary,
    letterSpacing: 0.5,
  },
});
