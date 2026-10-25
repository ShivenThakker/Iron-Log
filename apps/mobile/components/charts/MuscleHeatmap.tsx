import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Image as SvgImage, Path, G } from 'react-native-svg';
import { OBSIDIAN_COLORS, OBSIDIAN_RADIUS, OBSIDIAN_SPACING } from '@/constants/tokens';
import { Text } from '@/components/ui/Text';
import { BODY_REGIONS } from '@/constants/bodyRegions';
import { mapHeatmapToRegionIntensities } from '@/constants/muscleMap';

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

export interface MuscleHeatmapProps {
  data?: MuscleHeatmapData | null;
  theme?: 'default' | 'obsidian';
  debugAll?: boolean;
}

/**
 * Traced anatomical muscle heatmap component with base side-by-side body imagery
 * and high-contrast Obsidian Volt highlight overlays.
 */
export const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({
  data,
  debugAll = false,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  // Card padding + inner margins: container width is roughly screenWidth - 48
  const containerWidth = Math.min(screenWidth - 48, 420);
  const containerHeight = containerWidth; // 1:1 aspect ratio matching 1024x1024

  // Map incoming muscle data to region intensities (0..1)
  const regionIntensities = React.useMemo(() => {
    if (debugAll) {
      // Light up all regions in dev debug mode
      const all: Record<string, number> = {};
      Object.keys(BODY_REGIONS.regions).forEach((region, i) => {
        all[region] = i % 2 === 0 ? 1.0 : 0.6;
      });
      return all;
    }
    if (!data) return {};
    return mapHeatmapToRegionIntensities(data);
  }, [data, debugAll]);

  // Compute maximum intensity for relative scaling
  const maxIntensity = React.useMemo(() => {
    const values = Object.values(regionIntensities);
    if (values.length === 0) return 1.0;
    const max = Math.max(...values);
    return max > 0 ? max : 1.0;
  }, [regionIntensities]);

  return (
    <View style={styles.container}>
      {/* Side-by-side Anatomical Canvas */}
      <View style={[styles.canvasContainer, { width: containerWidth, height: containerHeight }]}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${BODY_REGIONS.width} ${BODY_REGIONS.height}`}
        >
          {/* Base anatomical body image (front + back side-by-side) */}
          <SvgImage
            href={require('@/assets/body/body-base.png')}
            x="0"
            y="0"
            width={BODY_REGIONS.width}
            height={BODY_REGIONS.height}
            preserveAspectRatio="xMidYMid meet"
          />

          {/* Active Muscle Overlay Regions */}
          {Object.entries(BODY_REGIONS.regions).map(([regionKey, paths]) => {
            const rawIntensity = regionIntensities[regionKey] || 0;
            if (rawIntensity <= 0) return null;

            // Intensity relative to user's highest volume muscle
            const relativeIntensity = rawIntensity / maxIntensity;
            const isPeak = relativeIntensity >= 0.7;

            // Visual styling:
            // Peak: ~90% opacity volt lime + glow outline
            // Moderate: ~50% opacity volt lime / primaryFixedDim
            const fillColor = isPeak ? OBSIDIAN_COLORS.voltLime : OBSIDIAN_COLORS.primaryFixedDim;
            const fillOpacity = isPeak ? 0.88 : 0.52;
            const strokeColor = OBSIDIAN_COLORS.voltLime;
            const strokeOpacity = isPeak ? 0.85 : 0.35;
            const glowOpacity = isPeak ? 0.45 : 0;

            return (
              <G key={regionKey} id={`highlight-${regionKey}`}>
                {paths.map((p) => (
                  <React.Fragment key={p.id}>
                    {/* Outer soft glow stroke for peak volume */}
                    {isPeak && (
                      <Path
                        d={p.d}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={6}
                        strokeOpacity={glowOpacity}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}
                    {/* Filled active muscle shape */}
                    <Path
                      d={p.d}
                      fill={fillColor}
                      fillOpacity={fillOpacity}
                      fillRule="evenodd"
                      stroke={strokeColor}
                      strokeWidth={isPeak ? 1.5 : 1}
                      strokeOpacity={strokeOpacity}
                      strokeLinejoin="round"
                    />
                  </React.Fragment>
                ))}
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Heatmap Legend matching Stitch Obsidian Volt design */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: OBSIDIAN_COLORS.surfaceContainerHighest }]} />
          <Text variant="labelCaps" style={styles.legendText}>
            INACTIVE
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: OBSIDIAN_COLORS.primaryFixedDim }]} />
          <Text variant="labelCaps" style={styles.legendText}>
            MODERATE
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotPeak]} />
          <Text variant="labelCaps" style={styles.legendTextPeak}>
            PEAK VOLUME
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: OBSIDIAN_SPACING.sm,
  },
  canvasContainer: {
    borderRadius: OBSIDIAN_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#0e111a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: OBSIDIAN_SPACING.md,
    paddingHorizontal: OBSIDIAN_SPACING.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDotPeak: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  legendText: {
    color: OBSIDIAN_COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  legendTextPeak: {
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default MuscleHeatmap;
