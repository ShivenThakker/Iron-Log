import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { COLORS, RADIUS, SPACING, OBSIDIAN_COLORS, OBSIDIAN_RADIUS } from '@/constants/tokens';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';

export interface MuscleBalanceScores {
  shoulders?: number;
  chest?: number;
  biceps?: number;
  triceps?: number;
  forearms?: number;
  legs?: number;
  core?: number;
  back?: number;
  arms?: number;
}

interface MuscleRadarProps {
  scores: MuscleBalanceScores;
  size?: number;
  theme?: 'default' | 'obsidian';
}

const AXES = [
  { key: 'shoulders', label: 'Shoulders', angle: -90 },
  { key: 'chest', label: 'Chest', angle: -45 },
  { key: 'biceps', label: 'Biceps', angle: 0 },
  { key: 'triceps', label: 'Triceps', angle: 45 },
  { key: 'forearms', label: 'Forearms', angle: 90 },
  { key: 'legs', label: 'Legs', angle: 135 },
  { key: 'core', label: 'Core', angle: 180 },
  { key: 'back', label: 'Back', angle: 225 },
] as const;

export const MuscleRadar: React.FC<MuscleRadarProps> = ({ scores, size = 280, theme = 'default' }) => {
  const isObsidian = theme === 'obsidian';
  const center = size / 2;
  const maxRadius = size * 0.36;

  // Check how many muscles have non-zero volume
  const nonZeroCount = AXES.filter((axis) => (scores[axis.key] ?? 0) > 0).length;

  if (nonZeroCount < 3) {
    return (
      <View style={[styles.emptyCard, isObsidian && styles.emptyCardObsidian, { width: size, height: size * 0.85 }]}>
        <Icon name="Barbell" size={32} color={isObsidian ? OBSIDIAN_COLORS.textSlate : COLORS.dark.textSecondary} />
        <Text variant="bodySmall" color={isObsidian ? OBSIDIAN_COLORS.textMuted : COLORS.dark.textSecondary} style={styles.emptyText}>
          Train at least 3 muscle groups to unlock your 8-axis Muscle Balance radar.
        </Text>
      </View>
    );
  }

  // Calculate polygon points for grid rings (25%, 50%, 75%, 100%)
  const getRingPoints = (percentage: number) => {
    return AXES.map((axis) => {
      const rad = (axis.angle * Math.PI) / 180;
      const r = maxRadius * percentage;
      const x = center + r * Math.cos(rad);
      const y = center + r * Math.sin(rad);
      return `${x},${y}`;
    }).join(' ');
  };

  // Calculate coordinate for a given axis and score (0 to 100)
  const getAxisPoint = (axis: typeof AXES[number], rawVal: number) => {
    const normalized = rawVal > 0 ? Math.min(Math.max(rawVal, 6), 100) / 100 : 0;
    const rad = (axis.angle * Math.PI) / 180;
    const r = maxRadius * normalized;
    const x = center + r * Math.cos(rad);
    const y = center + r * Math.sin(rad);
    return { x, y, r, normalized };
  };

  // Calculate polygon points for actual scores
  const scorePoints = AXES.map((axis) => {
    const rawVal = scores[axis.key] ?? 0;
    const { x, y } = getAxisPoint(axis, rawVal);
    return `${x},${y}`;
  }).join(' ');

  const gridStroke = isObsidian ? OBSIDIAN_COLORS.borderGhost : 'rgba(255, 255, 255, 0.08)';
  const spokeStroke = isObsidian ? OBSIDIAN_COLORS.borderElevated : 'rgba(255, 255, 255, 0.12)';
  const dataFill = isObsidian ? 'rgba(0, 229, 255, 0.22)' : 'rgba(233, 69, 96, 0.35)';
  const dataStroke = isObsidian ? OBSIDIAN_COLORS.cyanAccent : COLORS.dark.accentRed;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Concentric Hexagonal Grid Lines */}
        {[0.25, 0.5, 0.75, 1.0].map((level) => (
          <Polygon
            key={level}
            points={getRingPoints(level)}
            fill={level === 1.0 ? (isObsidian ? 'rgba(0, 229, 255, 0.03)' : 'rgba(255, 255, 255, 0.02)') : 'none'}
            stroke={gridStroke}
            strokeWidth="1"
          />
        ))}

        {/* Axis Spokes from Center to Outer Rim */}
        {AXES.map((axis) => {
          const rad = (axis.angle * Math.PI) / 180;
          const x = center + maxRadius * Math.cos(rad);
          const y = center + maxRadius * Math.sin(rad);
          return (
            <Line
              key={axis.key}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={spokeStroke}
              strokeWidth="1"
            />
          );
        })}

        {/* Data Area Polygon */}
        <Polygon
          points={scorePoints}
          fill={dataFill}
          stroke={dataStroke}
          strokeWidth="2.5"
        />

        {/* Data Node Dots */}
        {AXES.map((axis) => {
          const rawVal = scores[axis.key] ?? 0;
          if (rawVal <= 0) return null;
          const { x, y } = getAxisPoint(axis, rawVal);
          return (
            <Circle
              key={`dot-${axis.key}`}
              cx={x}
              cy={y}
              r="4.5"
              fill={isObsidian ? OBSIDIAN_COLORS.canvas : COLORS.dark.accentRed}
              stroke={dataStroke}
              strokeWidth="2"
            />
          );
        })}

        {/* Axis Labels */}
        {AXES.map((axis) => {
          const rad = (axis.angle * Math.PI) / 180;
          const labelDist = maxRadius + 22;
          const x = center + labelDist * Math.cos(rad);
          const y = center + labelDist * Math.sin(rad);
          const val = scores[axis.key] ?? 0;
          return (
            <SvgText
              key={`label-${axis.key}`}
              x={x}
              y={y + 4}
              fontSize="11"
              fontWeight="600"
              fill={
                val > 0
                  ? (isObsidian ? OBSIDIAN_COLORS.textWhite : COLORS.dark.textPrimary)
                  : (isObsidian ? OBSIDIAN_COLORS.textSlate : COLORS.dark.textSecondary)
              }
              textAnchor="middle"
            >
              {axis.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: 'rgba(22, 33, 62, 0.5)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyCardObsidian: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    borderRadius: OBSIDIAN_RADIUS.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.dark.textSecondary,
    marginTop: SPACING.md,
    lineHeight: 20,
  },
});
