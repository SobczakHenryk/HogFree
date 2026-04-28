import { es, enUS } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { Locale } from '../i18n/types';

const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { es, en: enUS };
const INTL_LOCALES: Record<Locale, string> = { es: 'es-ES', en: 'en-US' };

export function getDateLocale(locale: Locale): DateFnsLocale {
  return DATE_FNS_LOCALES[locale];
}

export function getIntlLocale(locale: Locale): string {
  return INTL_LOCALES[locale];
}
