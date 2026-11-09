import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { COLORS, SPRINGS } from '@/constants/tokens';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = COLORS.dark.accentRed,
  trackColor = 'rgba(255, 255, 255, 0.08)',
  height = 8,
  style,
  animated = true,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const [animProgress] = useState(() => new Animated.Value(clampedProgress));

  useEffect(() => {
    if (animated) {
      Animated.spring(animProgress, {
        toValue: clampedProgress,
        ...SPRINGS.gentle,
        useNativeDriver: false,
      }).start();
    } else {
      animProgress.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, animProgress]);

  const widthInterpolation = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: widthInterpolation,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

