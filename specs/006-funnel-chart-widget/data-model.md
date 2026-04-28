# Data Model: Funnel Chart Widget

**Branch**: `006-funnel-chart-widget` | **Phase**: 1 | **Date**: 2026-03-19  
**Depends on**: `specs/005-chart-widgets/data-model.md`, `specs/003-metrics-dashboard/data-model.md`

---

## Cambios y Extensiones al Data Model Existente

### ChartType *(extensión de spec 005)*

```typescript
// Antes (spec 005):
type ChartType = 'MetricCard' | 'BarChart' | 'LineChart';

// Después (spec 006):
type ChartType = 'MetricCard' | 'BarChart' | 'LineChart' | 'FunnelChart';
```

**Impacto**:
- `DashboardMetric.chartType` acepta ahora `'FunnelChart'`.
- Los widgets existentes (MetricCard, BarChart, LineChart) no se ven afectados.
- El nuevo valor persiste en `DASHBOARD_METRICS_CONFIG` (AsyncStorage) — JSON forward-compatible.

---

### DashboardMetric *(extensión de spec 003)*

Campo nuevo opcional añadido:

```typescript
interface DashboardMetric {
  // Campos existentes (sin cambios):
  id: string;
  eventName: string;        // Para FunnelChart: nombre del evento del primer paso
  label: string;
  chartType: ChartType;
  addedAt: string;
  position: number;

  // Campo nuevo (solo presente cuando chartType === 'FunnelChart'):
  funnelEvents?: string[];  // Lista ordenada de nombres de eventos (2–10 elementos)
}
```

**Notas**:
- `funnelEvents` es `undefined` para todos los chartTypes distintos de `'FunnelChart'`.
- Para `FunnelChart`, `eventName` refleja el primer elemento de `funnelEvents` (usa el mismo campo para compatibilidad con funciones de remove/order existentes).
- La serialización en AsyncStorage es transparente — JSON.stringify/parse preserva el array.
- No hay migración necesaria: los datos existentes sin `funnelEvents` son válidos (optional field).

---

## Nuevas Entidades

### FunnelStep

Un paso del resultado de un funnel insight retornado por la PostHog Query API.

```typescript
interface FunnelStep {
  /** Nombre del evento PostHog (ej. "signup", "$pageview"). */
  name: string;
  /** Número de usuarios/sesiones que completaron este paso del funnel. Siempre >= 0. */
  count: number;
  /** Índice del paso dentro del funnel (0-based, en orden de conversión). */
  order: number;
}
```

**Notas**:
- Se mapea directamente desde cada objeto en `results[0][]` del endpoint `FunnelsQuery`.
- `order` es el índice del paso tal como lo define PostHog (0-based).
- `count` puede ser 0 si ningún usuario llegó a ese paso.

---

### FunnelResult

Resultado cacheable de un insight de tipo Funnel. Equivale a `MetricValue` / `MetricSeries` pero para funnels.

```typescript
interface FunnelResult {
  /** Pasos del funnel ordenados por `order` ascendente. Mínimo 2, máximo 10. */
  steps: FunnelStep[];
  /** ISO 8601 timestamp del último refresco exitoso desde la API. */
  lastRefreshedAt: string;
}
```

**Notas**:
- Vive en el cache de TanStack Query bajo la key `['funnel', cloudRegion, metricId, timeFilter]`.
- Se persiste en AsyncStorage vía `PersistQueryClientProvider` (gcTime: 24h).
- `steps` puede estar vacío (`[]`) si el período seleccionado no tiene datos — el componente muestra estado vacío.
- Si la API devuelve `results[0]` como `undefined`, se normaliza a `[]` en `queryFunnelInsight`.

---

## Reglas de Validación

| Campo | Regla |
|---|---|
| `DashboardMetric.funnelEvents` | Si presente: array de 2 a 10 strings no vacíos |
| `DashboardMetric.funnelEvents[i]` | Nombre de evento válido del catálogo del proyecto PostHog |
| `FunnelStep.count` | `number >= 0` |
| `FunnelStep.order` | `number >= 0`, sin huecos, refleja el índice en `funnelEvents` |
| `FunnelResult.steps` | Array; puede estar vacío; si no vacío, ordenado por `.order` ASC |

---

## Diagrama de Relaciones

```
DashboardMetric
  └── chartType: 'FunnelChart'
  └── funnelEvents: string[]  (2–10 event names)
        │
        ▼
   useFunnelInsight(metricId, funnelEvents, timeFilter)
        │
        ▼  TanStack Query cache ['funnel', cloudRegion, metricId, timeFilter]
   FunnelResult
     └── steps: FunnelStep[]
           └── { name, count, order }
```

---

## Consideraciones de Persistencia

| Entidad | Almacén | TTL | Clave |
|---|---|---|---|
| `DashboardMetric` (con `funnelEvents`) | AsyncStorage | Permanente hasta eliminar | `DASHBOARD_METRICS_CONFIG` |
| `FunnelResult` | AsyncStorage (via React Query persist) | 24h (gcTime) | `['funnel', cloudRegion, metricId, timeFilter]` |
