import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  brand: string;
  like: string;
  black: string;
  white: string;
}

const STORAGE_KEY = '@91yoyo/theme-mode';

const palettes: Record<ResolvedTheme, ThemeColors> = {
  dark: {
    background: '#090b0d',
    surface: '#121518',
    border: '#24282d',
    textPrimary: '#f2f4f5',
    textSecondary: '#aeb6bd',
    textMuted: '#727b84',
    brand: '#15b8c6',
    like: '#f0447d',
    black: '#000000',
    white: '#ffffff',
  },
  light: {
    background: '#ffffff',
    surface: '#f2f4f5',
    border: '#d8dde2',
    textPrimary: '#111418',
    textSecondary: '#4f5a64',
    textMuted: '#78838d',
    brand: '#079eac',
    like: '#e63872',
    black: '#000000',
    white: '#ffffff',
  },
};

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  colors: ThemeColors;
  setMode(mode: ThemeMode): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const resolvedTheme: ResolvedTheme = mode === 'auto' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (mounted && (stored === 'light' || stored === 'dark' || stored === 'auto')) setModeState(stored);
    });
    return () => { mounted = false; };
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    Appearance.setColorScheme(nextMode === 'auto' ? 'unspecified' : nextMode);
    void AsyncStorage.setItem(STORAGE_KEY, nextMode);
  };

  const value = useMemo(() => ({ mode, resolvedTheme, colors: palettes[resolvedTheme], setMode }), [mode, resolvedTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
