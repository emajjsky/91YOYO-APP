import React from 'react';
import { Boxes, Compass, House, UserRound } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';

export function HomeIcon({ active }: { active: boolean }) {
  const { colors } = useTheme();
  return <House color={active ? colors.textPrimary : colors.textMuted} fill={active ? colors.textPrimary : 'transparent'} size={24} strokeWidth={2} />;
}

export function ExploreIcon({ active }: { active: boolean }) {
  const { colors } = useTheme();
  return <Compass color={active ? colors.textPrimary : colors.textMuted} size={24} strokeWidth={active ? 2.5 : 2} />;
}

export function GearIcon({ active }: { active: boolean }) {
  const { colors } = useTheme();
  return <Boxes color={active ? colors.textPrimary : colors.textMuted} size={24} strokeWidth={active ? 2.5 : 2} />;
}

export function ProfileIcon({ active }: { active: boolean }) {
  const { colors } = useTheme();
  return <UserRound color={active ? colors.textPrimary : colors.textMuted} fill={active ? colors.textPrimary : 'transparent'} size={24} strokeWidth={2} />;
}
