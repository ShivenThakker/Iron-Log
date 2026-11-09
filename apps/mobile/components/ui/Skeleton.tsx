import React, { createContext, useContext, useEffect, useState, useId } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
  StyleProp,
  Platform,
  Easing,
  ScrollView,
  AppState,
  AppStateStatus,
  DimensionValue,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { OBSIDIAN_COLORS, OBSIDIAN_RADIUS, OBSIDIAN_SPACING } from '@/constants/tokens';
import { ScreenContainer } from './ScreenContainer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Shared context for synchronizing the wave across all skeletons on screen
const SkeletonWaveContext = createContext<Animated.AnimatedInterpolation<string | number> | null>(null);

let globalLoopAnim: Animated.Value | null = null;
let globalLoopAnimation: Animated.CompositeAnimation | null = null;
let globalWaveInterpolation: Animated.AnimatedInterpolation<string | number> | null = null;

function getGlobalWave(): Animated.AnimatedInterpolation<string | number> {
  if (!globalLoopAnim) {
    globalLoopAnim = new Animated.Value(0);
    globalLoopAnimation = Animated.loop(
      Animated.timing(globalLoopAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    globalLoopAnimation.start();

    AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        globalLoopAnimation?.start();
      } else {
        globalLoopAnimation?.stop();
      }
    });

    globalWaveInterpolation = globalLoopAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-SCREEN_WIDTH * 1.5, SCREEN_WIDTH * 1.5],
    });
  }
  return globalWaveInterpolation!;
}

export function SkeletonProvider({ children }: { children: React.ReactNode }) {
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    loop.start();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        loop.start();
      } else {
        loop.stop();
      }
    });

    return () => {
      loop.stop();
      subscription.remove();
    };
  }, [anim]);

  const waveTranslateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH * 1.5, SCREEN_WIDTH * 1.5],
  });

  return (
    <SkeletonWaveContext.Provider value={waveTranslateX}>
      {children}
    </SkeletonWaveContext.Provider>
  );
}

// Core Skeleton primitive

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = OBSIDIAN_RADIUS.md,
  style,
  children,
}) => {
  const contextWave = useContext(SkeletonWaveContext);
  const waveTranslateX = contextWave || getGlobalWave();
  const rawId = useId();
  const gradId = `green_wave_${rawId.replace(/:/g, '_')}`;

  return (
    <View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      {/* Greenish wave shimmer from left to right */}
      <Animated.View
        style={[
          styles.waveOverlay,
          {
            width: SCREEN_WIDTH * 1.8,
            transform: [{ translateX: waveTranslateX }],
          },
        ]}
        pointerEvents="none"
      >
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#CCFF00" stopOpacity="0" />
              <Stop offset="25%" stopColor="#CCFF00" stopOpacity="0.03" />
              <Stop offset="45%" stopColor="#CCFF00" stopOpacity="0.16" />
              <Stop offset="50%" stopColor="#CCFF00" stopOpacity="0.32" />
              <Stop offset="55%" stopColor="#CCFF00" stopOpacity="0.16" />
              <Stop offset="75%" stopColor="#CCFF00" stopOpacity="0.03" />
              <Stop offset="100%" stopColor="#CCFF00" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
        </Svg>
      </Animated.View>
      {children}
    </View>
  );
};

export const SkeletonCircle: React.FC<{ size: number; style?: StyleProp<ViewStyle> }> = ({
  size,
  style,
}) => {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};

export const SkeletonCard: React.FC<{
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}> = ({ height = 120, borderRadius = OBSIDIAN_RADIUS.lg, style, children }) => {
  return (
    <Skeleton
      width="100%"
      height={height}
      borderRadius={borderRadius}
      style={[styles.cardBase, style]}
    >
      {children}
    </Skeleton>
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  lineHeight?: number;
  gap?: number;
  width?: number | string;
  lastLineWidth?: number | string;
  style?: StyleProp<ViewStyle>;
}> = ({
  lines = 2,
  lineHeight = 14,
  gap = 8,
  width = '100%',
  lastLineWidth = '60%',
  style,
}) => {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 && lines > 1 ? lastLineWidth : width}
          borderRadius={OBSIDIAN_RADIUS.sm}
        />
      ))}
    </View>
  );
};

// Specialized Full-Screen Skeletons

/**
 * Skeleton for Home / Dashboard screen (app/(tabs)/index.tsx)
 */
export function DashboardSkeleton() {
  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header greeting & rank row */}
        <View style={styles.dashboardHeader}>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width={110} height={12} borderRadius={OBSIDIAN_RADIUS.sm} />
            <Skeleton width={180} height={26} borderRadius={OBSIDIAN_RADIUS.sm} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Skeleton width={96} height={34} borderRadius={OBSIDIAN_RADIUS.full} />
            <SkeletonCircle size={38} />
          </View>
        </View>

        {/* Today's Workout Hero Card */}
        <View style={styles.workoutHeroSkeleton}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={140} height={14} borderRadius={OBSIDIAN_RADIUS.sm} />
            <Skeleton width={70} height={20} borderRadius={OBSIDIAN_RADIUS.full} />
          </View>

          <Skeleton width="80%" height={28} borderRadius={OBSIDIAN_RADIUS.sm} style={{ marginTop: 12 }} />
          <Skeleton width="50%" height={14} borderRadius={OBSIDIAN_RADIUS.sm} style={{ marginTop: 6 }} />

          {/* Exercise items placeholder */}
          <View style={{ gap: 8, marginTop: 16 }}>
            <Skeleton width="100%" height={40} borderRadius={OBSIDIAN_RADIUS.md} />
            <Skeleton width="100%" height={40} borderRadius={OBSIDIAN_RADIUS.md} />
            <Skeleton width="100%" height={40} borderRadius={OBSIDIAN_RADIUS.md} />
          </View>

          {/* Action button */}
          <Skeleton width="100%" height={50} borderRadius={OBSIDIAN_RADIUS.md} style={{ marginTop: 18 }} />
        </View>

        {/* Nutrition Card Skeleton */}
        <View style={styles.nutritionCardSkeleton}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={130} height={16} borderRadius={OBSIDIAN_RADIUS.sm} />
            <Skeleton width={80} height={14} borderRadius={OBSIDIAN_RADIUS.sm} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 18 }}>
            <SkeletonCircle size={86} />
            <View style={{ flex: 1, gap: 10 }}>
              <Skeleton width="100%" height={10} borderRadius={OBSIDIAN_RADIUS.full} />
              <Skeleton width="85%" height={10} borderRadius={OBSIDIAN_RADIUS.full} />
              <Skeleton width="70%" height={10} borderRadius={OBSIDIAN_RADIUS.full} />
            </View>
          </View>
        </View>

        {/* Recent Activity Skeleton */}
        <View style={{ marginTop: 16, gap: 12 }}>
          <Skeleton width={150} height={18} borderRadius={OBSIDIAN_RADIUS.sm} />
          <Skeleton width="100%" height={74} borderRadius={OBSIDIAN_RADIUS.lg} />
          <Skeleton width="100%" height={74} borderRadius={OBSIDIAN_RADIUS.lg} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Skeleton for Workout Preview screen (app/workout/preview.tsx)
 */
export function WorkoutPreviewSkeleton() {
  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <View style={{ flex: 1, paddingHorizontal: OBSIDIAN_SPACING.md, paddingTop: 12 }}>
        {/* Header with back button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <SkeletonCircle size={40} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="75%" height={24} borderRadius={OBSIDIAN_RADIUS.sm} />
            <Skeleton width="45%" height={13} borderRadius={OBSIDIAN_RADIUS.sm} />
          </View>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <Skeleton width="31%" height={44} borderRadius={OBSIDIAN_RADIUS.md} />
          <Skeleton width="31%" height={44} borderRadius={OBSIDIAN_RADIUS.md} />
          <Skeleton width="31%" height={44} borderRadius={OBSIDIAN_RADIUS.md} />
        </View>

        {/* Exercise List */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 100 }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.exerciseCardSkeleton}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width="60%" height={20} borderRadius={OBSIDIAN_RADIUS.sm} />
                <Skeleton width={70} height={18} borderRadius={OBSIDIAN_RADIUS.sm} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Skeleton width={65} height={18} borderRadius={OBSIDIAN_RADIUS.full} />
                <Skeleton width={60} height={18} borderRadius={OBSIDIAN_RADIUS.full} />
              </View>
              <Skeleton width="100%" height={32} borderRadius={OBSIDIAN_RADIUS.sm} style={{ marginTop: 12 }} />
            </View>
          ))}
        </ScrollView>

        {/* Bottom floating button */}
        <View style={styles.floatingBottomBtn}>
          <Skeleton width="100%" height={54} borderRadius={OBSIDIAN_RADIUS.lg} />
        </View>
      </View>
    </ScreenContainer>
  );
}

/**
 * Skeleton for Insights screen (app/(tabs)/insights.tsx)
 */
export function InsightsSkeleton() {
  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ gap: 6, marginBottom: 16 }}>
          <Skeleton width={180} height={26} borderRadius={OBSIDIAN_RADIUS.sm} />
          <Skeleton width={220} height={14} borderRadius={OBSIDIAN_RADIUS.sm} />
        </View>

        {/* Time range selector */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <Skeleton width="22%" height={34} borderRadius={OBSIDIAN_RADIUS.full} />
          <Skeleton width="22%" height={34} borderRadius={OBSIDIAN_RADIUS.full} />
          <Skeleton width="22%" height={34} borderRadius={OBSIDIAN_RADIUS.full} />
          <Skeleton width="22%" height={34} borderRadius={OBSIDIAN_RADIUS.full} />
        </View>

        {/* 3 Metric cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <Skeleton width="31%" height={74} borderRadius={OBSIDIAN_RADIUS.md} />
          <Skeleton width="31%" height={74} borderRadius={OBSIDIAN_RADIUS.md} />
          <Skeleton width="31%" height={74} borderRadius={OBSIDIAN_RADIUS.md} />
        </View>

        {/* Large Muscle Heatmap Card */}
        <View style={styles.chartCardSkeleton}>
          <Skeleton width={140} height={18} borderRadius={OBSIDIAN_RADIUS.sm} />
          <Skeleton width="100%" height={260} borderRadius={OBSIDIAN_RADIUS.md} style={{ marginTop: 14 }} />
        </View>

        {/* Radar Chart Card */}
        <View style={[styles.chartCardSkeleton, { marginTop: 16 }]}>
          <Skeleton width={150} height={18} borderRadius={OBSIDIAN_RADIUS.sm} />
          <Skeleton width="100%" height={220} borderRadius={OBSIDIAN_RADIUS.md} style={{ marginTop: 14 }} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Skeleton for Body screen (app/(tabs)/body.tsx)
 */
export function BodySkeleton() {
  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ gap: 6, marginBottom: 16 }}>
          <Skeleton width={160} height={26} borderRadius={OBSIDIAN_RADIUS.sm} />
          <Skeleton width={210} height={14} borderRadius={OBSIDIAN_RADIUS.sm} />
        </View>

        {/* Current Weight Hero Card */}
        <View style={styles.workoutHeroSkeleton}>
          <Skeleton width={110} height={14} borderRadius={OBSIDIAN_RADIUS.sm} />
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <Skeleton width={130} height={42} borderRadius={OBSIDIAN_RADIUS.md} />
            <Skeleton width={60} height={20} borderRadius={OBSIDIAN_RADIUS.sm} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Skeleton width="48%" height={38} borderRadius={OBSIDIAN_RADIUS.md} />
            <Skeleton width="48%" height={38} borderRadius={OBSIDIAN_RADIUS.md} />
          </View>
        </View>

        {/* Chart Container */}
        <View style={[styles.chartCardSkeleton, { marginTop: 18 }]}>
          <Skeleton width={130} height={18} borderRadius={OBSIDIAN_RADIUS.sm} />
          <Skeleton width="100%" height={180} borderRadius={OBSIDIAN_RADIUS.md} style={{ marginTop: 14 }} />
        </View>

        {/* Measurements Grid */}
        <View style={{ marginTop: 20, gap: 12 }}>
          <Skeleton width={170} height={18} borderRadius={OBSIDIAN_RADIUS.sm} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Skeleton width="48%" height={80} borderRadius={OBSIDIAN_RADIUS.lg} />
            <Skeleton width="48%" height={80} borderRadius={OBSIDIAN_RADIUS.lg} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Skeleton width="48%" height={80} borderRadius={OBSIDIAN_RADIUS.lg} />
            <Skeleton width="48%" height={80} borderRadius={OBSIDIAN_RADIUS.lg} />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Skeleton for Nutrition screen (app/(tabs)/nutrition.tsx)
 */
export function NutritionSkeleton() {
  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <View style={{ gap: 6 }}>
            <Skeleton width={150} height={26} borderRadius={OBSIDIAN_RADIUS.sm} />
            <Skeleton width={100} height={14} borderRadius={OBSIDIAN_RADIUS.sm} />
          </View>
          <Skeleton width={110} height={34} borderRadius={OBSIDIAN_RADIUS.full} />
        </View>

        {/* Calorie Ring Summary */}
        <View style={styles.workoutHeroSkeleton}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 10 }}>
            <SkeletonCircle size={110} />
            <View style={{ gap: 12 }}>
              <Skeleton width={120} height={16} borderRadius={OBSIDIAN_RADIUS.sm} />
              <Skeleton width={90} height={24} borderRadius={OBSIDIAN_RADIUS.sm} />
              <Skeleton width={110} height={12} borderRadius={OBSIDIAN_RADIUS.sm} />
            </View>
          </View>
        </View>

        {/* Macro Bars */}
        <View style={[styles.nutritionCardSkeleton, { marginTop: 16 }]}>
          <Skeleton width={140} height={16} borderRadius={OBSIDIAN_RADIUS.sm} />
          <View style={{ gap: 14, marginTop: 14 }}>
            <Skeleton width="100%" height={16} borderRadius={OBSIDIAN_RADIUS.full} />
            <Skeleton width="100%" height={16} borderRadius={OBSIDIAN_RADIUS.full} />
            <Skeleton width="100%" height={16} borderRadius={OBSIDIAN_RADIUS.full} />
          </View>
        </View>

        {/* Meal Slots (Breakfast, Lunch, Dinner, Snacks) */}
        <View style={{ marginTop: 20, gap: 12 }}>
          {['Breakfast', 'Lunch', 'Dinner'].map((name) => (
            <View key={name} style={styles.mealSlotSkeleton}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width={100} height={18} borderRadius={OBSIDIAN_RADIUS.sm} />
                <Skeleton width={60} height={14} borderRadius={OBSIDIAN_RADIUS.sm} />
              </View>
              <Skeleton width="100%" height={40} borderRadius={OBSIDIAN_RADIUS.md} style={{ marginTop: 10 }} />
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Skeleton for Plan Builder screen (app/program/builder.tsx)
 */
export function PlanBuilderSkeleton() {
  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <View style={{ flex: 1, paddingHorizontal: OBSIDIAN_SPACING.md, paddingTop: 12 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <SkeletonCircle size={38} />
            <View style={{ gap: 6 }}>
              <Skeleton width={160} height={22} borderRadius={OBSIDIAN_RADIUS.sm} />
              <Skeleton width={100} height={12} borderRadius={OBSIDIAN_RADIUS.sm} />
            </View>
          </View>
          <Skeleton width={88} height={36} borderRadius={OBSIDIAN_RADIUS.md} />
        </View>

        {/* Day Selector Tabs (Mon - Sun) */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <Skeleton key={d} width="12%" height={44} borderRadius={OBSIDIAN_RADIUS.md} />
          ))}
        </View>

        {/* Day Info Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Skeleton width={140} height={20} borderRadius={OBSIDIAN_RADIUS.sm} />
          <Skeleton width={100} height={32} borderRadius={OBSIDIAN_RADIUS.full} />
        </View>

        {/* Exercise cards list */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 80 }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.builderExerciseSkeleton}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Skeleton width={12} height={28} borderRadius={OBSIDIAN_RADIUS.full} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="65%" height={18} borderRadius={OBSIDIAN_RADIUS.sm} />
                  <Skeleton width="35%" height={12} borderRadius={OBSIDIAN_RADIUS.sm} />
                </View>
                <Skeleton width={70} height={32} borderRadius={OBSIDIAN_RADIUS.md} />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

/**
 * Skeleton for Achievements screen (app/(tabs)/achievements.tsx)
 */
export function AchievementsSkeleton() {
  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ gap: 6, marginBottom: 16 }}>
          <Skeleton width={180} height={26} borderRadius={OBSIDIAN_RADIUS.sm} />
          <Skeleton width={230} height={14} borderRadius={OBSIDIAN_RADIUS.sm} />
        </View>

        {/* Hero Rank Card */}
        <View style={styles.workoutHeroSkeleton}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <SkeletonCircle size={64} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width={120} height={22} borderRadius={OBSIDIAN_RADIUS.sm} />
              <Skeleton width="100%" height={12} borderRadius={OBSIDIAN_RADIUS.full} />
              <Skeleton width={90} height={12} borderRadius={OBSIDIAN_RADIUS.sm} />
            </View>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 18 }}>
          <Skeleton width="22%" height={32} borderRadius={OBSIDIAN_RADIUS.full} />
          <Skeleton width="22%" height={32} borderRadius={OBSIDIAN_RADIUS.full} />
          <Skeleton width="22%" height={32} borderRadius={OBSIDIAN_RADIUS.full} />
          <Skeleton width="22%" height={32} borderRadius={OBSIDIAN_RADIUS.full} />
        </View>

        {/* Trophy Cards Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.trophyCardSkeleton}>
              <SkeletonCircle size={44} />
              <Skeleton width={90} height={14} borderRadius={OBSIDIAN_RADIUS.sm} style={{ marginTop: 8 }} />
              <Skeleton width={110} height={10} borderRadius={OBSIDIAN_RADIUS.sm} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// Styles

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: '#141824',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  cardBase: {
    backgroundColor: '#10131C',
    borderColor: 'rgba(204, 255, 0, 0.06)',
  },
  waveOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    height: '100%',
  },
  screenScroll: {
    flex: 1,
  },
  screenScrollContent: {
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: 12,
    paddingBottom: 40,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  workoutHeroSkeleton: {
    backgroundColor: '#10131C',
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.1)',
  },
  nutritionCardSkeleton: {
    backgroundColor: '#10131C',
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.md,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  chartCardSkeleton: {
    backgroundColor: '#10131C',
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  mealSlotSkeleton: {
    backgroundColor: '#10131C',
    borderRadius: OBSIDIAN_RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  exerciseCardSkeleton: {
    backgroundColor: '#10131C',
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  floatingBottomBtn: {
    position: 'absolute',
    bottom: 20,
    left: OBSIDIAN_SPACING.md,
    right: OBSIDIAN_SPACING.md,
  },
  builderExerciseSkeleton: {
    backgroundColor: '#10131C',
    borderRadius: OBSIDIAN_RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  trophyCardSkeleton: {
    width: (SCREEN_WIDTH - OBSIDIAN_SPACING.md * 2 - 12) / 2,
    backgroundColor: '#10131C',
    borderRadius: OBSIDIAN_RADIUS.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
});
