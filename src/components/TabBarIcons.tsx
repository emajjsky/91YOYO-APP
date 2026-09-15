import React from 'react';
import Svg, { Path, Circle, Polygon, Rect } from 'react-native-svg';

const SIZE = 26;

// ── 首页 ──────────────────────────────────────────
export function HomeIcon({ active }: { active: boolean }) {
  const c = active ? '#FFFFFF' : '#71767B';
  return active ? (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 81 81" fill="none">
      <Path d="M 40.5 16 L 16 37 L 22 42 L 40.5 26.5 L 59 42 L 65 37 Z" fill={c} />
      <Path d="M 23 38 L 23 64 L 34 64 L 34 49 C 34 45.5, 47 45.5, 47 49 L 47 64 L 58 64 L 58 38 Z" fill={c} />
    </Svg>
  ) : (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 81 81" fill="none">
      <Path d="M 40.5 18 L 18 37 L 23 41 L 40.5 26 L 58 41 L 63 37 Z" fill={c} />
      <Path
        d="M 24 39 L 24 63 L 35 63 L 35 48 C 35 45.5, 46 45.5, 46 48 L 46 63 L 57 63 L 57 39"
        stroke={c}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── 探索 ──────────────────────────────────────────
export function ExploreIcon({ active }: { active: boolean }) {
  const c = active ? '#FFFFFF' : '#71767B';
  return active ? (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 81 81" fill="none">
      <Circle cx={40.5} cy={40.5} r={23} stroke={c} strokeWidth={5.5} />
      <Polygon points="40.5,21 47,36 60,40.5 47,45 40.5,60 34,45 21,40.5 34,36" fill={c} />
    </Svg>
  ) : (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 81 81" fill="none">
      <Circle cx={40.5} cy={40.5} r={23} stroke={c} strokeWidth={4.5} />
      <Polygon points="40.5,24 45.5,37 57,40.5 45.5,44 40.5,57 35.5,44 24,40.5 35.5,37" fill={c} />
    </Svg>
  );
}

// ── 装备 (悠悠球双杯剖面) ──────────────────────────
export function GearIcon({ active }: { active: boolean }) {
  const c = active ? '#FFFFFF' : '#71767B';
  return active ? (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 81 81" fill="none">
      <Path d="M 24 18 L 29.5 24.5 L 35.5 34 L 35.5 47 L 29.5 56.5 L 24 63 L 17.5 63 C 15 52, 15 29, 17.5 18 Z" fill={c} />
      <Path d="M 57 18 L 51.5 24.5 L 45.5 34 L 45.5 47 L 51.5 56.5 L 57 63 L 63.5 63 C 66 52, 66 29, 63.5 18 Z" fill={c} />
      <Rect x={35} y={37.5} width={11} height={6} rx={2} fill={c} />
      <Circle cx={40.5} cy={40.5} r={1.8} fill="#000000" />
    </Svg>
  ) : (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 81 81" fill="none">
      <Path
        d="M 24 19 L 29 25 L 35 34 L 35 47 L 29 56 L 24 62 L 18 62 C 16 52, 16 29, 18 19 Z"
        stroke={c}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Path
        d="M 57 19 L 52 25 L 46 34 L 46 47 L 52 56 L 57 62 L 63 62 C 65 52, 65 29, 63 19 Z"
        stroke={c}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Rect x={35} y={38} width={11} height={5} rx={1.5} fill={c} />
    </Svg>
  );
}

// ── 我的 ──────────────────────────────────────────
export function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? '#FFFFFF' : '#71767B';
  return active ? (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 81 81" fill="none">
      <Circle cx={40.5} cy={28.5} r={10.5} fill={c} />
      <Path d="M 19 65 C 19 50.5, 29.5 45, 40.5 45 C 51.5 45, 62 50.5, 62 65 Z" fill={c} />
    </Svg>
  ) : (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 81 81" fill="none">
      <Circle cx={40.5} cy={29} r={10} stroke={c} strokeWidth={4.5} />
      <Path
        d="M 20 64 C 20 51, 30 46, 40.5 46 C 51 46, 61 51, 61 64"
        stroke={c}
        strokeWidth={4.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
