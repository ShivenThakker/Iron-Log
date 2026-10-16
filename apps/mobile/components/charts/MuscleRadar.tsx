import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';

export interface MuscleBalanceScores {
  shoulders?: number;
  chest?: number;
  back?: number;
  core?: number;
  arms?: number;
  legs?: number;
}

interface MuscleRadarProps {
  scores: MuscleBalanceScores;
  size?: number;
}

const AXES = [
  { key: 'shoulders', label: 'Shoulders', angle: -90 },
  { key: 'chest', label: 'Chest', angle: -30 },
  { key: 'arms', label: 'Arms', angle: 30 },
  { key: 'legs', label: 'Legs', angle: 90 },
  { key: 'core', label: 'Core', angle: 150 },
  { key: 'back', label: 'Back', angle: 210 },
] as const;

export const MuscleRadar: React.FC<MuscleRadarProps> = ({ scores, size = 280 }) => {
  const center = size / 2;
  const maxRadius = size * 0.36;

  // Check how many muscles have non-zero volume
  const nonZeroCount = AXES.filter((axis) => (scores[axis.key] ?? 0) > 0).length;

  if (nonZeroCount < 3) {
    return (
      <View style={[styles.emptyCard, { width: size, height: size * 0.85 }]}>
        <Icon name="Barbell" size={32} color={COLORS.dark.textSecondary} />
        <Text variant="bodySmall" style={styles.emptyText}>
          Train at least 3 muscle groups to unlock your 6-axis Muscle Balance radar.
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

  // Calculate polygon points for actual scores (clamped 0 to 100)
  const scorePoints = AXES.map((axis) => {
    const rawVal = scores[axis.key] ?? 0;
    const clamped = Math.min(Math.max(rawVal, 10), 100) / 100; // minimum radius so points are visible
    const rad = (axis.angle * Math.PI) / 180;
    const r = maxRadius * clamped;
    const x = center + r * Math.cos(rad);
    const y = center + r * Math.sin(rad);
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Concentric Hexagonal Grid Lines */}
        {[0.25, 0.5, 0.75, 1.0].map((level) => (
          <Polygon
            key={level}
            points={getRingPoints(level)}
            fill={level === 1.0 ? 'rgba(255, 255, 255, 0.02)' : 'none'}
            stroke="rgba(255, 255, 255, 0.08)"
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
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Area Polygon */}
        <Polygon
          points={scorePoints}
          fill="rgba(233, 69, 96, 0.35)"
          stroke={COLORS.dark.accentRed}
          strokeWidth="2.5"
        />

        {/* Data Node Dots */}
        {AXES.map((axis) => {
          const rawVal = scores[axis.key] ?? 0;
          const clamped = Math.min(Math.max(rawVal, 10), 100) / 100;
          const rad = (axis.angle * Math.PI) / 180;
          const x = center + maxRadius * clamped;
          const y = center + maxRadius * Math.sin(rad);
          return (
            <Circle
              key={`dot-${axis.key}`}
              cx={x}
              cy={y}
              r="4"
              fill={COLORS.dark.accentRed}
              stroke="#FFFFFF"
              strokeWidth="1.5"
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
              fill={val > 0 ? COLORS.dark.textPrimary : COLORS.dark.textSecondary}
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
  emptyText: {
    textAlign: 'center',
    color: COLORS.dark.textSecondary,
    marginTop: SPACING.md,
    lineHeight: 20,
  },
});
