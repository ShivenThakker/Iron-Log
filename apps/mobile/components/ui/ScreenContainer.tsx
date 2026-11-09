import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
  keyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
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
  keyboardAvoiding = true,
  keyboardVerticalOffset,
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

  const innerContent = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={true}
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
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, containerPadding, style]}>
      <StatusBar style="light" />
      {headerComponent}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset ?? (Platform.OS === 'ios' ? insets.top : 0)}
        >
          {innerContent}
        </KeyboardAvoidingView>
      ) : (
        innerContent
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.bgPrimary,
  },
  keyboardAvoid: {
    flex: 1,
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
