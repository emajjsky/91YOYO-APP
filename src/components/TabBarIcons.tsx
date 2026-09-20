import React from 'react';
import { Boxes, Compass, House, UserRound } from 'lucide-react-native';
import { Colors } from '../constants/colors';

function color(active: boolean) {
  return active ? Colors.textPrimary : Colors.textMuted;
}

export function HomeIcon({ active }: { active: boolean }) {
  return <House color={color(active)} fill={active ? color(active) : 'transparent'} size={24} strokeWidth={2} />;
}

export function ExploreIcon({ active }: { active: boolean }) {
  return <Compass color={color(active)} size={24} strokeWidth={active ? 2.5 : 2} />;
}

export function GearIcon({ active }: { active: boolean }) {
  return <Boxes color={color(active)} size={24} strokeWidth={active ? 2.5 : 2} />;
}

export function ProfileIcon({ active }: { active: boolean }) {
  return <UserRound color={color(active)} fill={active ? color(active) : 'transparent'} size={24} strokeWidth={2} />;
}
