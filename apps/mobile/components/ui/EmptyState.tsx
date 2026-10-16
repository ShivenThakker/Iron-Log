import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '@/constants/tokens';
import { Text } from './Text';
import { GradientButton } from './GradientButton';
import { Icon, IconName } from './Icon';

interface EmptyStateProps {
  iconName?: IconName;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'Barbell',
  title,
  description,
  actionTitle,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Icon name={iconName} size={36} color={COLORS.dark.accentRed} weight="duotone" />
      </View>
      <Text variant="h3" align="center" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodySmall" align="center" color={COLORS.dark.textSecondary} style={styles.description}>
        {description}
      </Text>
      {actionTitle && onAction ? (
        <GradientButton
          title={actionTitle}
          onPress={onAction}
          size="sm"
          style={styles.actionBtn}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(233, 69, 96, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  description: {
    maxWidth: 280,
    marginBottom: SPACING.md,
  },
  actionBtn: {
    marginTop: SPACING.xs,
  },
});
