---
description: "Task list for 005-chart-widgets feature"
---

# Tasks: Chart Widgets — BarChartWidget, LineChartWidget y Nombre Personalizado

**Input**: `specs/005-chart-widgets/`  
**Prerequisites**: spec.md ✅, plan.md ✅, data-model.md ✅, contracts/ ✅, research.md ✅  
**Depends on**: `003-metrics-dashboard` (completo), `006-funnel-chart-widget` (completo)

**Tests**: No test runner configurado. Verificación manual según quickstart.md.

**Organization**: Tasks organizados por User Story (spec.md). US1–US4 completados. US5 (nombre personalizado) pendiente.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User Story label (US1, US2, US3, US4, US5) — solo en fases de user story
- All paths relative to `app/PostHogMobile/`

---

## Phase 1: Setup y Verificación de Dependencias

**Purpose**: Verificar compatibilidad de `react-native-gifted-charts` con Expo SDK 54 + New Architecture e instalar dependencias.

- [x] T001 Verificar compatibilidad de `react-native-gifted-charts` y `react-native-svg` con Expo SDK ~54 y New Architecture (Fabric/JSI). **Resultado**: compatible vía `react-native-svg` (sin módulos nativos propios).
- [x] T002 Instalar `react-native-gifted-charts` y `react-native-svg` en `package.json` ejecutando `npx expo install react-native-svg react-native-gifted-charts`. **Instalado**: `react-native-svg@15.12.1`, `react-native-gifted-charts@1.4.76`.

**Checkpoint**: ✅ Dependencias instaladas y verificadas.

---

## Phase 2: Foundational — Tipos, Constantes y Servicio API

**Purpose**: Extender el data model y el servicio PostHog para soportar series de tiempo. Bloqueante para todas las user stories.

**⚠️ CRÍTICO**: Ninguna tarea de user story puede comenzar hasta completar esta fase.

- [x] T003 Actualizar `src/types/dashboard.ts`: extender `ChartType` a `'MetricCard' | 'BarChart' | 'LineChart'` y añadir interfaces `TimeSeriesDataPoint` y `MetricSeries` (ver `data-model.md`).
- [x] T004 Actualizar `src/constants/index.ts`: añadir `TIME_FILTER_TO_INTERVAL` y `TIME_FILTER_TO_DATE_RANGE` (ver `contracts/posthog-api.md`).
- [x] T005 Añadir función `queryMetricSeries()` a `src/services/posthog-api.ts` usando `ky.post` al endpoint `/api/projects/{id}/query/` con TrendsQuery.

**Checkpoint**: ✅ Tipos, constantes y servicio API listos.

---

## Phase 3: User Story 1 — Añadir BarChartWidget al dashboard (Priority: P1) ✅

**Goal**: El usuario puede añadir un gráfico de barras desde el bottom sheet y verlo en el dashboard.

**Independent Test**: Abrir bottom sheet → seleccionar evento → elegir BarChart → confirmar → verificar tarjeta con gráfico de barras en el dashboard.

**FRs cubiertos**: FR-001, FR-002, FR-005, FR-007, FR-008, FR-009, FR-010, FR-012, FR-013, FR-014, FR-015

### Implementation

- [x] T006 [P] [US1] Crear `src/hooks/useMetricSeries.ts` con `useQuery`, `queryKey: ['metric_series', metricId, timeFilter]`, `staleTime: Infinity`, `gcTime: 24h`, llamando a `queryMetricSeries()`.
- [x] T007 [P] [US1] Crear `src/components/BarChartWidget.tsx`: componente que recibe `DashboardMetric` + `timeFilter`, usa `useMetricSeries`, renderiza `<BarChart>` de `react-native-gifted-charts` con skeleton/loading/error/empty states. Min-height 260dp, dark theme, glassmorphism card.
- [x] T008 [P] [US1] Actualizar `src/components/index.ts` para re-exportar `BarChartWidget`.
- [x] T009 [US1] Actualizar `src/app/(tabs)/dashboard.tsx`: añadir switch sobre `metric.chartType` para renderizar `<BarChartWidget>` cuando `chartType === 'BarChart'`. Pasar `timeFilter` y `onLongPress`.
- [x] T010 [US1] Actualizar `src/components/AddMetricSheet.tsx`: en paso 2 (chart type), añadir opción "BarChart" con ícono `bar-chart-outline`. Al confirmar, pasar `chartType: 'BarChart'` a `onConfirm`.

**Checkpoint**: ✅ BarChartWidget funcional end-to-end.

---

## Phase 4: User Story 2 — Añadir LineChartWidget al dashboard (Priority: P1) ✅

**Goal**: El usuario puede añadir un gráfico de línea desde el bottom sheet y verlo en el dashboard.

**Independent Test**: Mismo procedimiento que US1 pero eligiendo LineChart.

**FRs cubiertos**: FR-001, FR-003, FR-005, FR-007, FR-008, FR-009, FR-010, FR-012, FR-013, FR-014, FR-015

### Implementation

- [x] T011 [P] [US2] Crear `src/components/LineChartWidget.tsx`: componente que recibe `DashboardMetric` + `timeFilter`, usa `useMetricSeries`, renderiza `<LineChart>` de `react-native-gifted-charts` SIN `isAnimated` (FR-021). Min-height 260dp, dark theme, spacing dinámico (FR-019).
- [x] T012 [P] [US2] Actualizar `src/components/index.ts` para re-exportar `LineChartWidget`.
- [x] T013 [US2] Actualizar `src/app/(tabs)/dashboard.tsx`: añadir caso `'LineChart'` al switch de renderizado. Pasar `timeFilter` y `onLongPress`.
- [x] T014 [US2] Actualizar `src/components/AddMetricSheet.tsx`: en paso 2, añadir opción "LineChart" con ícono `trending-up-outline`.

**Checkpoint**: ✅ LineChartWidget funcional end-to-end. MetricCard + BarChart + LineChart coexisten en el dashboard.

---

## Phase 5: User Story 3 — Granularidad temporal y ejes (Priority: P1) ✅

**Goal**: Los gráficos muestran granularidad correcta (día/semana/mes) y ejes legibles con etiquetas formateadas.

**Independent Test**: Seleccionar "7 días" → 7 barras/puntos diarios. Cambiar a "90 días" → agrupación semanal. Cambiar a "Histórico" → agrupación mensual. Ejes Y con valores compactos, eje X con fechas "d\nMMM".

**FRs cubiertos**: FR-006, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-022

### Implementation

- [x] T015 [US3] Crear función `formatCompactNumber(n: number): string` en `src/utils/formatCompactNumber.ts`. Reglas: 0→"0", 1–999→valor directo, 1000–999999→"X.Yk", ≥1000000→"X.YM". Función pura.
- [x] T016 [P] [US3] Actualizar `src/components/BarChartWidget.tsx` para habilitar Y axis labels: `yAxisLabelWidth={40}`, `formatYLabel` con `formatCompactNumber`, `yAxisTextStyle={{ color: '#737373', fontSize: 10 }}`. Actualizar `chartWidth` para acomodar 40dp del eje Y (FR-016/FR-018).
- [x] T017 [P] [US3] Actualizar `src/components/LineChartWidget.tsx` para habilitar Y axis labels: mismos cambios que T016. Spacing dinámico `floor((chartWidth - padding) / (numPoints - 1))` (FR-019).

### Verification

- [ ] T018 [US3] Verificación visual FR-017 (X axis labels): Confirmar etiquetas eje X no se solapan con `chartWidth` reducido. Probar períodos 7d, 30d, 90d. Verificar distribución uniforme de etiquetas (BarChart: 3–5, LineChart: 3–6, min 6 para ≥15 puntos).
- [ ] T019 [US3] Verificación visual completa de ejes: Y axis compacto (#737373, fontSize 10, ancho 40dp), X axis legible ("d\nMMM"), gráficos no desbordan tarjeta. Probar con 0, 1, 7, 30, 90+ datos. Cambio de filtro actualiza granularidad correctamente.

**Checkpoint**: Ejes legibles y analizables. FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-022 cumplidos.

---

## Phase 6: User Story 4 — Eliminar widgets (Priority: P2) ✅

**Goal**: Long-press sobre BarChartWidget o LineChartWidget dispara el mismo diálogo de eliminación que MetricCard.

**Independent Test**: Long-press sobre un BarChartWidget → diálogo aparece → confirmar → tarjeta desaparece y no reaparece al reabrir la app.

**FRs cubiertos**: FR-011

### Implementation

- [x] T020 [US4] Implementar `onLongPress` en `BarChartWidget.tsx` y `LineChartWidget.tsx` usando el mecanismo existente de spec 003 (diálogo de confirmación + limpieza de caché). Ya funciona sin cambios adicionales gracias al callback recibido desde `dashboard.tsx`.

### Verification

- [x] T021 [US4] Verificar eliminación end-to-end: long-press → diálogo → confirmar → tarjeta desaparece → caché limpiado → no reaparece al reiniciar app. Probar con BarChart y LineChart.

**Checkpoint**: ✅ Eliminación funcional para todos los chart types.

---

## Phase 7: User Story 5 — Nombre personalizado para visualizaciones (Priority: P1) 🎯 PENDIENTE

**Goal**: Al crear cualquier visualización (MetricCard, BarChart, LineChart, FunnelChart), el usuario puede asignar un nombre personalizado que se mostrará como título de la tarjeta en el dashboard.

**Independent Test**: Añadir métrica → escribir nombre personalizado "Visitas Landing" → confirmar → tarjeta muestra "Visitas Landing" como título. Borrar texto → botón deshabilitado. Cerrar y reabrir app → nombre persiste.

**FRs cubiertos**: FR-004, FR-023, FR-024, FR-025

### Implementation

- [x] T022 [US5] Añadir estado `customLabel` en `src/components/AddMetricSheet.tsx`: declarar `const [customLabel, setCustomLabel] = useState('')`. Inicializar `customLabel` con `selectedEvent.name` al pasar del paso `event` al paso `chartType` (en el `onPress` de `renderEvent`). Resetear `customLabel` a `''` en `resetSheet()`.

- [x] T023 [US5] Renderizar campo de texto para nombre personalizado en el paso `chartType` de `src/components/AddMetricSheet.tsx`: añadir un `TextInput` entre el resumen del evento seleccionado y el botón "Añadir". El input debe:
  - Tener placeholder "Nombre de la visualización"
  - Mostrar `customLabel` como valor controlado
  - Actualizar `customLabel` via `onChangeText`
  - Styling consistente con el design system dark: `bg-background rounded-xl px-4 py-3 text-text-primary`
  - Label superior "Nombre" en `text-text-tertiary text-xs uppercase tracking-widest`

- [x] T024 [US5] Implementar validación FR-024 en `src/components/AddMetricSheet.tsx`: deshabilitar el botón "Añadir" (y "Continuar" para FunnelChart) cuando `customLabel.trim().length === 0`. Aplicar estilos de disabled (`bg-background-tertiary` + `text-text-tertiary`) al botón cuando el label es inválido. La condición de deshabilitación debe combinarse con las existentes (`isSubmitting`, `funnelSteps.length < 2` para funnel).

- [x] T025 [US5] Actualizar `handleConfirm()` y `handleChartTypeNext()` en `src/components/AddMetricSheet.tsx`: pasar `customLabel.trim()` como `label` en el objeto de `onConfirm` en lugar del hardcoded `selectedEvent.name`. Aplicar en ambas ramas (chart type normal y FunnelChart). Esto asegura que el nombre personalizado se persiste en `DashboardMetric.label` via `useDashboardConfig` (infraestructura existente, FR-025).

### Verification

- [ ] T026 [US5] Verificación manual nombre personalizado end-to-end en `src/components/AddMetricSheet.tsx`:
  1. Abrir bottom sheet → seleccionar evento → verificar campo pre-rellenado con nombre del evento
  2. Editar nombre a "Visitas Landing" → confirmar → tarjeta muestra "Visitas Landing"
  3. Borrar texto del campo → botón "Añadir" deshabilitado (no se puede confirmar)
  4. Dejar nombre por defecto (no editar) → confirmar → tarjeta muestra nombre del evento
  5. Cerrar y reabrir app → nombre personalizado persiste
  6. Repetir para MetricCard, BarChart, LineChart y FunnelChart

**Checkpoint**: Nombre personalizado funcional para todos los chart types. FR-023, FR-024, FR-025 cumplidos.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verificaciones finales y refinamiento de UX.

- [ ] T027 [P] Pull-to-refresh verification: confirmar que pull-to-refresh en `src/app/(tabs)/dashboard.tsx` actualiza correctamente MetricCards, BarCharts, LineCharts y FunnelCharts simultáneamente tras los cambios de US5.
- [ ] T028 Ejecutar validación completa de `quickstart.md`: verificar todos los escenarios documentados, incluyendo nombre personalizado, estados vacíos, cambio de filtro, persistencia, y coexistencia de múltiples chart types (hasta 10 widgets).

**Checkpoint**: Feature completa. Todos los FRs (FR-001 a FR-025) y NFRs cumplidos.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: ✅ Completa
- **Phase 2 (Foundational)**: ✅ Completa — desbloqueó todas las user stories
- **Phase 3 (US1 — BarChart)**: ✅ Completa
- **Phase 4 (US2 — LineChart)**: ✅ Completa
- **Phase 5 (US3 — Granularidad)**: ✅ Implementación completa, verificación visual pendiente (T018, T019)
- **Phase 6 (US4 — Eliminar)**: ✅ Completa
- **Phase 7 (US5 — Nombre personalizado)**: 🔴 Pendiente — modifica solo `AddMetricSheet.tsx`
- **Phase 8 (Polish)**: Depende de Phase 5 verification + Phase 7

### User Story Dependencies

- **US1 (BarChart)**: ✅ Independiente tras Phase 2
- **US2 (LineChart)**: ✅ Independiente tras Phase 2
- **US3 (Granularidad)**: ✅ Depende de US1 y US2 (widgets deben existir)
- **US4 (Eliminar)**: ✅ Depende de US1 y US2 (widgets deben existir)
- **US5 (Nombre personalizado)**: Independiente — solo modifica `AddMetricSheet.tsx`, no depende de US3/US4

### Parallel Opportunities (Pendientes)

```text
# Pueden ejecutarse en paralelo:
T018 [US3] (verificación X axis)     ──┐
T019 [US3] (verificación visual ejes) ─┤── Independientes de US5
T022 [US5] (estado customLabel)       ──┘

# Secuencial dentro de US5:
T022 → T023 → T024 → T025 → T026

# Final (depende de todo lo anterior):
T027 + T028 (polish)
```

---

## Implementation Strategy

### MVP ya entregado (US1 + US2 + US4)

Widgets funcionales con eliminación. Dashboard operativo con BarChart + LineChart + MetricCard + FunnelChart.

### Incremento actual: US3 verification + US5

1. Ejecutar T018 + T019 (verificación visual de ejes) en paralelo con inicio de T022
2. Completar T022 → T023 → T024 → T025 (cambios en AddMetricSheet.tsx)
3. Ejecutar T026 (verificación nombre personalizado)
4. Cerrar con T027 + T028 (polish final)

### Riesgo

- **Bajo**: US5 modifica un solo archivo (`AddMetricSheet.tsx`) con cambios puramente de UI
- **Sin impacto en datos**: `DashboardMetric.label` ya existe y se persiste — solo cambia quién lo asigna (usuario vs hardcoded)

---

## Summary

| Metric | Value |
|---|---|
| Total tasks | 28 |
| Completed | 21 (T001–T017, T020–T021) |
| Pending | 7 (T018–T019, T022–T026, T027–T028) |
| Pending — US3 verification | 2 (T018, T019) |
| Pending — US5 implementation | 4 (T022–T025) |
| Pending — US5 verification | 1 (T026) |
| Pending — Polish | 2 (T027, T028) |
| Parallelizable (pending) | T018 + T019 ∥ T022 |
| Files to modify | 1 (`AddMetricSheet.tsx`) |
| FR coverage | FR-001..FR-025 ✅ |
| NFR coverage | NFR-001..NFR-005 ✅ |

---

## Backlog / Fuera de Scope (esta versión)

- Zoom e interacciones (tap en barra para ver valor exacto)
- Altura adaptativa de tarjetas de gráfico
- Comparación de dos eventos en el mismo gráfico
- Exportar/compartir imagen del gráfico
- Tooltip al presionar sobre un punto de datos
- Editar nombre personalizado post-creación (requiría spec adicional)
