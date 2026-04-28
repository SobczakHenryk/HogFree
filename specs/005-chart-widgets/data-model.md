# Data Model: Chart Widgets — BarChartWidget y LineChartWidget

**Branch**: `005-chart-widgets` | **Phase**: 1 | **Date**: 2026-03-18  
**Depends on**: `specs/003-metrics-dashboard/data-model.md`

---

## Cambios y Extensiones al Data Model Existente

### ChartType *(extensión de spec 003)*

El tipo `ChartType` pasa de tener un único valor a tres valores posibles:

```typescript
// Antes (spec 003):
type ChartType = 'MetricCard';

// Después (spec 005):
type ChartType = 'MetricCard' | 'BarChart' | 'LineChart';
```

**Impacto**:
- `DashboardMetric.chartType` acepta ahora `'BarChart'` y `'LineChart'`.
- La regla de validación en `data-model.md` de spec 003 se actualiza: `chartType` acepta los tres valores.
- El dato persiste en `DASHBOARD_METRICS_CONFIG` (AsyncStorage) sin migración — JSON forward-compatible.

---

## Nuevas Entidades

### ChartInterval

Granularidad del eje X según el período de tiempo activo. Mapea `TimeFilter` → parámetro `interval` de la API de PostHog.

```typescript
type ChartInterval = 'day' | 'week' | 'month';

const TIME_FILTER_TO_INTERVAL: Record<TimeFilter, ChartInterval> = {
  today:     'day',
  yesterday: 'day',
  '7d':      'day',
  '15d':     'day',
  '30d':     'day',
  '90d':     'week',
  '180d':    'week',
  all:       'month',
};
```

**Notas**:
- Este mapeo se define como constante en `src/constants/index.ts`.
- Solo es relevante para `BarChart` y `LineChart`; `MetricCard` no lo usa.

---

### TimeSeriesDataPoint

Un punto de datos en la serie temporal retornada por PostHog.

```typescript
interface TimeSeriesDataPoint {
  /** Fecha del intervalo. Formato: 'YYYY-MM-DD' (ISO 8601, fecha solamente). */
  date: string;
  /** Conteo de eventos en ese intervalo. Siempre >= 0. */
  count: number;
}
```

**Notas**:
- Se mapea desde `result[0].data[]` y `result[0].labels[]` del endpoint `/api/projects/{id}/insights/trend/`.
- Los intervalos sin eventos se incluyen con `count: 0` (PostHog los rellena automáticamente).

---

### MetricSeries

Resultado en caché para un widget de gráfico. Equivalente a `MetricValue` para las MetricCard, pero para series de tiempo.

```typescript
interface MetricSeries {
  /** Array de puntos de datos ordenados cronológicamente. */
  dataPoints: TimeSeriesDataPoint[];
  /** Suma total de todos los conteos en el período. Útil para el subtítulo del widget. */
  total: number;
  /** ISO 8601 timestamp del último refresco exitoso desde la API. */
  lastRefreshedAt: string;
}
```

**Notas**:
- `total` = `dataPoints.reduce((sum, p) => sum + p.count, 0)`. Se calcula al mapear la respuesta de la API, no se consulta a la API por separado.
- `MetricSeries` vive en el caché de TanStack Query bajo `queryKey: ['metric_series', metricId, timeFilter]`.
- `staleTime: Infinity` — mismo comportamiento que `MetricValue`.
- `gcTime: 24h` — mismo comportamiento que `MetricValue`.

---

## Storage Schema *(actualización)*

Los cambios son **aditivos** — no se modifica ni migra el esquema existente de spec 003.

| Clave AsyncStorage | Tipo | Descripción |
|---|---|---|
| `DASHBOARD_METRICS_CONFIG` | `DashboardMetric[]` (JSON) | Ahora acepta `chartType: 'BarChart'` y `'LineChart'` además de `'MetricCard'` |
| `POSTHOG_PROJECT_INFO` | `PostHogProjectInfo` (JSON) | Sin cambios |
| `POSTHOG_REACT_QUERY_CACHE` | React Query cache | Ahora incluye también entradas bajo `['metric_series', ...]` |

| Clave SecureStore | Tipo | Descripción |
|---|---|---|
| `POSTHOG_API_KEY` | `string` | Sin cambios |

---

## Query Keys

| Hook | `queryKey` | Datos | `staleTime` | `gcTime` |
|---|---|---|---|---|
| `useMetricValue` (spec 003) | `['metric', metricId, timeFilter]` | `MetricValue` | `Infinity` | `24h` |
| `useMetricSeries` (nuevo) | `['metric_series', metricId, timeFilter]` | `MetricSeries` | `Infinity` | `24h` |

---

## Transformaciones API → Modelo

### `POST /api/projects/{id}/insights/trend/` → `MetricSeries`

```typescript
// Request body (simplificado):
// { events: [{ id: eventName, type: 'events' }], interval: 'day'|'week'|'month', date_from, date_to }

// Response (simplificado):
// { result: [{ data: number[], labels: string[], count: number }] }

const series: MetricSeries = {
  dataPoints: result[0].labels.map((label, i) => ({
    date: label,      // Formato 'YYYY-MM-DD' o similar según intervalo
    count: result[0].data[i],
  })),
  total: result[0].count,
  lastRefreshedAt: new Date().toISOString(),
};
```

**Notas**:
- `result[0]` es el único elemento cuando se consulta un solo evento.
- `labels` contiene las fechas de inicio de cada intervalo; `data` contiene el conteo correspondiente.
- `count` en la raíz del objeto es la suma total del período — se usa directamente para `MetricSeries.total`.
- Si `result` es un array vacío (evento no encontrado en el período), se retorna `{ dataPoints: [], total: 0, lastRefreshedAt: now }`.

---

## Reglas de Validación *(actualización)*

| Entidad | Campo | Regla |
|---|---|---|
| `DashboardMetric` | `chartType` | Valores válidos: `'MetricCard'`, `'BarChart'`, `'LineChart'` |
| `TimeSeriesDataPoint` | `count` | Número entero ≥ 0 |
| `TimeSeriesDataPoint` | `date` | String no vacío en formato de fecha reconocible |
| `MetricSeries` | `dataPoints` | Array (puede ser vacío — representa ausencia de datos) |
| `MetricSeries` | `total` | Número entero ≥ 0 |
