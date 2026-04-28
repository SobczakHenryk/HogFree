# Contrato: Componente `LineChartDetail`

**Archivo**: `app/PostHogMobile/src/app/chart-detail.tsx`  
**Tipo**: Componente React interno (no exportado)  
**Feature**: `019-fix-linechart-breakdown-support`

---

## Props

```ts
interface LineChartDetailProps {
  metricId: string;
  eventName: string;
  math?: string;
  timeFilter: TimeFilter;
  breakdownProperty?: string;    // NUEVO — undefined = modo normal
  lineChartMode?: LineChartMode; // NUEVO — 'line' | 'cumulative'; undefined = 'line'
}
```

## Comportamiento por modo

### Modo Normal (`breakdownProperty === undefined`)

- Llama a `useMetricSeries(metricId, eventName, timeFilter, math)`.
- Renderiza `<LineChart data={singleLineData} ...>` con `areaChart`.
- Tooltip pointer muestra fecha + valor total.
- **Sin cambios respecto al comportamiento actual.**

### Modo Breakdown (`breakdownProperty !== undefined`)

- Llama a `useBreakdownSeries(metricId, eventName, timeFilter, breakdownProperty, math)`.
- Construye `dataSet: Array<{ data, color, curved, hideDataPoints }>` — una entrada por item de breakdown.
- Si `lineChartMode === 'cumulative'`, acumula los valores de cada serie.
- Renderiza `<LineChart dataSet={dataSet} ...>`.
- Muestra leyenda de colores debajo del chart.
- Tooltip pointer muestra fecha + todos los valores de las series.

## Invariantes

- Siempre muestra skeleton mientras carga.
- Siempre muestra "Sin datos para este período" cuando `items.length === 0`.
- Siempre muestra error cuando la query falla y no hay datos en caché.
- Las props de visualización del chart (`height`, `spacing`, `noOfSections`, etc.) no cambian entre modos.

## Call Site (chart-detail.tsx)

```tsx
{metric.chartType === 'LineChart' && (
  <LineChartDetail
    metricId={metric.id}
    eventName={metric.eventName}
    math={metric.math}
    timeFilter={timeFilter}
    breakdownProperty={metric.breakdownProperty}
    lineChartMode={metric.lineChartMode}
  />
)}
```
