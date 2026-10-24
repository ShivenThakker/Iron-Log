import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, Circle, G, Text as SvgText } from 'react-native-svg';
import { COLORS, RADIUS, SPACING, OBSIDIAN_COLORS, OBSIDIAN_RADIUS } from '@/constants/tokens';
import { Text } from '@/components/ui/Text';

export interface MuscleHeatmapData {
  chest?: number;
  back?: number;
  shoulders?: number;
  biceps?: number;
  triceps?: number;
  core?: number;
  quads?: number;
  hamstrings?: number;
  glutes?: number;
  calves?: number;
  forearms?: number;
  traps?: number;
  [key: string]: number | undefined;
}

interface MuscleHeatmapProps {
  data: MuscleHeatmapData;
  theme?: 'default' | 'obsidian';
}

function getIntensityColor(intensity: number = 0, isObsidian = false): string {
  if (isObsidian) {
    if (intensity <= 0) return OBSIDIAN_COLORS.surfaceContainerHighest;
    if (intensity <= 0.35) return OBSIDIAN_COLORS.primaryFixedDim;
    return OBSIDIAN_COLORS.voltLime;
  }
  if (intensity <= 0) return '#222646';
  if (intensity <= 0.35) return '#22C55E';
  if (intensity <= 0.7) return '#F59E0B';
  return '#E94560';
}

export const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({ data, theme = 'default' }) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const isObsidian = theme === 'obsidian';
  const neutralPart = isObsidian ? OBSIDIAN_COLORS.surfaceContainerHigh : '#2D325A';

  const chestColor = getIntensityColor(data.chest, isObsidian);
  const backColor = getIntensityColor(data.back, isObsidian);
  const shouldersColor = getIntensityColor(data.shoulders, isObsidian);
  const bicepsColor = getIntensityColor(data.biceps, isObsidian);
  const tricepsColor = getIntensityColor(data.triceps, isObsidian);
  const coreColor = getIntensityColor(data.core, isObsidian);
  const quadsColor = getIntensityColor(data.quads, isObsidian);
  const hamstringsColor = getIntensityColor(data.hamstrings, isObsidian);
  const glutesColor = getIntensityColor(data.glutes, isObsidian);
  const calvesColor = getIntensityColor(data.calves, isObsidian);
  const trapsColor = getIntensityColor(data.traps || data.back ? (data.traps ?? data.back! * 0.8) : 0, isObsidian);

  return (
    <View style={styles.container}>
      {/* View Switcher Tabs */}
      <View style={[styles.tabRow, isObsidian && styles.tabRowObsidian]}>
        <TouchableOpacity
          style={[styles.tab, view === 'front' && (isObsidian ? styles.activeTabObsidian : styles.activeTab)]}
          onPress={() => setView('front')}
        >
          <Text
            variant="caption"
            style={[
              styles.tabText,
              view === 'front' && (isObsidian ? styles.activeTabTextObsidian : styles.activeTabText),
            ]}
          >
            FRONT BODY
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'back' && (isObsidian ? styles.activeTabObsidian : styles.activeTab)]}
          onPress={() => setView('back')}
        >
          <Text
            variant="caption"
            style={[
              styles.tabText,
              view === 'back' && (isObsidian ? styles.activeTabTextObsidian : styles.activeTabText),
            ]}
          >
            BACK BODY
          </Text>
        </TouchableOpacity>
      </View>

      {/* SVG Muscle Diagram Canvas */}
      <View style={[styles.canvasContainer, isObsidian && styles.canvasContainerObsidian]}>
        {view === 'front' ? (
          <Svg width="220" height="280" viewBox="0 0 220 280">
            {/* Head */}
            <Circle cx="110" cy="24" r="14" fill={neutralPart} />
            {/* Neck */}
            <Rect x="104" y="38" width="12" height="12" rx="3" fill={neutralPart} />

            {/* Shoulders */}
            <Path d="M72 50 C60 52 52 64 54 78 C60 76 68 70 76 66 Z" fill={shouldersColor} />
            <Path d="M148 50 C160 52 168 64 166 78 C160 76 152 70 144 66 Z" fill={shouldersColor} />

            {/* Chest */}
            <Path d="M78 54 Q110 58 110 82 Q90 84 76 76 Z" fill={chestColor} />
            <Path d="M142 54 Q110 58 110 82 Q130 84 144 76 Z" fill={chestColor} />

            {/* Biceps */}
            <Rect x="50" y="82" width="14" height="28" rx="6" fill={bicepsColor} />
            <Rect x="156" y="82" width="14" height="28" rx="6" fill={bicepsColor} />

            {/* Forearms */}
            <Rect x="46" y="114" width="12" height="32" rx="5" fill={neutralPart} />
            <Rect x="162" y="114" width="12" height="32" rx="5" fill={neutralPart} />

            {/* Core / Abs */}
            <Path d="M84 86 H136 V134 Q110 144 84 134 Z" fill={coreColor} />

            {/* Pelvis */}
            <Path d="M86 138 H134 L124 160 H96 Z" fill={neutralPart} />

            {/* Quads (Upper Legs) */}
            <Rect x="80" y="164" width="26" height="54" rx="8" fill={quadsColor} />
            <Rect x="114" y="164" width="26" height="54" rx="8" fill={quadsColor} />

            {/* Knees */}
            <Circle cx="93" cy="223" r="5" fill={neutralPart} />
            <Circle cx="127" cy="223" r="5" fill={neutralPart} />

            {/* Calves (Lower Legs) */}
            <Rect x="82" y="232" width="22" height="42" rx="6" fill={calvesColor} />
            <Rect x="116" y="232" width="22" height="42" rx="6" fill={calvesColor} />
          </Svg>
        ) : (
          <Svg width="220" height="280" viewBox="0 0 220 280">
            {/* Head (Back) */}
            <Circle cx="110" cy="24" r="14" fill={neutralPart} />
            {/* Traps */}
            <Path d="M96 38 L110 32 L124 38 L138 52 L82 52 Z" fill={trapsColor} />

            {/* Rear Delts */}
            <Path d="M72 50 C60 52 52 64 54 78 C60 76 68 70 76 66 Z" fill={shouldersColor} />
            <Path d="M148 50 C160 52 168 64 166 78 C160 76 152 70 144 66 Z" fill={shouldersColor} />

            {/* Upper Back / Lats */}
            <Path d="M78 56 Q110 52 142 56 L134 116 Q110 126 86 116 Z" fill={backColor} />

            {/* Triceps */}
            <Rect x="50" y="82" width="14" height="28" rx="6" fill={tricepsColor} />
            <Rect x="156" y="82" width="14" height="28" rx="6" fill={tricepsColor} />

            {/* Forearms */}
            <Rect x="46" y="114" width="12" height="32" rx="5" fill={neutralPart} />
            <Rect x="162" y="114" width="12" height="32" rx="5" fill={neutralPart} />

            {/* Glutes */}
            <Path d="M84 128 Q110 134 136 128 L134 160 Q110 166 86 160 Z" fill={glutesColor} />

            {/* Hamstrings */}
            <Rect x="80" y="164" width="26" height="54" rx="8" fill={hamstringsColor} />
            <Rect x="114" y="164" width="26" height="54" rx="8" fill={hamstringsColor} />

            {/* Calves (Back) */}
            <Rect x="82" y="232" width="22" height="42" rx="6" fill={calvesColor} />
            <Rect x="116" y="232" width="22" height="42" rx="6" fill={calvesColor} />
          </Svg>
        )}
      </View>

      {/* Heatmap Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendStopGroup}>
          <View style={[styles.legendDot, { backgroundColor: isObsidian ? OBSIDIAN_COLORS.surfaceContainerHighest : '#222646' }]} />
          <Text variant="caption" style={styles.legendLabel}>INACTIVE</Text>
        </View>
        <View style={styles.legendStopGroup}>
          <View style={[styles.legendDot, { backgroundColor: isObsidian ? OBSIDIAN_COLORS.primaryFixedDim : '#22C55E' }]} />
          <Text variant="caption" style={styles.legendLabel}>MODERATE</Text>
        </View>
        <View style={styles.legendStopGroup}>
          <View style={[styles.legendDot, { backgroundColor: isObsidian ? OBSIDIAN_COLORS.voltLime : '#E94560' }]} />
          <Text
            variant="caption"
            style={[styles.legendLabel, { color: isObsidian ? OBSIDIAN_COLORS.voltLime : COLORS.dark.accentRed }]}
          >
            PEAK VOLUME
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark.bgInput,
    borderRadius: RADIUS.full,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tabRowObsidian: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  tab: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
  },
  activeTab: {
    backgroundColor: COLORS.dark.accentRed,
  },
  activeTabObsidian: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  tabText: {
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
    fontSize: 11,
  },
  activeTabText: {
    color: COLORS.dark.textPrimary,
  },
  activeTabTextObsidian: {
    color: OBSIDIAN_COLORS.onPrimary,
  },
  canvasContainer: {
    backgroundColor: 'rgba(22, 33, 62, 0.6)',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  canvasContainerObsidian: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
    marginTop: SPACING.md,
  },
  legendStopGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: COLORS.dark.textSecondary,
    fontSize: 10,
  },
});
