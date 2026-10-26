import React from 'react';
import * as Phosphor from 'phosphor-react-native';
import { COLORS } from '@/constants/tokens';

export type IconName =
  | 'Barbell'
  | 'ForkKnife'
  | 'Trophy'
  | 'Scales'
  | 'ChartLineUp'
  | 'Flame'
  | 'Check'
  | 'Plus'
  | 'CaretRight'
  | 'CaretLeft'
  | 'DotsThreeVertical'
  | 'Gear'
  | 'Robot'
  | 'MagnifyingGlass'
  | 'Timer'
  | 'Lightning'
  | 'Fire'
  | 'ArrowClockwise'
  | 'ShareNetwork'
  | 'Calendar'
  | 'CalendarCheck'
  | 'Clock'
  | 'Play'
  | 'Sparkle'
  | 'PaperPlaneTilt'
  | 'CheckCircle'
  | 'PlusCircle'
  | 'SignOut'
  | 'Heart'
  | 'Sun'
  | 'Moon'
  | 'Cookie'
  | 'X'
  | 'Lock'
  | 'LockOpen'
  | 'Trash'
  | 'PencilSimple'
  | 'ArrowFatUp'
  | 'ArrowFatDown'
  | 'DotsSixVertical'
  | 'DotsSix'
  | 'Equals'
  | 'CaretUp'
  | 'CaretDown'
  | 'ArrowsDownUp';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = COLORS.dark.textPrimary,
  weight = 'regular',
}) => {
  const iconMap = Phosphor as unknown as Record<IconName, React.ComponentType<Phosphor.IconProps> | undefined>;
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent size={size} color={color} weight={weight} />;
};
