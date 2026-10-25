import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, OBSIDIAN_COLORS } from '@/constants/tokens';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  headerComponent?: React.ReactNode;
  theme?: 'default' | 'obsidian';
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  refreshing = false,
  onRefresh,
  style,
  contentContainerStyle,
  headerComponent,
  theme = 'default',
}) => {
  const insets = useSafeAreaInsets();
  const isObsidian = theme === 'obsidian';

  const containerPadding: ViewStyle = {
    paddingTop: Math.max(insets.top, 16),
    paddingBottom: Math.max(insets.bottom, 16),
    paddingLeft: Math.max(insets.left, SPACING.md),
    paddingRight: Math.max(insets.right, SPACING.md),
  };

  const bgColor = isObsidian ? OBSIDIAN_COLORS.canvas : COLORS.dark.bgPrimary;
  const refreshColor = isObsidian ? OBSIDIAN_COLORS.voltLime : COLORS.dark.accentRed;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, containerPadding, style]}>
      <StatusBar barStyle="light-content" backgroundColor={bgColor} />
      {headerComponent}
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={refreshColor}
                colors={[refreshColor]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentContainerStyle]}>{children}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  content: {
    flex: 1,
  },
});
