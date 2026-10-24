import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from './Text';
import { Icon, IconName } from './Icon';
import { OBSIDIAN_COLORS, OBSIDIAN_SPACING } from '@/constants/tokens';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  rightIcon?: IconName;
  onRightPress?: () => void;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  kicker,
  showBack = false,
  onBack,
  rightAction,
  rightIcon,
  onRightPress,
  style,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftRow}>
        {showBack ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="CaretLeft" size={22} color={OBSIDIAN_COLORS.textWhite} weight="bold" />
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleColumn}>
          {kicker ? (
            <Text variant="labelCaps" color={OBSIDIAN_COLORS.voltLime} style={styles.kicker}>
              {kicker}
            </Text>
          ) : null}
          <Text variant="headlineMd" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodySm" color={OBSIDIAN_COLORS.textMuted} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightContainer}>
        {rightAction ? (
          rightAction
        ) : rightIcon ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRightPress}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name={rightIcon} size={22} color={OBSIDIAN_COLORS.textWhite} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: OBSIDIAN_SPACING.md,
    minHeight: 56,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: OBSIDIAN_SPACING.sm,
    padding: OBSIDIAN_SPACING.xs,
  },
  titleColumn: {
    flex: 1,
  },
  kicker: {
    marginBottom: 2,
  },
  subtitle: {
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: OBSIDIAN_SPACING.sm,
  },
  iconButton: {
    padding: OBSIDIAN_SPACING.xs,
  },
});
