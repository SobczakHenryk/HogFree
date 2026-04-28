# Contract: PostHog Funnel Query API

**Feature**: 006-funnel-chart-widget  
**Branch**: `006-funnel-chart-widget`  
**Status**: Implemented  
**Source**: `src/services/posthog-api.ts` → `queryFunnelInsight()`

---

## Overview

Este contrato documenta la función `queryFunnelInsight` que encapsula la llamada al endpoint `POST /api/projects/{id}/query/` de PostHog con `kind: 'FunnelsQuery'`. Es la única interfaz entre los componentes de UI y la API de funnels.

---

## Function Signature

```typescript
function queryFunnelInsight(
  apiKey: string,
  cloudRegion: CloudRegion,
  projectId: string,
  events: string[],
  timeFilter: TimeFilter,
  options?: { signal?: AbortSignal }
): Promise<FunnelResult>
```

### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `apiKey` | `string` | ✅ | API key del proyecto PostHog. Bearer token en header. |
| `cloudRegion` | `CloudRegion` (`'US' \| 'EU'`) | ✅ | Determina el base URL (`us.posthog.com` o `eu.posthog.com`). |
| `projectId` | `string` | ✅ | ID numérico del proyecto PostHog. |
| `events` | `string[]` | ✅ | Lista ordenada de nombres de eventos del funnel. Mínimo 2, máximo 10. |
| `timeFilter` | `TimeFilter` | ✅ | Período de tiempo para el análisis (ej. `'-7d'`, `'-30d'`). |
| `options.signal` | `AbortSignal` | ❌ | Señal de cancelación para abortar la request (TanStack Query la pasa automáticamente). |

### Valor Retornado

```typescript
interface FunnelResult {
  steps: FunnelStep[];       // Pasos del funnel, ordenados por order ASC
  lastRefreshedAt: string;   // ISO 8601 timestamp del momento del fetch
}
```

---

## HTTP Request

### Endpoint

```
POST https://{region}.posthog.com/api/projects/{projectId}/query/
Authorization: Bearer {apiKey}
Content-Type: application/json
```

Donde `{region}` es `us` o `eu` según `cloudRegion`.

### Request Body

```json
{
  "query": {
    "kind": "FunnelsQuery",
    "series": [
      { "kind": "EventsNode", "event": "event_name_0" },
      { "kind": "EventsNode", "event": "event_name_1" }
    ],
    "funnelOrderType": "ordered",
    "funnelVizType": "steps",
    "dateRange": {
      "date_from": "-7d"
    }
  }
}
```

**Notas**:
- `series` se construye dinámicamente: `events.map(event => ({ kind: 'EventsNode', event }))`.
- `funnelOrderType: 'ordered'` — los usuarios deben completar los pasos en orden.
- `funnelVizType: 'steps'` — formato de respuesta de pasos discretos (no tendencia).
- `dateRange.date_from` viene del `timeFilter` (ej. `'-7d'`, `'-30d'`, `'-90d'`).

---

## HTTP Response

### Success (200 OK)

```json
{
  "results": [
    [
      { "name": "signup", "count": 1000, "order": 0, ... },
      { "name": "email_verified", "count": 650, "order": 1, ... },
      { "name": "first_purchase", "count": 120, "order": 2, ... }
    ]
  ],
  "last_refresh": "2026-03-19T10:30:00Z",
  ...
}
```

**Campos utilizados**:
- `results[0]`: Array de pasos del funnel.
- `results[0][i].name`: Nombre del evento.
- `results[0][i].count`: Usuarios que completaron este paso.
- `results[0][i].order`: Índice del paso (0-based).
- `last_refresh`: Timestamp del último cálculo en PostHog (ignorado; se usa `new Date().toISOString()` localmente).

### Mapeo a `FunnelResult`

```typescript
// Implementado en posthog-api.ts
const rawSteps: RawFunnelStep[] = data.results?.[0] ?? [];

return {
  steps: rawSteps.map((s) => ({
    name: s.name,
    count: s.count,
    order: s.order,
  })),
  lastRefreshedAt: new Date().toISOString(),
};
```

---

## Error Handling

| Condición | Comportamiento |
|---|---|
| HTTP 4xx (ej. 401, 403) | `ky` lanza `HTTPError`; TanStack Query marca status `'error'`; widget muestra error state |
| HTTP 5xx | Igual que 4xx |
| `results` es `null` o `undefined` | `rawSteps` normalizado a `[]`; `FunnelResult.steps` = `[]`; widget muestra empty state |
| `events.length < 2` | Hook desactiva la query (`enabled: false`); no se realiza ninguna request |
| AbortSignal activado | `ky` lanza `AbortError`; TanStack Query ignora silenciosamente |
| Sin conexión a internet | `ky` lanza `TypeError`; TanStack Query sirve datos cacheados si existen |

---

## `useFunnelInsight` Hook

El hook que consume este contrato:

```typescript
function useFunnelInsight(
  metricId: string,
  events: string[],
  timeFilter: TimeFilter
): UseQueryResult<FunnelResult>
```

### Query Key

```typescript
['funnel', cloudRegion, metricId, timeFilter]
```

- `cloudRegion` viene de `useAuth()`.
- `metricId` es el `id` del `DashboardMetric` — garantiza cache separado por widget.
- `timeFilter` invalida el cache al cambiar el período de tiempo seleccionado.

### Configuración

```typescript
{
  enabled: !!projectInfo && events.length >= 2,
  staleTime: Infinity,   // No refetch automático en segundo plano
  gcTime: 24 * 60 * 60 * 1000,  // Persiste 24h en AsyncStorage
}
```

---

## Notas de Seguridad

- `apiKey` nunca se expone en logs ni en el query key de TanStack Query.
- La request usa HTTPS exclusivamente (base URLs `https://us.posthog.com`, `https://eu.posthog.com`).
- El `AbortSignal` previene leaks de memoria en desmontajes de componentes.
- `events` deben ser nombres de eventos del proyecto del usuario — no se ejecutan como código.
