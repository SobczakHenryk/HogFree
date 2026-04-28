# Contract: Dashboard Local Storage

**Branch**: `003-metrics-dashboard` | **Phase**: 1 | **Date**: 2026-03-18

Define el esquema de almacenamiento local del dashboard. Usa `AsyncStorage` para config y valores de métricas (via TanStack Query), y `SecureStore` para la API Key (ya existente).

---

## AsyncStorage — Clave: `DASHBOARD_METRICS_CONFIG`

Almacena la configuración de métricas que el usuario ha añadido al dashboard.

**Tipo**: `string` (JSON serializado de `DashboardMetric[]`)

**Esquema JSON**:
```json
[
  {
    "id": "m_1a2b3c4d",
    "eventName": "$pageview",
    "label": "$pageview",
    "chartType": "MetricCard",
    "addedAt": "2026-03-18T10:00:00.000Z",
    "position": 0
  },
  {
    "id": "m_5e6f7g8h",
    "eventName": "button_clicked",
    "label": "button_clicked",
    "chartType": "MetricCard",
    "addedAt": "2026-03-18T10:05:00.000Z",
    "position": 1
  }
]
```

**Invariantes**:
- El array puede estar vacío (`[]`) — es el estado inicial válido.
- `id` es único dentro del array. Generado con `Date.now().toString(36) + Math.random().toString(36).slice(2)`.
- `position` es igual al índice del elemento en el array. Se recalcula al eliminar (`array.filter().map((m, i) => ({...m, position: i}))`).
- `chartType` actualmente solo acepta `"MetricCard"`.

**Operaciones de escritura**:

| Operación | Descripción |
|---|---|
| Inicializar | `[]` si la clave no existe |
| Añadir métrica | `[...existing, newMetric]` — la nueva siempre al final |
| Eliminar métrica | `existing.filter(m => m.id !== id).map((m, i) => ({...m, position: i}))` |

**Hook responsable**: `useDashboardConfig`

---

## AsyncStorage — Clave: `POSTHOG_PROJECT_INFO`

Almacena la información del proyecto PostHog activo del usuario.

**Tipo**: `string` (JSON serializado de `PostHogProjectInfo`)

**Esquema JSON**:
```json
{
  "id": 12345,
  "name": "My App"
}
```

**Invariantes**:
- Se escribe durante el flujo de validación de API Key (ampliación de `useAuth`).
- Se lee al montar `DashboardScreen` y en cualquier hook que requiera `project_id`.
- Si la clave no existe (usuario nuevo o reinsataló la app), el flujo de API Key la recreará antes de navegar al dashboard.

**Hook responsable**: `useAuth` (ampliado) + `useProjectInfo` (hook de lectura)

---

## AsyncStorage — Clave: `POSTHOG_REACT_QUERY_CACHE`

Cache de TanStack Query persistido por `PersistQueryClientProvider` + `createAsyncStoragePersister`.

**Tipo**: JSON interno de TanStack Query (no manipular directamente)

**Queries incluidas en el cache**:

| Query Key Pattern | Descripción | staleTime | gcTime |
|---|---|---|---|
| `['metric', metricId, timeFilter]` | Valor numérico de una métrica en un período | `Infinity` | 24h |
| `['event_definitions', projectId]` | Lista de tipos de evento del proyecto | 5 min | 30 min |

**Notas**:
- Esta clave es gestionada exclusivamente por TanStack Query. No leer/escribir manualmente.
- El cache se serializa automáticamente cuando la app va a background y se restaura al relanzar.
- `gcTime: 24h` significa que los datos de métricas persisten hasta 24h sin necesidad de conexión.

---

## SecureStore — Clave: `POSTHOG_API_KEY` (existente)

API Key del usuario. Gestionada por `useAuth`. No se modifica en esta feature.

```
Tipo: string
Ejemplo: "phc_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcd"
```

---

## Resumen de constantes de almacenamiento

```typescript
// src/constants/index.ts (ampliar las existentes)
export const DASHBOARD_METRICS_CONFIG_KEY = 'DASHBOARD_METRICS_CONFIG';
export const POSTHOG_PROJECT_INFO_KEY = 'POSTHOG_PROJECT_INFO';

// Ya existente:
export const SECURE_STORE_KEY = 'POSTHOG_API_KEY';
// Ya configurado en QueryClient:
// REACT_QUERY_PERSISTER_KEY = 'POSTHOG_REACT_QUERY_CACHE'
```
