import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const SUPPORTED_THEMES: readonly ThemePreference[] = ['system', 'light', 'dark'] as const;
const DEFAULT_THEME: ThemePreference = 'system';
const APP_THEME_PREFERENCE = 'APP_THEME_PREFERENCE';

interface ThemeContextValue {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isSupportedTheme(value: string | null | undefined): value is ThemePreference {
  return SUPPORTED_THEMES.includes(value as ThemePreference);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [themePreference, setThemePreference] = useState<ThemePreference>(DEFAULT_THEME);

  useEffect(() => {
    AsyncStorage.getItem(APP_THEME_PREFERENCE)
      .then((stored) => {
        const pref = isSupportedTheme(stored) ? stored : DEFAULT_THEME;
        setThemePreference(pref);
        setColorScheme(pref);
      })
      .catch(() => {
        setColorScheme(DEFAULT_THEME);
      });
  }, [setColorScheme]);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      if (!isSupportedTheme(next)) return;
      setThemePreference(next);
      setColorScheme(next);
      AsyncStorage.setItem(APP_THEME_PREFERENCE, next).catch(() => {});
    },
    [setColorScheme],
  );

  const resolvedTheme: ResolvedTheme = colorScheme === 'light' ? 'light' : 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({ themePreference, resolvedTheme, setTheme }),
    [themePreference, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within <ThemeProvider>.');
  }
  return ctx;
}
