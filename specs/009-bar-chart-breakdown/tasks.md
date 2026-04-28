# Tasks: Bar Chart Breakdown & Stacked Mode

**Spec**: `specs/009-bar-chart-breakdown/spec.md`  
**Plan**: `specs/009-bar-chart-breakdown/plan.md`  
**Created**: 2026-03-19

---

## Phase 1 — Data Model & API Layer

### T001 — Extender tipos en `types/dashboard.ts`
- **File**: `src/types/dashboard.ts`
- **Action**: Añadir campos opcionales a `DashboardMetric`:
  - `breakdownProperty?: string`
  - `barChartMode?: 'normal' | 'stacked'`
- **Action**: Añadir tipo `BarChartMode = 'normal' | 'stacked'`
- **Action**: Añadir interfaz `BreakdownSeriesItem` con `breakdownValue`, `dataPoints`, `total`
- **Action**: Añadir interfaz `BreakdownSeries` con `items: BreakdownSeriesItem[]`, `lastRefreshedAt`
- **Action**: Añadir interfaz `PostHogProperty` con `name: string`, `propertyType: string`
- **Action**: Exportar los nuevos tipos desde `types/index.ts`
- **Status**: `[X]`
- **Depends on**: ninguno

### T002 — Crear función `getPropertyDefinitions` en `posthog-api.ts`
- **File**: `src/services/posthog-api.ts`
- **Action**: Añadir interfaz de respuesta `PropertyDefinitionsResponse`
- **Action**: Crear función `getPropertyDefinitions(apiKey, cloudRegion, projectId, eventName)` que llame a `GET /api/projects/{projectId}/property_definitions/?event_names={eventName}&type=event&limit=100`
- **Action**: Retorna `PostHogProperty[]` mapeando `name` y `property_type` → `propertyType`
- **Status**: `[X]`
- **Depends on**: T001

### T003 — Crear función `queryBreakdownSeries` en `posthog-api.ts`
- **File**: `src/services/posthog-api.ts`
- **Action**: Crear función `queryBreakdownSeries(apiKey, cloudRegion, projectId, eventName, timeFilter, breakdownProperty, options?)` 
- **Action**: Envía TrendsQuery con `breakdownFilter: { breakdown: breakdownProperty, breakdown_type: 'event' }`
- **Action**: Parsea `results[]` (múltiples series): cada uno tiene `data[]`, `days[]`, `count`, `breakdown_value`
- **Action**: Retorna `BreakdownSeries` con items ordenados por `total` desc, top 5 + agrupa resto como "Otros"
- **Status**: `[X]`
- **Depends on**: T001

### T004 — Actualizar `updateMetric` en `useDashboardConfig.ts`
- **File**: `src/hooks/useDashboardConfig.ts`
- **Action**: Extender el tipo de `changes` en `updateMetric` para incluir `breakdownProperty` y `barChartMode`
- **Status**: `[X]`
- **Depends on**: T001

---

## Phase 2 — Hooks

### T005 — Crear hook `usePropertyDefinitions`
- **File**: `src/hooks/usePropertyDefinitions.ts`
- **Action**: Crear hook TanStack Query que llama a `getPropertyDefinitions`
- **Action**: queryKey: `['property_definitions', cloudRegion, projectId, eventName]`
- **Action**: `enabled`: `!!eventName && !!projectInfo`
- **Action**: `staleTime`: 5 * 60 * 1000 (5 minutos)
- **Action**: Retorna `{ properties, isLoading, isError, refetch }`
- **Action**: Exportar desde `hooks/index.ts`
- **Status**: `[X]`
- **Depends on**: T002

### T006 — Crear hook `useBreakdownSeries`
- **File**: `src/hooks/useBreakdownSeries.ts`  
- **Action**: Crear hook TanStack Query que llama a `queryBreakdownSeries`
- **Action**: queryKey: `['breakdown_series', cloudRegion, metricId, timeFilter, math ?? 'total', breakdownProperty]`
- **Action**: `enabled`: `!!breakdownProperty && !!projectInfo`
- **Action**: `staleTime: Infinity`, `gcTime: 24h` (igual que useMetricSeries)
- **Action**: Retorna `{ data: BreakdownSeries | undefined, isLoading, isPending, isError }`
- **Action**: Exportar desde `hooks/index.ts`
- **Status**: `[X]`
- **Depends on**: T003

---

## Phase 3 — Edit Screen

### T007 — Añadir sección "Breakdown" en `edit-chart.tsx`
- **File**: `src/app/edit-chart.tsx`
- **Action**: Añadir state local `breakdownProperty` y `barChartMode`, sincronizados desde metric
- **Action**: Sección visible solo cuando `!isFunnel` y `metric.chartType === 'BarChart'`
- **Action**: Pressable que muestra la propiedad actual (o "Sin breakdown")
- **Action**: Al pulsar, abre un Modal con lista de propiedades (usar `usePropertyDefinitions`)
- **Action**: Modal con SearchBar + FlatList de propiedades + opción "Sin breakdown" al inicio
- **Action**: Actualizar `hasChanges` para incluir breakdownProperty y barChartMode
- **Status**: `[X]`
- **Depends on**: T005

### T008 — Añadir selector de modo Normal/Stacked en `edit-chart.tsx`
- **File**: `src/app/edit-chart.tsx`
- **Action**: Selector tipo toggle (como el de agregación) con "Normal" y "Stacked"
- **Action**: Visible solo cuando `breakdownProperty` no es undefined
- **Action**: Estado local `barChartMode` con default `'stacked'`
- **Status**: `[X]`
- **Depends on**: T007

### T009 — Actualizar `handleSave` en `edit-chart.tsx`
- **File**: `src/app/edit-chart.tsx`
- **Action**: Incluir `breakdownProperty` y `barChartMode` en el objeto `changes`
- **Action**: Cuando cambie breakdownProperty, invalidar queries de breakdown via `queryClient.removeQueries`
- **Action**: Cuando se cambie de evento, resetear breakdownProperty a undefined
- **Status**: `[X]`
- **Depends on**: T008, T004

---

## Phase 4 — Chart Rendering

### T010 — Añadir constantes de colores de breakdown
- **File**: `src/constants/index.ts`
- **Action**: Exportar `BREAKDOWN_COLORS: string[]` con 5 colores
- **Action**: Exportar `BREAKDOWN_OTHER_COLOR: string` (#888888)
- **Status**: `[X]`
- **Depends on**: ninguno

### T011 — Actualizar `BarChartWidget` para soportar breakdown
- **File**: `src/components/BarChartWidget.tsx`
- **Action**: Recibir `breakdownProperty` y `barChartMode` desde metric props
- **Action**: Si hay breakdown y modo stacked: usar `useBreakdownSeries`, construir `stackData`, renderizar con `stackData` prop
- **Action**: Si no hay breakdown o modo normal: comportamiento actual sin cambios
- **Action**: Añadir leyenda debajo del chart cuando hay breakdown activo
- **Status**: `[X]`
- **Depends on**: T006, T010

### T012 — Actualizar `BarChartDetail` en `chart-detail.tsx` para stacked
- **File**: `src/app/chart-detail.tsx`
- **Action**: Pasar `breakdownProperty` y `barChartMode` como props a `BarChartDetail`
- **Action**: Si hay breakdown + stacked: usar `useBreakdownSeries`, renderizar `stackData` con chart expandido
- **Action**: Tooltip al tocar barra: mostrar desglose con cada valor y su conteo
- **Action**: Si no hay breakdown: comportamiento actual
- **Action**: Leyenda debajo del chart
- **Status**: `[X]`
- **Depends on**: T006, T010

---

## Phase 5 — Edge Cases & Polish

### T013 — Reset breakdown al cambiar evento
- **File**: `src/app/edit-chart.tsx`
- **Action**: Cuando el usuario cambia el evento en edit-chart, resetear `breakdownProperty` a undefined y `barChartMode` a `'stacked'`
- **Action**: Esto previene tener una propiedad que no existe en el nuevo evento
- **Status**: `[X]`
- **Depends on**: T009

### T014 — Handle evento sin propiedades
- **File**: `src/app/edit-chart.tsx`
- **Action**: Si `usePropertyDefinitions` retorna lista vacía, mostrar "Este evento no tiene propiedades disponibles" en el modal
- **Status**: `[X]`
- **Depends on**: T007

### T015 — Cache invalidation al cambiar breakdown
- **File**: `src/app/edit-chart.tsx`
- **Action**: Al guardar con breakdownProperty cambiado, hacer `queryClient.removeQueries` para quitar caches de breakdown_series del metric
- **Status**: `[X]`
- **Depends on**: T009

---

## Dependency Graph

```
T001 ──┬── T002 ── T005 ──┬── T007 ── T008 ── T009 ── T013, T014, T015
       │                   │
       ├── T003 ── T006 ──┬── T011
       │                   │
       └── T004            └── T012
                           
T010 ──┬── T011
       └── T012
```

## Execution Order

1. T001, T010 (parallel — no dependencies)
2. T002, T003, T004 (parallel — depend on T001)
3. T005, T006 (parallel — depend on T002, T003)
4. T007 (depends on T005)
5. T008 (depends on T007)
6. T009 (depends on T008, T004)
7. T011, T012 (parallel — depend on T006, T010)
8. T013, T014, T015 (parallel — depend on T009, T007)
