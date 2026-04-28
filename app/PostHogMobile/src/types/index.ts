// ─── API Key feature types ───────────────────────────────────────────────────

export type PostHogCloud = 'us' | 'eu' | 'self-hosted';

export type ApiKeyErrorCode =
  | 'EMPTY'
  | 'INVALID_FORMAT'
  | 'INVALID_KEY'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'SECURE_STORE_UNAVAILABLE'
  | 'INVALID_URL'
  | 'INSTANCE_UNREACHABLE'
  | 'NOT_POSTHOG_INSTANCE';

export interface ApiKeyError {
  code: ApiKeyErrorCode;
  /** Mensaje legible para el usuario (sin detalles técnicos internos). */
  message: string;
}

export interface ApiKeyState {
  /** true si existe una clave almacenada en SecureStore. */
  hasApiKey: boolean;
  /** Clave enmascarada para display (ej: "phx_AbCd...xYzW"). null si no hay clave. */
  maskedValue: string | null;
  /** Región cloud activa persistida junto con la clave. */
  cloudRegion: PostHogCloud;
  /** URL de la instancia self-hosted. null cuando cloudRegion es 'us' o 'eu'. */
  selfHostedUrl: string | null;
  /** true durante operaciones async (load inicial, validate, delete). */
  isLoading: boolean;
  /** Error del último intento fallido. null si no hay error. */
  error: ApiKeyError | null;
}

// ─── Dashboard feature types ──────────────────────────────────────────────────

export type { TimeFilter, ChartType, ChartInterval, DashboardMetric, PostHogEvent, MetricValue, MetricSeries, TimeSeriesDataPoint, PostHogProjectInfo, DashboardConfig, FunnelStep, FunnelResult, AggregationMath, BarChartMode, LineChartMode, BreakdownSeriesItem, BreakdownSeries, PostHogProperty } from './dashboard';
