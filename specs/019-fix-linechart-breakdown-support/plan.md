# Implementation Plan: Soporte Completo de Breakdown en LineChart

**Branch**: `019-fix-linechart-breakdown-support` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification desde `specs/019-fix-linechart-breakdown-support/spec.md`

---

## Summary

Corrección de dos bugs que impiden que el breakdown funcione end-to-end para gráficas LineChart:

1. **BUG-001** — `LineChartDetail` en `chart-detail.tsx` ignora `breakdownProperty` y siempre renderiza una sola línea.
2. **BUG-002** — `edit-chart.tsx` no muestra la sección Breakdown para LineChart, haciendo imposible editar o agregar un breakdown a un LineChart existente.

El enfoque técnico es: extender `LineChartDetail` con los mismos patrones ya implementados en `LineChartWidget`, y extender `edit-chart.tsx` duplicando la lógica de BarChart para LineChart.

---

## Technical Context

**Language/Version**: TypeScript ~5.9.2  
**Primary Dependencies**: React Native 0.81.5 + Expo ~54.0.33 + react-native-gifted-charts ^1.4.74 + TanStack Query ^5.90.21  
**Storage**: AsyncStorage (caché React Query), expo-secure-store (API key)  
**Testing**: Manual (app en simulador/dispositivo)  
**Target Platform**: iOS + Android (React Native New Architecture habilitada)  
**Project Type**: mobile-app  
**Performance Goals**: N/A — cambios de UI/lógica, sin nuevas llamadas a red  
**Constraints**: Sin nuevas dependencias. Sin cambios en tipos persistidos.  
**Scale/Scope**: 2 archivos modificados

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|-----------|--------|-------|
| Mobile-first | ✅ PASS | Cambios de UI en pantallas nativas |
| Performance over features | ✅ PASS | No se añaden nuevas llamadas de red. `useBreakdownSeries` ya tiene `staleTime: Infinity` |
| Offline-capable | ✅ PASS | `useBreakdownSeries` usa el mismo gcTime de 24h que el resto de hooks |
| Security by default | ✅ PASS | Sin cambios en autenticación ni almacenamiento de claves |
| Componentes usan hooks, nunca API directa | ✅ PASS | `LineChartDetail` usará `useBreakdownSeries`, no llama directamente a la API |
| NativeWind para estilos | ✅ PASS | Se seguirá el mismo patrón de clases que en `LineChartWidget` |
| Sin class components | ✅ PASS | Solo componentes funcionales |

**Resultado**: Sin violaciones. No se requiere sección de Complexity Tracking.

---

## Project Structure

### Documentation (this feature)

```text
specs/019-fix-linechart-breakdown-support/
├── plan.md              ← Este archivo
├── research.md          ← Phase 0 output ✅
├── data-model.md        ← Phase 1 output ✅
├── quickstart.md        ← Phase 1 output ✅
├── spec.md              ← Feature spec ✅
├── checklists/
│   └── requirements.md  ✅
├── contracts/
│   └── line-chart-detail.md  ← Phase 1 output ✅
└── tasks.md             ← Phase 2 output (/speckit.tasks — no generado por /speckit.plan)
```

### Source Code (archivos modificados)

```text
app/PostHogMobile/src/
├── app/
│   ├── chart-detail.tsx    ← MODIFICAR: LineChartDetail + call site (BUG-001)
│   └── edit-chart.tsx      ← MODIFICAR: breakdown para LineChart (BUG-002)
└── (sin archivos nuevos)
```

---

## Phase 0: Research

> Completado. Ver [research.md](./research.md).

**Hallazgos clave**:
- Todos los hooks, tipos y constantes necesarios ya existen.
- El patrón a seguir es `LineChartWidget.tsx` para el breakdown en `LineChartDetail`.
- El patrón a seguir es la sección Breakdown existente en `edit-chart.tsx` (para BarChart) para LineChart.
- Sin NEEDS CLARIFICATION sin resolver.

---

## Phase 1: Design & Contracts

### 1.1 Modelo de Datos

> Ver [data-model.md](./data-model.md).

Sin cambios en `DashboardMetric` ni en ningún tipo persistido. Los campos `breakdownProperty` y `lineChartMode` ya existen en el tipo.

### 1.2 Contrato de Componente: `LineChartDetail`

> Ver [contracts/line-chart-detail.md](./contracts/line-chart-detail.md).

**Cambios en la firma**:

```tsx
// ANTES
function LineChartDetail({ metricId, eventName, math, timeFilter })

// DESPUÉS  
function LineChartDetail({ metricId, eventName, math, timeFilter, breakdownProperty, lineChartMode })
```

**Cambios en el call site** (línea 210, `chart-detail.tsx`):

```tsx
// ANTES
<LineChartDetail metricId={metric.id} eventName={metric.eventName} math={metric.math} timeFilter={timeFilter} />

// DESPUÉS
<LineChartDetail
  metricId={metric.id}
  eventName={metric.eventName}
  math={metric.math}
  timeFilter={timeFilter}
  breakdownProperty={metric.breakdownProperty}
  lineChartMode={metric.lineChartMode}
/>
```

### 1.3 Lógica de Breakdown en `LineChartDetail`

Replicar exactamente el patrón de `LineChartWidget.tsx`:

```tsx
const hasBreakdown = !!breakdownProperty;
const isCumulative = lineChartMode === 'cumulative';

// Siempre llamar a ambos hooks (same pattern as LineChartWidget)
const { data, isLoading, isPending, isError } = useMetricSeries(metricId, eventName, timeFilter, math);
const { data: breakdownData, isLoading: bdLoading, isPending: bdPending, isError: bdError } 
  = useBreakdownSeries(metricId, eventName, timeFilter, hasBreakdown ? breakdownProperty : undefined, math);

// Lógica de estado activo
const activeLoading = hasBreakdown ? (bdLoading || bdPending) : (isLoading || isPending);
const activeError   = hasBreakdown ? bdError : isError;
const showSkeleton  = activeLoading && !(hasBreakdown ? breakdownData : data);

// Build dataSet (modo breakdown)
if (hasBreakdown && breakdownData && breakdownData.items.length > 0) {
  // Construir dataSet con BREAKDOWN_COLORS — igual que LineChartWidget
  // Renderizar <LineChart dataSet={dataSet} ...> con pointerConfig adaptado
}

// Build singleLineData (modo normal — sin cambio)
```

**Tooltip con breakdown**: El `pointerLabelComponent` recibe `items[]` donde cada elemento corresponde a una serie del `dataSet`. Iterar sobre `breakdownData.items` usando `selectedIndex` para mostrar el desglose:

```tsx
pointerLabelComponent: (items: { value: number }[]) => {
  // items[i].value = valor de la serie i en la posición tocada
  // Mostrar breakdownData.items[i].breakdownValue + items[i].value
}
```

### 1.4 Cambios en `edit-chart.tsx` para LineChart

**Imports a añadir**:
```tsx
// Añadir LineChartMode al import de tipos existente
import type { AggregationMath, BarChartMode, LineChartMode, PostHogEvent, PostHogProperty } from '../types';
```

**Variables nuevas**:
```tsx
const isLineChart = metric?.chartType === 'LineChart';
// (isBarChart ya existe en línea 82)
```

**`usePropertyDefinitions` — cambiar condición**:
```tsx
// ANTES
const { data: properties, isLoading: propertiesLoading } = usePropertyDefinitions(
  isBarChart ? eventName : '',
);
// DESPUÉS
const { data: properties, isLoading: propertiesLoading } = usePropertyDefinitions(
  (isBarChart || isLineChart) ? eventName : '',
);
```

**`hasChanges` — añadir tracking de LineChart**:
```tsx
// Añadir al final del cálculo de hasChanges:
(isLineChart && breakdownProperty !== metric?.breakdownProperty)
```

**`handleSave` — añadir persistencia de LineChart breakdown**:
```tsx
if (isLineChart && breakdownProperty !== metric.breakdownProperty) {
  changes.breakdownProperty = breakdownProperty;
}
```

**Sección Breakdown en render — extender condición**:
```tsx
// ANTES
{isBarChart && !isFunnel && (...)}
// DESPUÉS
{(isBarChart || isLineChart) && !isFunnel && (...)}
```

**Selector de modo BarChart — sin cambio** (sigue siendo solo para BarChart):
```tsx
{isBarChart && breakdownProperty && (...)}
// No cambiar: LineChart no tiene selector de barChartMode
```

**Reset al cambiar evento** (handler del event picker):
```tsx
// Ya existe para BarChart. Extender para que también resetee en LineChart:
setBreakdownProperty(undefined);
// (ya se llama en el handler existente — verificar que aplica para ambos tipos)
```

### 1.5 Quickstart

> Ver [quickstart.md](./quickstart.md).

---

## Dependency Graph

```
T001 (chart-detail.tsx call site) 
  └── T002 (LineChartDetail: firma + useBreakdownSeries)
        └── T003 (LineChartDetail: build dataSet + render)
              └── T004 (LineChartDetail: leyenda)
                    └── T005 (LineChartDetail: tooltip breakdown) — P2

T006 (edit-chart.tsx: import + isLineChart + usePropertyDefinitions)
  └── T007 (edit-chart.tsx: hasChanges + handleSave)
        └── T008 (edit-chart.tsx: render sección Breakdown)
```

T001–T005 y T006–T008 son **grupos independientes** — pueden desarrollarse en paralelo.

---

## Complexity Tracking

Sin violaciones de constitution. No aplica.

