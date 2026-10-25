import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Text } from './Text';
import { Icon, IconName } from './Icon';
import { OBSIDIAN_COLORS, OBSIDIAN_SPACING, OBSIDIAN_RADIUS } from '@/constants/tokens';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  valueChange?: string;
  isPositiveChange?: boolean;
  leftIcon?: IconName;
  leftIconColor?: string;
  rightIcon?: IconName;
  rightComponent?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  borderBottom?: boolean;
}

export const ListRow: React.FC<ListRowProps> = ({
  title,
  subtitle,
  value,
  valueChange,
  isPositiveChange,
  leftIcon,
  leftIconColor = OBSIDIAN_COLORS.voltLime,
  rightIcon,
  rightComponent,
  onPress,
  style,
  borderBottom = true,
}) => {
  const content = (
    <View
      style={[
        styles.row,
        borderBottom && styles.borderBottom,
        style,
      ]}
    >
      <View style={styles.left}>
        {leftIcon ? (
          <View style={styles.iconCircle}>
            <Icon name={leftIcon} size={18} color={leftIconColor} />
          </View>
        ) : null}
        <View style={styles.titleCol}>
          <Text variant="labelInteractive" color={OBSIDIAN_COLORS.textWhite}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodySm" color={OBSIDIAN_COLORS.textMuted} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        {value ? (
          <Text variant="headlineSm" color={OBSIDIAN_COLORS.textWhite} style={styles.value}>
            {value}
          </Text>
        ) : null}
        {valueChange ? (
          <Text
            variant="bodySm"
            color={isPositiveChange ? OBSIDIAN_COLORS.voltLime : OBSIDIAN_COLORS.coralAccent}
          >
            {valueChange}
          </Text>
        ) : null}
        {rightComponent}
        {rightIcon ? (
          <Icon name={rightIcon} size={18} color={OBSIDIAN_COLORS.textSlate} />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: OBSIDIAN_SPACING.md,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: OBSIDIAN_COLORS.borderGhost,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: OBSIDIAN_SPACING.md,
  },
  titleCol: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.sm,
  },
  value: {
    fontWeight: '700',
  },
});
