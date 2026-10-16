import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
import { Text } from '@/components/ui/Text';

export interface WeightPoint {
  date: string;
  weight: number;
  movingAvg?: number;
}

interface WeightChartProps {
  data: WeightPoint[];
  goalWeight?: number;
  width?: number;
  height?: number;
}

export const WeightChart: React.FC<WeightChartProps> = ({
  data,
  goalWeight,
  width = Dimensions.get('window').width - SPACING.lg * 2 - SPACING.md * 2,
  height = 180,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text variant="caption" style={styles.emptyText}>
          No weight logs yet. Log your first weight entry below!
        </Text>
      </View>
    );
  }

  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Determine min & max weights including goal weight
  const weights = data.map((d) => d.weight);
  if (goalWeight) weights.push(goalWeight);
  const minW = Math.floor(Math.min(...weights) - 1);
  const maxW = Math.ceil(Math.max(...weights) + 1);
  const rangeW = Math.max(maxW - minW, 1);

  const getX = (index: number) => {
    if (data.length === 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minW) / rangeW) * chartHeight;
  };

  // Build SVG Path for actual weight
  const pathD = data
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(point.weight)}`)
    .join(' ');

  // Build closed area for gradient fill
  const areaD = `${pathD} L ${getX(data.length - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${
    paddingTop + chartHeight
  } Z`;

  // Build Moving Average path if available
  const hasMovingAvg = data.some((d) => d.movingAvg !== undefined && d.movingAvg > 0);
  const movingAvgPathD = hasMovingAvg
    ? data
        .filter((d) => d.movingAvg !== undefined && d.movingAvg > 0)
        .map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(point.movingAvg!)}`)
        .join(' ')
    : '';

  const goalY = goalWeight ? getY(goalWeight) : null;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={COLORS.dark.accentRed} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={COLORS.dark.accentRed} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Horizontal Grid Lines & Y-axis labels */}
        {[0, 0.5, 1].map((ratio) => {
          const val = (minW + ratio * rangeW).toFixed(1);
          const y = paddingTop + chartHeight - ratio * chartHeight;
          return (
            <React.Fragment key={ratio}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="rgba(255, 255, 255, 0.06)"
                strokeDasharray="4 4"
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fontSize="10"
                fill={COLORS.dark.textSecondary}
                textAnchor="end"
              >
                {val}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Goal Weight Horizontal Line */}
        {goalY !== null && (
          <>
            <Line
              x1={paddingLeft}
              y1={goalY}
              x2={width - paddingRight}
              y2={goalY}
              stroke={COLORS.dark.accentGold}
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            <SvgText
              x={width - paddingRight}
              y={goalY - 6}
              fontSize="9"
              fill={COLORS.dark.accentGold}
              textAnchor="end"
              fontWeight="bold"
            >
              Goal: {goalWeight}kg
            </SvgText>
          </>
        )}

        {/* Gradient Area Fill */}
        <Path d={areaD} fill="url(#weightGrad)" />

        {/* Moving Average Line (dashed cyan) */}
        {hasMovingAvg && movingAvgPathD && (
          <Path
            d={movingAvgPathD}
            fill="none"
            stroke={COLORS.dark.accentCyan}
            strokeWidth="2"
            strokeDasharray="5 3"
          />
        )}

        {/* Primary Weight Trend Line */}
        <Path
          d={pathD}
          fill="none"
          stroke={COLORS.dark.accentRed}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Points on Line */}
        {data.map((point, i) => (
          <Circle
            key={`pt-${i}`}
            cx={getX(i)}
            cy={getY(point.weight)}
            r="4"
            fill={COLORS.dark.accentRed}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        ))}

        {/* X-axis date labels for first and last point */}
        {data.length > 0 && (
          <>
            <SvgText
              x={getX(0)}
              y={height - 6}
              fontSize="10"
              fill={COLORS.dark.textSecondary}
              textAnchor="start"
            >
              {data[0].date}
            </SvgText>
            {data.length > 1 && (
              <SvgText
                x={getX(data.length - 1)}
                y={height - 6}
                fontSize="10"
                fill={COLORS.dark.textSecondary}
                textAnchor="end"
              >
                {data[data.length - 1].date}
              </SvgText>
            )}
          </>
        )}
      </Svg>

      {/* Legend below chart */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.dark.accentRed }]} />
          <Text variant="caption" style={styles.legendText}>Actual Weight</Text>
        </View>
        {hasMovingAvg && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.dark.accentCyan }]} />
            <Text variant="caption" style={styles.legendText}>7-Day Moving Avg</Text>
          </View>
        )}
        {goalWeight && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.dark.accentGold }]} />
            <Text variant="caption" style={styles.legendText}>Goal Weight</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
  },
  emptyText: {
    color: COLORS.dark.textSecondary,
    fontStyle: 'italic',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.dark.textSecondary,
    fontSize: 10,
  },
});
