# Contract: PostHog API — Chart Widgets (Trends Endpoint)

**Branch**: `005-chart-widgets` | **Phase**: 1 | **Date**: 2026-03-18  
**Depends on**: `specs/003-metrics-dashboard/contracts/posthog-api.md`

Los endpoints de listar proyectos (`GET /api/projects/`) y listar eventos (`GET /api/projects/{id}/event_definitions/`) ya están documentados en spec 003 y no cambian. Este contrato documenta únicamente el endpoint nuevo requerido para obtener series de tiempo.

Todos los endpoints usan `Authorization: Bearer <API_KEY>`. Base URL: `https://app.posthog.com`.

---

## Endpoint: Tendencias de un evento (Time Series)

Obtiene la evolución temporal del conteo de un evento para un rango de fechas y una granularidad (intervalo). Se llama **cuando se monta un `BarChartWidget` o `LineChartWidget`** y no hay datos en caché, o durante el pull-to-refresh.

```
POST /api/projects/{project_id}/insights/trend/
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

### Request Body

```json
{
  "events": [
    {
      "id": "$pageview",
      "type": "events",
      "math": "total"
    }
  ],
  "interval": "day",
  "date_from": "-7d",
  "date_to": null,
  "refresh": false
}
```

**Parámetros del body**:

| Campo | Tipo | Descripción |
|---|---|---|
| `events[0].id` | `string` | Nombre del evento (ej. `"$pageview"`, `"button_clicked"`) |
| `events[0].type` | `"events"` | Siempre fijo a `"events"` |
| `events[0].math` | `"total"` | Siempre `"total"` (conteo de ocurrencias) |
| `interval` | `"day" \| "week" \| "month"` | Granularidad del eje X. Ver mapeo en `data-model.md` |
| `date_from` | `string \| null` | Inicio del rango. Ver tabla de valores por `TimeFilter` |
| `date_to` | `string \| null` | Fin del rango. Siempre `null` (= hoy) excepto `yesterday` |
| `refresh` | `false` | Siempre `false`; el control de refresco lo gestiona TanStack Query |

### Mapeo TimeFilter → date_from / date_to / interval

| `TimeFilter` | `date_from` | `date_to` | `interval` |
|---|---|---|---|
| `today` | `-1d` | `null` | `day` |
| `yesterday` | `-2d` | `-1d` | `day` |
| `7d` | `-7d` | `null` | `day` |
| `15d` | `-15d` | `null` | `day` |
| `30d` | `-30d` | `null` | `day` |
| `90d` | `-90d` | `null` | `week` |
| `180d` | `-180d` | `null` | `week` |
| `all` | `all` | `null` | `month` |

**Nota**: PostHog acepta valores relativos como `"-7d"` directamente en `date_from`. Para `all`, usar la cadena `"all"`.

---

### Respuesta exitosa (`200 OK`)

```json
{
  "result": [
    {
      "count": 8412,
      "data": [1201, 1432, 980, 1100, 1340, 1209, 1150],
      "labels": [
        "2026-03-11",
        "2026-03-12",
        "2026-03-13",
        "2026-03-14",
        "2026-03-15",
        "2026-03-16",
        "2026-03-17"
      ],
      "days": [
        "2026-03-11",
        "2026-03-12",
        "2026-03-13",
        "2026-03-14",
        "2026-03-15",
        "2026-03-16",
        "2026-03-17"
      ]
    }
  ],
  "next": null,
  "timezone": "UTC"
}
```

**Campos utilizados**:

| Campo | Tipo | Uso |
|---|---|---|
| `result[0].data` | `number[]` | Conteos por intervalo → `TimeSeriesDataPoint[].count` |
| `result[0].labels` | `string[]` | Fechas de cada intervalo → `TimeSeriesDataPoint[].date` |
| `result[0].count` | `number` | Suma total del período → `MetricSeries.total` |

**Campos ignorados**: `timezone`, `next`, `days` (duplica `labels`).

---

### Respuesta vacía (evento sin datos)

Si el evento no tiene registros en el período, PostHog puede devolver `result: []` o un objeto con `data: []`:

```json
{ "result": [] }
```

**Manejo**: retornar `MetricSeries` con `dataPoints: []`, `total: 0`, `lastRefreshedAt: now`.

---

### Errores

| Status | Causa | Manejo |
|---|---|---|
| `400` | Parámetros inválidos (ej. `interval` no reconocido) | Log del error; mostrar estado de error en el widget |
| `401` | API Key inválida o expirada | Redirigir al flujo de configuración de API Key |
| `404` | `project_id` no existe o no accesible | Mostrar error en el widget |
| `429` | Rate limit excedido | Mostrar estado de error; TanStack Query reintentará con backoff |
| `0` / timeout | Sin conectividad | Error silencioso; mostrar estado de error en el widget con datos de caché si existen |

---

## Función en `posthog-api.ts`

```typescript
export async function queryMetricSeries(
  apiKey: string,
  projectId: number,
  eventName: string,
  timeFilter: TimeFilter,
): Promise<MetricSeries> {
  const interval = TIME_FILTER_TO_INTERVAL[timeFilter];
  const { dateFrom, dateTo } = TIME_FILTER_TO_DATE_RANGE[timeFilter];

  const response = await ky.post(
    `https://app.posthog.com/api/projects/${projectId}/insights/trend/`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      json: {
        events: [{ id: eventName, type: 'events', math: 'total' }],
        interval,
        date_from: dateFrom,
        date_to: dateTo,
        refresh: false,
      },
    }
  ).json<{ result: Array<{ data: number[]; labels: string[]; count: number }> }>();

  if (!response.result || response.result.length === 0) {
    return { dataPoints: [], total: 0, lastRefreshedAt: new Date().toISOString() };
  }

  const { data, labels, count } = response.result[0];
  return {
    dataPoints: labels.map((date, i) => ({ date, count: data[i] ?? 0 })),
    total: count,
    lastRefreshedAt: new Date().toISOString(),
  };
}
```

**Nota**: `TIME_FILTER_TO_DATE_RANGE` es una constante auxiliar (similar a `TIME_FILTER_TO_INTERVAL`) que mapea el `TimeFilter` a `{ dateFrom: string, dateTo: string | null }` según la tabla de mapeo de este documento.
