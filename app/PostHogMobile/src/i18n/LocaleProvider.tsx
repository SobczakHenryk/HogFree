import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import { es } from './locales/es';
import { en } from './locales/en';
import type { Locale, LocaleContextValue, TranslationCatalog, TranslationKey } from './types';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './types';

const APP_LOCALE_PREFERENCE = 'APP_LOCALE_PREFERENCE';

const catalogs: Record<Locale, TranslationCatalog> = { es, en };

const LocaleContext = createContext<LocaleContextValue | null>(null);

function isSupportedLocale(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

function detectDeviceLocale(): Locale {
  try {
    const deviceLocales = getLocales();
    const lang = deviceLocales[0]?.languageCode ?? '';
    return isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    AsyncStorage.getItem(APP_LOCALE_PREFERENCE)
      .then((stored) => {
        if (isSupportedLocale(stored)) {
          setLocaleState(stored);
        } else {
          setLocaleState(detectDeviceLocale());
        }
      })
      .catch(() => {
        setLocaleState(detectDeviceLocale());
      });
  }, []);

  const setLocale = useCallback((next: Locale) => {
    if (!isSupportedLocale(next)) return;
    setLocaleState(next);
    AsyncStorage.setItem(APP_LOCALE_PREFERENCE, next).catch(() => {});
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const parts = key.split('.');
      const catalog = catalogs[locale];
      let value: unknown = catalog;
      for (const part of parts) {
        value = (value as Record<string, unknown>)?.[part];
      }
      return typeof value === 'string' ? value : key;
    },
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within <LocaleProvider>.');
  }
  return ctx;
}
