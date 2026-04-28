# Implementation Plan: Bar Chart Breakdown & Stacked Mode

**Spec**: `specs/009-bar-chart-breakdown/spec.md`  
**Created**: 2026-03-19

---

## Architecture Overview

El feature extiende la funcionalidad del BarChart existente con dos capacidades:
1. **Breakdown por propiedad**: Consultar la API de PostHog con `breakdownFilter` para obtener series desglosadas por valor de propiedad.
2. **Modo stacked**: Renderizar barras apiladas usando `stackData` de react-native-gifted-charts.

### Flujo de datos

```
edit-chart (selecciona propiedad + modo)
  → DashboardMetric persiste breakdownProperty + barChartMode en AsyncStorage
  → useBreakdownSeries (nuevo hook) envía TrendsQuery con breakdownFilter
  → BarChartWidget / BarChartDetail renderiza stackData o data simple
```

---

## Phase 1 — Data Model & API Layer

### 1.1 Extender `DashboardMetric` (types/dashboard.ts)

Añadir campos opcionales:
- `breakdownProperty?: string` — nombre de la propiedad para breakdown
- `barChartMode?: 'normal' | 'stacked'` — modo visual, default `'stacked'`

### 1.2 Nuevos tipos (types/dashboard.ts)

```typescript
interface BreakdownSeriesItem {
  breakdownValue: string;
  dataPoints: TimeSeriesDataPoint[];
  total: number;
}

interface BreakdownSeries {
  items: BreakdownSeriesItem[];
  lastRefreshedAt: string;
}
```

### 1.3 Nueva función API: `getPropertyDefinitions` (services/posthog-api.ts)

```
GET /api/projects/{projectId}/property_definitions/?event_names={event}&type=event&limit=100
```

Devuelve `PostHogProperty[]` con `name` y `property_type`.

### 1.4 Nueva función API: `queryBreakdownSeries` (services/posthog-api.ts)

Envía TrendsQuery con `breakdownFilter`:
```json
{
  "breakdownFilter": { "breakdown": "$browser", "breakdown_type": "event" }
}
```

Parsea múltiples `results[]` → `BreakdownSeries`.

### 1.5 Actualizar `updateMetric` (hooks/useDashboardConfig.ts)

Extender el tipo `changes` para aceptar `breakdownProperty` y `barChartMode`.

---

## Phase 2 — Hooks

### 2.1 Nuevo hook: `usePropertyDefinitions` (hooks/usePropertyDefinitions.ts)

TanStack Query hook que usa `getPropertyDefinitions`. 
- queryKey: `['property_definitions', cloudRegion, projectId, eventName]`
- `enabled`: solo cuando hay eventName
- `staleTime`: 5 minutos (las propiedades no cambian frecuentemente)

### 2.2 Nuevo hook: `useBreakdownSeries` (hooks/useBreakdownSeries.ts)

TanStack Query hook que usa `queryBreakdownSeries`.
- queryKey: `['breakdown_series', cloudRegion, metricId, timeFilter, math, breakdownProperty]`
- `enabled`: solo cuando hay breakdownProperty
- `staleTime: Infinity` (igual que useMetricSeries)
- Top 5 valores por total, resto agrupado como "Otros"

---

## Phase 3 — Edit Screen Extensions

### 3.1 Sección "Breakdown" en edit-chart.tsx

Visible solo cuando `chartType === 'BarChart'` y hay un evento seleccionado:
- Muestra la propiedad actual seleccionada (o "Sin breakdown")
- Pressable que abre un modal con la lista de propiedades (igual que el event picker)
- Opción "Sin breakdown" al inicio de la lista para desactivar

### 3.2 Selector de modo "Normal / Stacked"

Visible solo cuando hay `breakdownProperty` seleccionada:
- Dos botones tipo toggle (igual que el selector de agregación)
- "Normal" = muestra solo serie total
- "Stacked" = muestra barras apiladas

### 3.3 Actualizar `handleSave` 

Incluir `breakdownProperty` y `barChartMode` en los cambios enviados a `updateMetric`.
Invalidar queries de breakdown cuando cambia la propiedad.

---

## Phase 4 — Chart Rendering

### 4.1 Constantes: paleta de colores (constants/index.ts)

```typescript
export const BREAKDOWN_COLORS = ['#7B61FF', '#4ECDC4', '#FF6B6B', '#45B7D1', '#FFA07A'];
export const BREAKDOWN_OTHER_COLOR = '#888888';
```

### 4.2 Actualizar `BarChartWidget` (components/BarChartWidget.tsx)

- Si hay `breakdownProperty` y modo `'stacked'`: usar `useBreakdownSeries` y renderizar `stackData`
- Si no hay breakdown o modo `'normal'`: comportamiento actual con `useMetricSeries`
- Mostrar leyenda debajo del chart cuando hay breakdown activo

### 4.3 Actualizar `BarChartDetail` (app/chart-detail.tsx)

- Si hay breakdown + stacked: renderizar `stackData` con tamaño expandido
- Tooltip: al tocar una barra apilada, mostrar desglose de cada valor
- Si no hay breakdown: comportamiento actual

### 4.4 Componente `BreakdownLegend` (inline o componente)

Leyenda horizontal con bolitas de color + nombre de cada valor de breakdown.

---

## Phase 5 — Integration & Edge Cases

### 5.1 AddMetricSheet — no requiere cambios

El breakdown se configura después de crear la métrica, desde edit-chart.

### 5.2 Cache invalidation

Cuando cambia `breakdownProperty`:
- Invalidar queries `['breakdown_series', ...]` del metric
- No afecta `['metric_series', ...]` (sigue siendo la serie simple)

### 5.3 Edge cases

- Propiedad sin valores → mostrar chart vacío con mensaje
- Evento sin propiedades → mostrar "Este evento no tiene propiedades" en el picker
- Cambiar de evento → resetear `breakdownProperty` a undefined

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| API de property_definitions devuelve demasiadas propiedades | Limitar a 100 + búsqueda con filtro |
| Breakdown devuelve demasiados valores | Top 5 + agrupar en "Otros" |
| `stackData` de gifted-charts no maneja bien muchos stacks | Limitar a 6 colores (5 + otros) |
| Performance con muchas barras apiladas | Mantener límite de datos existente por timeFilter |
