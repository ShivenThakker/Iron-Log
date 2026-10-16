import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, Circle, G, Text as SvgText } from 'react-native-svg';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
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
}

function getIntensityColor(intensity: number = 0): string {
  if (intensity <= 0) return '#222646'; // Inactive slate
  if (intensity <= 0.35) return '#22C55E'; // Moderate green
  if (intensity <= 0.7) return '#F59E0B'; // Warming gold
  return '#E94560'; // Peak red
}

export const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({ data }) => {
  const [view, setView] = useState<'front' | 'back'>('front');

  const chestColor = getIntensityColor(data.chest);
  const backColor = getIntensityColor(data.back);
  const shouldersColor = getIntensityColor(data.shoulders);
  const bicepsColor = getIntensityColor(data.biceps);
  const tricepsColor = getIntensityColor(data.triceps);
  const coreColor = getIntensityColor(data.core);
  const quadsColor = getIntensityColor(data.quads);
  const hamstringsColor = getIntensityColor(data.hamstrings);
  const glutesColor = getIntensityColor(data.glutes);
  const calvesColor = getIntensityColor(data.calves);
  const trapsColor = getIntensityColor(data.traps || data.back ? (data.traps ?? data.back! * 0.8) : 0);

  return (
    <View style={styles.container}>
      {/* View Switcher Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, view === 'front' && styles.activeTab]}
          onPress={() => setView('front')}
        >
          <Text variant="caption" style={[styles.tabText, view === 'front' && styles.activeTabText]}>
            FRONT BODY
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'back' && styles.activeTab]}
          onPress={() => setView('back')}
        >
          <Text variant="caption" style={[styles.tabText, view === 'back' && styles.activeTabText]}>
            BACK BODY
          </Text>
        </TouchableOpacity>
      </View>

      {/* SVG Muscle Diagram Canvas */}
      <View style={styles.canvasContainer}>
        {view === 'front' ? (
          <Svg width="220" height="280" viewBox="0 0 220 280">
            {/* Head */}
            <Circle cx="110" cy="24" r="14" fill="#2D325A" />
            {/* Neck */}
            <Rect x="104" y="38" width="12" height="12" rx="3" fill="#2D325A" />

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
            <Rect x="46" y="114" width="12" height="32" rx="5" fill="#2D325A" />
            <Rect x="162" y="114" width="12" height="32" rx="5" fill="#2D325A" />

            {/* Core / Abs */}
            <Path d="M84 86 H136 V134 Q110 144 84 134 Z" fill={coreColor} />

            {/* Pelvis */}
            <Path d="M86 138 H134 L124 160 H96 Z" fill="#2D325A" />

            {/* Quads (Upper Legs) */}
            <Rect x="80" y="164" width="26" height="54" rx="8" fill={quadsColor} />
            <Rect x="114" y="164" width="26" height="54" rx="8" fill={quadsColor} />

            {/* Knees */}
            <Circle cx="93" cy="223" r="5" fill="#2D325A" />
            <Circle cx="127" cy="223" r="5" fill="#2D325A" />

            {/* Calves (Lower Legs) */}
            <Rect x="82" y="232" width="22" height="42" rx="6" fill={calvesColor} />
            <Rect x="116" y="232" width="22" height="42" rx="6" fill={calvesColor} />
          </Svg>
        ) : (
          <Svg width="220" height="280" viewBox="0 0 220 280">
            {/* Head (Back) */}
            <Circle cx="110" cy="24" r="14" fill="#2D325A" />
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
            <Rect x="46" y="114" width="12" height="32" rx="5" fill="#2D325A" />
            <Rect x="162" y="114" width="12" height="32" rx="5" fill="#2D325A" />

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
        <Text variant="caption" style={styles.legendLabel}>Inactive</Text>
        <View style={styles.legendGradient}>
          <View style={[styles.legendStop, { backgroundColor: '#222646' }]} />
          <View style={[styles.legendStop, { backgroundColor: '#22C55E' }]} />
          <View style={[styles.legendStop, { backgroundColor: '#F59E0B' }]} />
          <View style={[styles.legendStop, { backgroundColor: '#E94560' }]} />
        </View>
        <Text variant="caption" style={[styles.legendLabel, { color: COLORS.dark.accentRed }]}>
          Peak Volume
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark.bgInput,
    borderRadius: RADIUS.full,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tab: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
  },
  activeTab: {
    backgroundColor: COLORS.dark.accentRed,
  },
  tabText: {
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
    fontSize: 11,
  },
  activeTabText: {
    color: COLORS.dark.textPrimary,
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
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 240,
    marginTop: SPACING.md,
  },
  legendLabel: {
    color: COLORS.dark.textSecondary,
    fontSize: 10,
  },
  legendGradient: {
    flex: 1,
    height: 6,
    flexDirection: 'row',
    marginHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  legendStop: {
    flex: 1,
    height: '100%',
  },
});
