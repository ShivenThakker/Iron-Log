import React, { useEffect, useState } from 'react';
import {
  Pressable,
  Animated,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { OBSIDIAN_COLORS, SPRINGS } from '@/constants/tokens';

export interface ToggleProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 24;
const PADDING = 3;
const TRAVEL_DISTANCE = TRACK_WIDTH - THUMB_SIZE - PADDING * 2; // 52 - 24 - 6 = 22

export const Toggle: React.FC<ToggleProps> = ({
  value,
  onValueChange,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}) => {
  // 0 = off, 1 = on
  const [animValue] = useState(() => new Animated.Value(value ? 1 : 0));
  const [pressScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: value ? 1 : 0,
      ...SPRINGS.snappy,
      useNativeDriver: false, // Color and width interpolations need JS driver on track
    }).start();
  }, [value, animValue]);

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(pressScale, {
      toValue: 1.15, // Tactile thumb elongation on hold
      ...SPRINGS.instant,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      ...SPRINGS.snappy,
      useNativeDriver: false,
    }).start();
  };

  const handleToggle = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onValueChange(!value);
  };

  // Interpolations
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [PADDING, PADDING + TRAVEL_DISTANCE],
  });

  const trackBgColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#232836', OBSIDIAN_COLORS.voltLime],
  });

  const trackBorderColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(204, 255, 0, 0.6)'],
  });

  const thumbColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#94A3B8', '#0B1200'],
  });

  const thumbWidth = Animated.multiply(THUMB_SIZE, pressScale);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      onPress={handleToggle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} // 44x44px minimum hit area
      style={[styles.container, disabled && styles.disabled, style]}
    >
      {/* Animated Track with Concentric Outer Radius */}
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor: trackBgColor,
            borderColor: trackBorderColor,
          },
          value && styles.trackGlow,
        ]}
      >
        {/* Animated Thumb with Concentric Inner Radius */}
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbColor,
              width: thumbWidth,
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2, // 15px
    borderWidth: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  trackGlow: {
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  thumb: {
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2, // 12px -> 15 (outer) = 12 (inner) + 3 (padding)
    position: 'absolute',
    top: PADDING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  disabled: {
    opacity: 0.45,
  },
});
