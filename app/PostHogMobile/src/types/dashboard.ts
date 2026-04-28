import type { PostHogCloud } from './index';

// ─── Dashboard feature types ─────────────────────────────────────────────────

// ─── TimeFilter ───────────────────────────────────────────────────────────────

export type TimeFilter =
  | 'today'
  | 'yesterday'
  | '7d'
  | '15d'
  | '30d'
  | '90d'
  | '180d'
  | 'all';

/** @deprecated Use t('timeFilter.*') from useLocale() instead. Will be removed in T024. */
export const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  '7d': '7 días',
  '15d': '15 días',
  '30d': '30 días',
  '90d': '90 días',
  '180d': '180 días',
  all: 'Histórico',
};

// ─── ChartType ────────────────────────────────────────────────────────────────

/** Tipo de visualización para una métrica del dashboard. */
export type ChartType = 'MetricCard' | 'BarChart' | 'LineChart' | 'FunnelChart';

/** Granularidad del eje X para chart widgets, mapeada desde TimeFilter. */
export type ChartInterval = 'day' | 'week' | 'month';

// ─── TimeSeriesDataPoint ──────────────────────────────────────────────────────

/** Un punto de datos en la serie temporal retornada por PostHog. */
export interface TimeSeriesDataPoint {
  /** Fecha del intervalo. Formato: 'YYYY-MM-DD'. */
  date: string;
  /** Conteo de eventos en ese intervalo. Siempre >= 0. */
  count: number;
}

// ─── MetricSeries ─────────────────────────────────────────────────────────────

/** Serie temporal de una métrica. Vive en el cache de TanStack Query bajo ['metric_series', ...]. */
export interface MetricSeries {
  /** Array de puntos de datos ordenados cronológicamente. */
  dataPoints: TimeSeriesDataPoint[];
  /** Suma total de todos los conteos en el período. */
  total: number;
  /** ISO 8601 timestamp del último refresco exitoso desde la API. */
  lastRefreshedAt: string;
}

// ─── DashboardMetric ──────────────────────────────────────────────────────────

// ─── FunnelStep ──────────────────────────────────────────────────────────────

/** Un paso del funnel con su conteo y nombre de evento. */
export interface FunnelStep {
  /** Nombre del evento PostHog. */
  name: string;
  /** Número de usuarios que llegaron a este paso. */
  count: number;
  /** Índice del paso (0-based). */
  order: number;
}

// ─── FunnelResult ─────────────────────────────────────────────────────────────

/** Resultado de un insight de tipo Funnel. Vive en el cache de TanStack Query bajo ['funnel', ...]. */
export interface FunnelResult {
  /** Pasos del funnel, ordenados por `order` ascendente. */
  steps: FunnelStep[];
  /** ISO 8601 timestamp del último refresco exitoso desde la API. */
  lastRefreshedAt: string;
}

// ─── DashboardMetric ──────────────────────────────────────────────────────────

/** Métrica configurada por el usuario — unidad de configuración persistida en AsyncStorage. */
export interface DashboardMetric {
  /** UUID generado localmente al añadir la métrica. Inmutable. */
  id: string;
  /** Nombre del evento PostHog (ej. "$pageview"). Usado en queries para MetricCard/BarChart/LineChart. */
  eventName: string;
  /** Etiqueta legible para el usuario. Por defecto igual a eventName. */
  label: string;
  /** Nombre personalizado elegido por el usuario. Si existe, se usa como título principal. */
  displayName?: string;
  /** Tipo de visualización. */
  chartType: ChartType;
  /** ISO 8601 timestamp del momento en que se añadió al dashboard. */
  addedAt: string;
  /** Orden de posición (0-based, en orden de inserción). Se recalcula al eliminar. */
  position: number;
  /**
   * Lista ordenada de nombres de eventos para FunnelChart (máx. 10).
   * Solo presente cuando chartType === 'FunnelChart'.
   */
  funnelEvents?: string[];
  /**
   * Tipo de agregación para la query de PostHog.
   * - `undefined` → total events (default, `math: 'total'` en la API).
   * - `'dau'` → unique users por día.
   * Solo aplica a MetricCard, BarChart y LineChart (no FunnelChart).
   */
  math?: AggregationMath;
  /**
   * Propiedad del evento para breakdown. Solo aplica a BarChart.
   * Cuando está definida, la API devuelve series desglosadas por valor de propiedad.
   */
  breakdownProperty?: string;
  /**
   * Modo visual del BarChart: 'normal' (serie simple) o 'stacked' (barras apiladas).
   * Solo relevante cuando breakdownProperty está definida. Default: 'stacked'.
   */
  barChartMode?: BarChartMode;
  /**
   * Modo visual del LineChart: 'line' (línea simple) o 'cumulative' (acumulada).
   * Solo relevante para chartType === 'LineChart'. Default: 'line'.
   */
  lineChartMode?: LineChartMode;
}

// ─── BarChartMode ─────────────────────────────────────────────────────────────

/** Modo de visualización para BarChart: normal (serie simple) o stacked (barras apiladas por breakdown). */
export type BarChartMode = 'normal' | 'stacked';

/** Modo de visualización para LineChart: línea simple o acumulada. */
export type LineChartMode = 'line' | 'cumulative';

// ─── AggregationMath ──────────────────────────────────────────────────────────

/** Valores válidos para el campo `math` de PostHog TrendsQuery series. */
export type AggregationMath = 'dau';

// ─── BreakdownSeries ──────────────────────────────────────────────────────────

/** Un segmento del breakdown: datos para un valor específico de la propiedad. */
export interface BreakdownSeriesItem {
  /** Valor de la propiedad (ej. "Chrome", "Safari"). */
  breakdownValue: string;
  /** Array de puntos de datos ordenados cronológicamente. */
  dataPoints: TimeSeriesDataPoint[];
  /** Suma total de conteos para este valor. */
  total: number;
}

/** Serie temporal desglosada por valores de una propiedad. */
export interface BreakdownSeries {
  /** Segmentos del breakdown, ordenados por total desc. Top 5 + "Otros". */
  items: BreakdownSeriesItem[];
  /** ISO 8601 timestamp del último refresco exitoso. */
  lastRefreshedAt: string;
}

// ─── PostHogProperty ──────────────────────────────────────────────────────────

/** Definición de una propiedad de evento. Resultado de GET /property_definitions/. */
export interface PostHogProperty {
  /** Nombre interno de la propiedad (ej. "$browser"). */
  name: string;
  /** Tipo de la propiedad (ej. "String", "Numeric"). */
  propertyType: string;
}

// ─── PostHogEvent ─────────────────────────────────────────────────────────────

/** Tipo de evento registrado en el proyecto PostHog. Resultado de GET /event_definitions/. */
export interface PostHogEvent {
  /** Nombre interno del evento. Es el identificador usado en queries. */
  name: string;
  /** Volumen de ocurrencias en los últimos 30 días. Null si no hay datos. */
  volume30Day: number | null;
}

// ─── MetricValue ─────────────────────────────────────────────────────────────

/** Valor numérico de una métrica para un período. Vive en el cache de TanStack Query. */
export interface MetricValue {
  /** Conteo total de eventos en el período. */
  count: number;
  /** ISO 8601 timestamp del último refresco exitoso desde la API. */
  lastRefreshedAt: string;
}

// ─── PostHogProjectInfo ───────────────────────────────────────────────────────

/** Información básica del proyecto PostHog. Persiste en AsyncStorage. */
export interface PostHogProjectInfo {
  /** ID numérico del proyecto. Requerido en todas las llamadas a la API. */
  id: number;
  /** Nombre del proyecto. Útil para mostrar en Settings. */
  name: string;
  /** Región cloud del proyecto/autenticación. */
  cloudRegion: PostHogCloud;
  /** URL de la instancia self-hosted. Solo presente cuando cloudRegion es 'self-hosted'. */
  selfHostedUrl?: string;
}

// ─── DashboardConfig ─────────────────────────────────────────────────────────

/** Array de DashboardMetric serializado en AsyncStorage bajo DASHBOARD_METRICS_CONFIG_KEY. */
export type DashboardConfig = DashboardMetric[];
