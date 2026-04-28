# Research: Soporte Completo de Breakdown en LineChart

**Feature**: `019-fix-linechart-breakdown-support`  
**Date**: 2026-04-28

---

## Hallazgos de Análisis de Código

### BUG-001 — `LineChartDetail` no recibe ni usa breakdown

**Archivo**: `app/PostHogMobile/src/app/chart-detail.tsx`

**Call site actual** (línea 210):
```tsx
<LineChartDetail metricId={metric.id} eventName={metric.eventName} math={metric.math} timeFilter={timeFilter} />
```
Comparar con `BarChartDetail` (línea 213–218) que sí recibe `breakdownProperty` y `barChartMode`.

**Firma actual de `LineChartDetail`**:
```tsx
function LineChartDetail({ metricId, eventName, math, timeFilter }: {
  metricId: string; eventName: string; math?: string; timeFilter: TimeFilter;
})
```
No tiene `breakdownProperty` ni `lineChartMode`. Siempre llama a `useMetricSeries` (una sola serie).

**Decisión**: Ampliar la firma de `LineChartDetail` para aceptar `breakdownProperty?: string` y `lineChartMode?: LineChartMode`. Cuando `breakdownProperty` esté presente, usar `useBreakdownSeries` y renderizar con `dataSet` (múltiples líneas), copiando el patrón de `LineChartWidget.tsx`.

---

### BUG-002 — `edit-chart.tsx` no tiene soporte de breakdown para LineChart

**Archivo**: `app/PostHogMobile/src/app/edit-chart.tsx`

**Puntos de cambio identificados**:

| Línea | Código actual | Problema |
|-------|---------------|---------|
| 22 | `import type { AggregationMath, BarChartMode, PostHogEvent, PostHogProperty }` | Falta `LineChartMode` en el import |
| 82 | `const isBarChart = metric?.chartType === 'BarChart'` | Falta `const isLineChart` |
| 86 | `isBarChart ? eventName : ''` | `usePropertyDefinitions` desactivado para LineChart |
| 97-102 | `hasChanges` solo trackea cambios de BarChart | Cambios de breakdown de LineChart ignorados |
| 132-135 | `handleSave` solo guarda cambios de BarChart | No persiste breakdown de LineChart |
| 299 | `{isBarChart && !isFunnel && (...)}` | Sección Breakdown solo para BarChart |
| 323 | `{isBarChart && breakdownProperty && (...)}` | Selector de modo BarChart solo para BarChart |

**Decisión**: Añadir `isLineChart = metric?.chartType === 'LineChart'` y extender todas las condiciones para incluir `isLineChart`. No añadir selector de modo para LineChart (ese selector ya existe en `AddMetricSheet` y corresponde a `lineChartMode`; la pantalla de edición no lo expone actualmente y está fuera del scope de este bug).

---

## Análisis de Reutilización

### `LineChartWidget.tsx` como referencia exacta

`LineChartWidget` ya implementa correctamente el breakdown:
- Llama a `useBreakdownSeries` cuando `hasBreakdown === true`
- Construye `dataSet` con `items.map(...)` — múltiples series con `color` por índice
- Soporta modo `cumulative` acumulando valores
- Renderiza `<LineChart dataSet={dataSet} ...>` para breakdown, `<LineChart data={singleLineData} ...>` para normal
- Muestra leyenda al final

**Patrón a replicar** en `LineChartDetail`:
```tsx
if (hasBreakdown && breakdownData && breakdownData.items.length > 0) {
  // Construir dataSet con BREAKDOWN_COLORS
  // Renderizar <LineChart dataSet={dataSet} ...> con pointerConfig adaptado
}
```

### `BarChartDetail` como referencia para el tooltip

`BarChartDetail` usa `pointerConfig` con `pointerLabelComponent` que itera sobre los items del breakdown. Para `LineChartDetail` con breakdown, se usará el mismo patrón pero adaptado a la firma de `pointerLabelComponent` de `LineChart` (recibe `items[]` con los valores de cada serie en la posición tocada).

---

## Decisiones Técnicas

| Tema | Decisión | Rationale |
|------|----------|-----------|
| Estructura del tooltip en LineChart con breakdown | Usar `pointerLabelComponent` que recibe `items[]` — cada item corresponde a una serie | `react-native-gifted-charts` con `dataSet` pasa todos los valores del punto tocado en el array `items` |
| `lineChartMode` en edit-chart | No exponer selector de modo en este fix | El modo ya se configura en `AddMetricSheet` al crear; la spec no requiere cambiar el modo desde edit-chart |
| Reset de breakdown en LineChart al cambiar evento | Sí resetear, igual que BarChart | Previene breakdowns huérfanos con propiedades que no existen en el nuevo evento |
| Cache invalidation en LineChart breakdown | Sí invalidar `breakdown_series` al guardar cambio de breakdown | Consistente con comportamiento de BarChart |
| `barChartMode` en LineChart | No aplica | LineChart no tiene stacked/normal — solo tiene `lineChartMode` (line/cumulative) |

---

## Compatibilidad de Hooks

- `useBreakdownSeries(metricId, eventName, timeFilter, breakdownProperty, math)` — ya funciona para ambos tipos de chart. El queryKey incluye `metricId` y `breakdownProperty`, lo que garantiza que el caché es correcto.
- `usePropertyDefinitions(eventName)` — funciona para cualquier evento, solo necesita el eventName como activador. Actualmente la condición es `isBarChart ? eventName : ''`; cambiar a `(isBarChart || isLineChart) ? eventName : ''`.

---

## Todos los NEEDS CLARIFICATION resueltos

Sin ningún NEEDS CLARIFICATION en la spec. Todos los puntos fueron clarificados por análisis de código.
