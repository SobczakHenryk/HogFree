import type { ChartInterval, PostHogCloud, TimeFilter } from '../types';

// ─── API Key feature constants ──────────────────────────────────────────────

export const SECURE_STORE_KEY = 'POSTHOG_API_KEY';
export const POSTHOG_CLOUD_KEY = 'POSTHOG_CLOUD';
export const SELF_HOSTED_URL_KEY = 'POSTHOG_SELF_HOSTED_URL';
export const DEFAULT_POSTHOG_CLOUD: PostHogCloud = 'us';
const POSTHOG_CLOUD_HOSTS: Record<string, string> = {
  us: 'https://us.posthog.com',
  eu: 'https://eu.posthog.com',
};
export const POSTHOG_CLOUD_LABELS: Record<PostHogCloud, string> = {
  us: 'US Cloud',
  eu: 'EU Cloud',
  'self-hosted': 'Self-Hosted',
};
export const API_KEY_REGEX = /^ph(?:x|c)_[A-Za-z0-9]{10,}$/;
export const VALIDATION_TIMEOUT_MS = 10_000;
/** Timeout para queries de funnel — más lentas que métricas simples (PostHog puede tardar 20-30s con force_blocking) */
export const FUNNEL_QUERY_TIMEOUT_MS = 45_000;

export function isPostHogCloud(value: string | null | undefined): value is PostHogCloud {
  return value === 'us' || value === 'eu' || value === 'self-hosted';
}

export function getPostHogApiHost(cloud: PostHogCloud, selfHostedUrl?: string): string {
  if (cloud === 'self-hosted') {
    if (!selfHostedUrl) throw new Error('selfHostedUrl required when cloud is self-hosted');
    return selfHostedUrl;
  }
  return POSTHOG_CLOUD_HOSTS[cloud];
}

export const API_KEY_ERRORS = {
  EMPTY: 'errors.emptyApiKey',
  INVALID_FORMAT: 'errors.invalidFormat',
  INVALID_KEY: 'errors.invalidKey',
  INSUFFICIENT_PERMISSIONS: 'errors.insufficientPermissions',
  NETWORK_ERROR: 'errors.networkError',
  SERVER_ERROR: 'errors.serverError',
  SECURE_STORE_UNAVAILABLE: 'errors.secureStoreUnavailable',
  INVALID_URL: 'selfHosted.errors.invalidUrl',
  INSTANCE_UNREACHABLE: 'selfHosted.errors.instanceUnreachable',
  NOT_POSTHOG_INSTANCE: 'selfHosted.errors.notPosthogInstance',
} as const;

// ─── i18n constants ──────────────────────────────────────────────────────────

export const APP_LOCALE_PREFERENCE = 'APP_LOCALE_PREFERENCE';

// ─── Dashboard feature constants ─────────────────────────────────────────────

export const DASHBOARD_METRICS_CONFIG_KEY = 'DASHBOARD_METRICS_CONFIG';
export const POSTHOG_PROJECT_INFO_KEY = 'POSTHOG_PROJECT_INFO';
export const POSTHOG_REACT_QUERY_CACHE_KEY = 'POSTHOG_REACT_QUERY_CACHE';

// ─── Chart widget constants ─────────────────────────────────────────────────────────────

export const CHART_PRIMARY_COLOR = '#2DD4BF';
export const CHART_GRADIENT_START = '#3B82F6';
export const CHART_GRADIENT_END = '#2DD4BF';
export const TEAL_PRIMARY = '#2DD4BF';

/** Paleta de colores para los top 5 valores de breakdown. */
export const BREAKDOWN_COLORS = ['#2DD4BF', '#3B82F6', '#A78BFA', '#F472B6', '#FBBF24'];
/** Color para el grupo "Otros" en breakdown. */
export const BREAKDOWN_OTHER_COLOR = '#888888';

/** Granularidad del eje X por período: díario ≤30d, semanal 90d/180d, mensual all. */
export const TIME_FILTER_TO_INTERVAL: Record<TimeFilter, ChartInterval> = {
  today:     'day',
  yesterday: 'day',
  '7d':      'day',
  '15d':     'day',
  '30d':     'day',
  '90d':     'week',
  '180d':    'week',
  all:       'month',
};

// ─── Donation feature constants ─────────────────────────────────────────────

/** Ko-fi donation page URL — replace YOUR_USERNAME with your actual Ko-fi handle */
export const KOFI_URL = 'https://ko-fi.com/ingsobczak';
