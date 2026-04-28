# Data Model: Dashboard de Métricas PostHog

**Branch**: `003-metrics-dashboard` | **Phase**: 1 | **Date**: 2026-03-18

---

## Entidades

### TimeFilter

Representa el período de tiempo seleccionado activamente en el dashboard.

```typescript
type TimeFilter =
  | 'today'
  | 'yesterday'
  | '7d'
  | '15d'
  | '30d'
  | '90d'
  | '180d'
  | 'all';

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  '7d': '7 días',
  '15d': '15 días',
  '30d': '30 días',
  '90d': '90 días',
  '180d': '180 días',
  all: 'Histórico',
};
```

**Notas**:
- `all` = consultar desde el inicio del proyecto (PostHog acepta `"date_from": "all"`).
- El filtro activo se mantiene en estado local del componente `DashboardScreen`. No persiste entre sesiones (el default al abrir la app es `'7d'`).

---

### PostHogEvent

Representa un tipo de evento registrado en el proyecto PostHog. Se obtiene de `GET /api/projects/{id}/event_definitions/`.

```typescript
interface PostHogEvent {
  /** Nombre interno del evento. Es el identificador usado en queries. */
  name: string;
  /** Volumen de ocurrencias en los últimos 30 días. Null si no hay datos. */
  volume30Day: number | null;
}
```

**Notas**:
- `name` es el identificador único que usamos en queries (ej. `"$pageview"`, `"button_clicked"`).
- Los eventos del sistema de PostHog comienzan con `$` (ej. `$pageview`, `$identify`, `$autocapture`).
- Se mapea desde `{ id, name, volume_30_day }` de la API — el `id` de la API no es necesario internamente.

---

### ChartType

Tipo de visualización para una métrica del dashboard. Solo `MetricCard` está disponible en esta versión.

```typescript
type ChartType = 'MetricCard';

// Extensión futura (no implementada en esta versión):
// type ChartType = 'MetricCard' | 'LineChart' | 'BarChart' | 'FunnelChart';
```

---

### DashboardMetric

Representa una métrica configurada por el usuario en su dashboard. Es la unidad de configuración persistida.

```typescript
interface DashboardMetric {
  /** UUID generado localmente al añadir la métrica. Inmutable. */
  id: string;
  /** Nombre del evento PostHog (ej. "$pageview"). Usado en queries. */
  eventName: string;
  /** Etiqueta legible para el usuario. Por defecto igual a eventName. */
  label: string;
  /** Tipo de visualización. */
  chartType: ChartType;
  /** ISO 8601 timestamp del momento en que se añadió al dashboard. */
  addedAt: string;
  /** Orden de posición (0-based, en orden de inserción). */
  position: number;
}
```

**Invariantes**:
- `id` es único dentro del dashboard. Se genera con `crypto.randomUUID()` o `Date.now().toString(36)` al añadir.
- `position` refleja el índice en el array persisted. Se recalcula automáticamente al eliminar.
- `label` predeterminado es `eventName`; en futuras versiones el usuario podrá editarlo.

---

### MetricValue

Representa el valor numérico de una métrica para un período específico. **No se persiste directamente** — es el payload de la response de PostHog que TanStack Query cachea.

```typescript
interface MetricValue {
  /** Conteo total de eventos en el período. */
  count: number;
  /** ISO 8601 timestamp del último refresco exitoso desde la API. */
  lastRefreshedAt: string;
}
```

**Notas**:
- `MetricValue` vive en el cache de TanStack Query bajo `queryKey: ['metric', metricId, timeFilter]`.
- TanStack Query + `PersistQueryClientProvider` + `AsyncStoragePersister` persisten este cache en `AsyncStorage` bajo la clave `POSTHOG_REACT_QUERY_CACHE` (ya configurado en la app).
- `staleTime: Infinity` — nunca se considera stale automáticamente.
- `gcTime: 24h` — se elimina del cache si no se usa por 24 horas.

---

### DashboardConfig

Array de `DashboardMetric` serializado como JSON en `AsyncStorage`. No tiene una clase/interfaz propia — es el tipo del valor almacenado.

```typescript
// Tipo conceptual del valor almacenado en AsyncStorage:
// key: 'DASHBOARD_METRICS_CONFIG'
// value: JSON.stringify(DashboardMetric[])

// Tipo en React (estado reactivo):
type DashboardConfig = DashboardMetric[];
```

---

### PostHogProjectInfo

Información básica del proyecto PostHog del usuario. Persiste en `AsyncStorage`.

```typescript
interface PostHogProjectInfo {
  /** ID numérico del proyecto. Usado en todas las llamadas a la API. */
  id: number;
  /** Nombre del proyecto. Útil para mostrar en Settings. */
  name: string;
}
```

**Notas**:
- Se obtiene durante el flujo de validate-and-store de la API Key (ampliación de `useAuth`).
- Persiste en `AsyncStorage` bajo la clave `POSTHOG_PROJECT_INFO`.
- No es un secreto. No se almacena en `SecureStore`.

---

## Storage Schema

| Clave AsyncStorage | Tipo | Descripción |
|---|---|---|
| `DASHBOARD_METRICS_CONFIG` | `DashboardMetric[]` (JSON) | Configuración de métricas del dashboard |
| `POSTHOG_PROJECT_INFO` | `PostHogProjectInfo` (JSON) | Info del proyecto PostHog activo |
| `POSTHOG_REACT_QUERY_CACHE` | React Query cache | Cache de datos de la API (TanStack Query) |

| Clave SecureStore | Tipo | Descripción |
|---|---|---|
| `POSTHOG_API_KEY` | `string` | API Key del usuario (ya existente) |

---

## Reglas de Validación

| Entidad | Campo | Regla |
|---|---|---|
| `DashboardMetric` | `eventName` | No puede ser vacío; debe ser un string del listado de eventos |
| `DashboardMetric` | `chartType` | Solo `"MetricCard"` es válido en esta versión |
| `DashboardMetric` | `id` | Único en el array. Nunca null/undefined |
| `PostHogEvent` | `name` | No puede ser vacío |
| `MetricValue` | `count` | Número entero ≥ 0 |

---

## Transformaciones API → Modelo

### `GET /api/projects/` → `PostHogProjectInfo`
```typescript
// Response: { results: [{ id: number, name: string, ... }] }
const project: PostHogProjectInfo = {
  id: results[0].id,
  name: results[0].name,
};
```

### `GET /api/projects/{id}/event_definitions/` → `PostHogEvent[]`
```typescript
// Response: { results: [{ id, name, volume_30_day }] }
const events: PostHogEvent[] = results.map(e => ({
  name: e.name,
  volume30Day: e.volume_30_day ?? null,
}));
```

### `POST /api/projects/{id}/query/` → `MetricValue`
```typescript
// Response: { results: [{ aggregated_value: number }], last_refresh: string }
const value: MetricValue = {
  count: response.results[0]?.aggregated_value ?? 0,
  lastRefreshedAt: response.last_refresh ?? new Date().toISOString(),
};
```
