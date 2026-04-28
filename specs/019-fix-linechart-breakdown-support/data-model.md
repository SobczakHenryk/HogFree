# Data Model: Soporte Completo de Breakdown en LineChart

**Feature**: `019-fix-linechart-breakdown-support`  
**Date**: 2026-04-28

---

## No hay cambios en el modelo de datos

Esta feature corrige bugs de UI y lógica de rendering. El modelo de datos ya es correcto:

### `DashboardMetric` (existente, sin cambios)

```ts
export interface DashboardMetric {
  id: string;
  eventName: string;
  label: string;
  displayName?: string;
  chartType: ChartType;
  addedAt: string;
  position: number;
  funnelEvents?: string[];
  math?: AggregationMath;
  breakdownProperty?: string;   // ✅ Ya existe — aplica a BarChart Y LineChart
  barChartMode?: BarChartMode;  // Solo aplica a BarChart
  lineChartMode?: LineChartMode; // ✅ Ya existe — aplica a LineChart
}
```

**`breakdownProperty` ya puede persistirse para LineChart** vía `AddMetricSheet` (paso `lineChartConfig`). El bug no estaba en el almacenamiento, sino en la lectura en `chart-detail.tsx` y en la falta de UI de edición en `edit-chart.tsx`.

---

## Cambios de Contrato de Componentes Internos

### `LineChartDetail` (componente interno de `chart-detail.tsx`)

**Antes**:
```ts
{ metricId: string; eventName: string; math?: string; timeFilter: TimeFilter }
```

**Después**:
```ts
{
  metricId: string;
  eventName: string;
  math?: string;
  timeFilter: TimeFilter;
  breakdownProperty?: string;   // NUEVO
  lineChartMode?: LineChartMode; // NUEVO
}
```

---

## Tipos Reutilizados Sin Modificación

| Tipo | Uso |
|------|-----|
| `BreakdownSeries` | Retorno de `useBreakdownSeries` — ya usado por `LineChartWidget` |
| `BreakdownSeriesItem` | Items individuales por valor de propiedad |
| `LineChartMode` | `'line' | 'cumulative'` — ya definido en `types/dashboard.ts` |
| `BREAKDOWN_COLORS` | Array de 5 colores — ya definido en `constants/index.ts` |
| `BREAKDOWN_OTHER_COLOR` | Color para "Otros" — ya definido en `constants/index.ts` |
