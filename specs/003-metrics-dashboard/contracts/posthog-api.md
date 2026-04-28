# Contract: PostHog API — Dashboard de Métricas

**Branch**: `003-metrics-dashboard` | **Phase**: 1 | **Date**: 2026-03-18

Todos los endpoints usan `Authorization: Bearer <API_KEY>`. Base URL: `https://app.posthog.com`.

---

## Endpoint 1: Listar proyectos

Obtiene los proyectos accesibles con la API Key del usuario. Se llama **una vez** después de la validación de la clave y el resultado se guarda en `AsyncStorage`.

```
GET /api/projects/
Authorization: Bearer <API_KEY>
```

**Parámetros**: ninguno.

**Respuesta exitosa** (`200 OK`):
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 12345,
      "name": "My App",
      "api_token": "phc_..."
    }
  ]
}
```

**Campos utilizados**:
| Campo | Tipo | Uso |
|---|---|---|
| `results[0].id` | `number` | Almacenado como `PostHogProjectInfo.id`; requerido en todas las llamadas posteriores |
| `results[0].name` | `string` | Mostrado en Settings |

**Errores**:
| Status | Causa | Manejo |
|---|---|---|
| `401` | API Key inválida o expirada | Redirigir al flujo de API Key |
| `0` / timeout | Sin conectividad | Error silencioso, mantener project_id de sesión anterior si existe |

**Nota**: si `results` es un array vacío, el usuario no tiene proyectos accesibles con esa clave. Mostrar mensaje informativo.

---

## Endpoint 2: Listar definiciones de eventos

Obtiene los tipos de eventos disponibles en el proyecto. Se llama **cuando el usuario abre el bottom sheet de "Añadir Métrica"**.

```
GET /api/projects/{project_id}/event_definitions/
Authorization: Bearer <API_KEY>
```

**Parámetros de query**:
| Parámetro | Valor | Descripción |
|---|---|---|
| `limit` | `200` | Máximo de resultados por página |
| `ordering` | `-volume_30_day` | Ordenar por volumen descendente (más populares primero) |

**Respuesta exitosa** (`200 OK`):
```json
{
  "count": 45,
  "next": null,
  "results": [
    {
      "id": "uuid-abc-123",
      "name": "$pageview",
      "volume_30_day": 15000
    },
    {
      "id": "uuid-def-456",
      "name": "button_clicked",
      "volume_30_day": 3100
    }
  ]
}
```

**Campos utilizados**:
| Campo | Tipo | Uso |
|---|---|---|
| `results[].name` | `string` | Identificador del evento para queries y label en la tarjeta |
| `results[].volume_30_day` | `number \| null` | Mostrar como subtítulo en la lista de selección para ayudar al usuario |

**Paginación**: si `count > 200`, implementar `GET /api/projects/{id}/event_definitions/?limit=200&offset=200` en carga incremental.

**Cache TanStack Query**:
- `queryKey: ['event_definitions', projectId]`
- `staleTime: 5 * 60 * 1000` (5 min)
- `gcTime: 30 * 60 * 1000` (30 min)

**Errores**:
| Status | Causa | Manejo |
|---|---|---|
| `401` | API Key inválida | Redirigir al flujo de API Key |
| `404` | Project ID incorrecto | Error en el bottom sheet con mensaje informativo |

---

## Endpoint 3: Consultar valor de métrica (MetricCard)

Obtiene el conteo total de un evento en un rango de fechas. Se llama **durante pull-to-refresh** o **cuando el usuario cambia a un período sin cache**.

```
POST /api/projects/{project_id}/query/
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

**Request body**:
```json
{
  "query": {
    "kind": "TrendsQuery",
    "series": [
      {
        "event": "<eventName>",
        "kind": "EventsNode",
        "math": "total"
      }
    ],
    "dateRange": {
      "date_from": "<YYYY-MM-DD o 'all'>",
      "date_to": "<YYYY-MM-DD>"
    },
    "trendsFilter": {
      "display": "BoldNumber"
    }
  }
}
```

**Ejemplo para "Últimos 7 días"** (hoy = 2026-03-18):
```json
{
  "query": {
    "kind": "TrendsQuery",
    "series": [
      { "event": "$pageview", "kind": "EventsNode", "math": "total" }
    ],
    "dateRange": {
      "date_from": "2026-03-11",
      "date_to": "2026-03-18"
    },
    "trendsFilter": { "display": "BoldNumber" }
  }
}
```

**Ejemplo para "Histórico completo"**:
```json
{
  "query": {
    "kind": "TrendsQuery",
    "series": [
      { "event": "$pageview", "kind": "EventsNode", "math": "total" }
    ],
    "dateRange": {
      "date_from": "all",
      "date_to": "2026-03-18"
    },
    "trendsFilter": { "display": "BoldNumber" }
  }
}
```

**Respuesta exitosa** (`200 OK`):
```json
{
  "results": [
    {
      "aggregated_value": 12345,
      "data": [],
      "labels": [],
      "days": []
    }
  ],
  "timings": [],
  "is_cached": false,
  "last_refresh": "2026-03-18T10:30:00Z"
}
```

**Campos utilizados**:
| Campo | Tipo | Uso |
|---|---|---|
| `results[0].aggregated_value` | `number` | Valor mostrado en la MetricCard |
| `last_refresh` | `string \| null` | Timestamp para `MetricValue.lastRefreshedAt` |

**Cache TanStack Query**:
- `queryKey: ['metric', metricId, timeFilter]`
- `staleTime: Infinity` (nunca auto-refresca)
- `gcTime: 24 * 60 * 60 * 1000` (24h)
- Persistido via `PersistQueryClientProvider` en `AsyncStorage`

**Errores**:
| Status | Causa | Manejo |
|---|---|---|
| `401` | API Key inválida | Redirigir al flujo de API Key |
| `400` | Query mal formada | Mostrar "0" con indicador de error en la tarjeta |
| `429` | Rate limit | Reintentar 1 vez después de 2s; mostrar error si falla de nuevo |
| timeout / red | Sin conectividad | Mantener datos del cache anterior; no mostrar error si hay cache |
