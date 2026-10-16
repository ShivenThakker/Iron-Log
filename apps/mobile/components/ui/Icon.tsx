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
  | 'X'
  | 'Lock'
  | 'LockOpen'
  | 'Trash'
  | 'PencilSimple'
  | 'ArrowFatUp'
  | 'ArrowFatDown';

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
  const IconComponent = (Phosphor as any)[name];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent size={size} color={color} weight={weight} />;
};
