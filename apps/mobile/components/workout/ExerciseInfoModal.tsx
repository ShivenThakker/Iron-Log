import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_SHADOWS,
} from '@/constants/tokens';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { MuscleHeatmap } from '@/components/charts/MuscleHeatmap';
import { getDetailedExerciseInfo } from '@/services/exerciseInfoService';

export interface ExerciseInfoModalProps {
  visible: boolean;
  exerciseName: string;
  targetMuscles?: string;
  instructions?: string;
  onClose: () => void;
}

export const ExerciseInfoModal: React.FC<ExerciseInfoModalProps> = ({
  visible,
  exerciseName,
  targetMuscles,
  instructions,
  onClose,
}) => {
  const info = useMemo(() => {
    return getDetailedExerciseInfo(exerciseName, targetMuscles, instructions);
  }, [exerciseName, targetMuscles, instructions]);

  const handleOpenVideo = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (info.youtubeUrl) {
      Linking.openURL(info.youtubeUrl).catch((err) => {
        console.warn('Could not open YouTube URL:', err);
      });
    }
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
            <Text style={styles.headerTitle} numberOfLines={1}>
              {info.name.toUpperCase()}
            </Text>
            <Text style={styles.headerSubtitle}>
              {info.difficulty} • {info.category}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeIconBtn}
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={12}
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
          {/* YouTube Tutorial Video Card */}
          <TouchableOpacity
            style={styles.videoCard}
            onPress={handleOpenVideo}
            activeOpacity={0.88}
          >
            {info.youtubeThumbnail ? (
              <Image
                source={{ uri: info.youtubeThumbnail }}
                style={styles.videoThumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Icon name="Play" size={32} color={OBSIDIAN_COLORS.voltLime} weight="fill" />
              </View>
            )}

            {/* Dark gradient overlay for text readability */}
            <View style={styles.videoOverlay}>
              {/* Top video title bar */}
              <View style={styles.videoTopRow}>
                <View style={styles.ytLogoBadge}>
                  <Text style={styles.ytLogoText}>▶ YouTube</Text>
                </View>
                <Text style={styles.videoTitleText} numberOfLines={1}>
                  How to Do: {info.name}
                </Text>
              </View>

              {/* Center Play Button */}
              <View style={styles.playButtonWrapper}>
                <View style={styles.playButtonCircle}>
                  <Icon name="Play" size={26} color="#000000" weight="fill" />
                </View>
                <Text style={styles.playButtonLabel}>Watch Video Tutorial</Text>
              </View>

              {/* Bottom video info bar */}
              <View style={styles.videoBottomRow}>
                <View style={styles.videoPillBadge}>
                  <Text style={styles.videoPillText}>HD Guide</Text>
                </View>
                <Text style={styles.videoPromptText}>Tap to play video ↗</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Instructions / How to Do Section */}
          <View style={styles.sectionBox}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="CheckCircle" size={16} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
              <Text style={styles.sectionHeaderTitle}>INSTRUCTIONS</Text>
            </View>

            {info.steps && info.steps.length > 0 ? (
              <View style={styles.stepsList}>
                {info.steps.map((step) => (
                  <View key={`step-${step.step}`} style={styles.stepCard}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>{step.step}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      {step.name ? (
                        <Text style={styles.stepName}>{step.name}</Text>
                      ) : null}
                      <Text style={styles.stepText}>{step.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.rawInstructionsText}>{info.instructions}</Text>
            )}
          </View>

          {/* Focus Area / Target Muscles */}
          <View style={styles.sectionBox}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="Lightning" size={16} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
              <Text style={styles.sectionHeaderTitle}>FOCUS AREA</Text>
            </View>

            {/* Muscle Chips */}
            <View style={styles.chipsWrap}>
              {info.primaryMuscles.map((muscle, idx) => (
                <View key={`primary-${idx}`} style={styles.primaryMuscleChip}>
                  <View style={styles.primaryDot} />
                  <Text style={styles.primaryMuscleText}>{muscle}</Text>
                </View>
              ))}

              {info.secondaryMuscles.map((muscle, idx) => (
                <View key={`secondary-${idx}`} style={styles.secondaryMuscleChip}>
                  <View style={styles.secondaryDot} />
                  <Text style={styles.secondaryMuscleText}>{muscle}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Muscle Anatomy Heatmap View */}
          <View style={styles.sectionBox}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="Sparkle" size={16} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
              <Text style={styles.sectionHeaderTitle}>ANATOMICAL MUSCLE ACTIVATION</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Brighter highlight indicates peak mechanical tension and activation.
            </Text>

            {/* Traced Anatomical Muscle Heatmap */}
            <View style={styles.heatmapCard}>
              <MuscleHeatmap data={info.heatmapData} />
            </View>
          </View>

          {/* Common Mistakes */}
          <View style={styles.sectionBox}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="X" size={16} color={OBSIDIAN_COLORS.coralAccent} weight="bold" />
              <Text style={[styles.sectionHeaderTitle, { color: OBSIDIAN_COLORS.coralAccent }]}>
                COMMON MISTAKES
              </Text>
            </View>

            <View style={styles.mistakesList}>
              {info.commonMistakes.map((mistake, idx) => (
                <View key={`mistake-${idx}`} style={styles.mistakeCard}>
                  <View style={styles.mistakeNumberBadge}>
                    <Text style={styles.mistakeNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.mistakeText}>{mistake}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Breathing Tips */}
          <View style={styles.sectionBox}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="Flame" size={16} color={OBSIDIAN_COLORS.cyanAccent} weight="bold" />
              <Text style={[styles.sectionHeaderTitle, { color: OBSIDIAN_COLORS.cyanAccent }]}>
                BREATHING & FORM TIPS
              </Text>
            </View>

            <View style={styles.tipsList}>
              {info.breathingTips.map((tip, idx) => (
                <View key={`tip-${idx}`} style={styles.tipRow}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeBtnText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: OBSIDIAN_SPACING.lg,
    paddingVertical: OBSIDIAN_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: OBSIDIAN_COLORS.borderGhost,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: OBSIDIAN_SPACING.md,
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: OBSIDIAN_SPACING.lg,
    gap: OBSIDIAN_SPACING.lg,
    paddingBottom: 40,
  },
  videoCard: {
    width: '100%',
    height: 200,
    borderRadius: OBSIDIAN_RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    ...OBSIDIAN_SHADOWS.cardLevel2,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0d14',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 11, 16, 0.65)',
    justifyContent: 'space-between',
    padding: OBSIDIAN_SPACING.md,
  },
  videoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ytLogoBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ytLogoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  videoTitleText: {
    flex: 1,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  playButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    justifyContent: 'center',
    alignItems: 'center',
    ...OBSIDIAN_SHADOWS.voltGlowSmall,
  },
  playButtonLabel: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  videoBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoPillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  videoPromptText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
  },
  sectionBox: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.lg,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  sectionHeaderTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 12,
    color: OBSIDIAN_COLORS.textMuted,
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  stepsList: {
    gap: OBSIDIAN_SPACING.sm,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.md,
    gap: 12,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.voltLime,
  },
  stepBadgeText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.voltLime,
  },
  stepContent: {
    flex: 1,
  },
  stepName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: OBSIDIAN_COLORS.textWhite,
    marginBottom: 2,
  },
  stepText: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 13,
    color: OBSIDIAN_COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  rawInstructionsText: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 13,
    color: OBSIDIAN_COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  primaryMuscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: OBSIDIAN_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.35)',
  },
  primaryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  primaryMuscleText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
  },
  secondaryMuscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: OBSIDIAN_RADIUS.full,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  secondaryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: OBSIDIAN_COLORS.cyanAccent,
  },
  secondaryMuscleText: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 12,
    color: OBSIDIAN_COLORS.textMuted,
  },
  heatmapCard: {
    backgroundColor: '#0a0d14',
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  mistakesList: {
    gap: 10,
  },
  mistakeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.md,
    padding: OBSIDIAN_SPACING.sm + 2,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: OBSIDIAN_COLORS.coralAccent,
  },
  mistakeNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 92, 92, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mistakeNumberText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.coralAccent,
  },
  mistakeText: {
    flex: 1,
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 13,
    color: OBSIDIAN_COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  tipsList: {
    gap: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: OBSIDIAN_COLORS.cyanAccent,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 13,
    color: OBSIDIAN_COLORS.textMuted,
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: OBSIDIAN_SPACING.lg,
    paddingVertical: OBSIDIAN_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.borderGhost,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
  },
  closeBtn: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    paddingVertical: OBSIDIAN_SPACING.md,
    borderRadius: OBSIDIAN_RADIUS.lg,
    alignItems: 'center',
    ...OBSIDIAN_SHADOWS.voltGlowSmall,
  },
  closeBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 15,
    color: OBSIDIAN_COLORS.onPrimary,
    letterSpacing: 1,
  },
});

export default ExerciseInfoModal;
