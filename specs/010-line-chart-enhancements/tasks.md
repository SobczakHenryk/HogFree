# 010 — Tasks: Line Chart Breakdown + Acumulativo

## Fase 1: Modelo de Datos

- [x] T001 — Añadir `LineChartMode` type y `lineChartMode` a `DashboardMetric` en `types/dashboard.ts`
- [x] T002 — Actualizar docstring de `breakdownProperty` para incluir LineChart

## Fase 2: Edit Screen

- [x] T003 — Añadir estado `lineChartMode` al edit screen
- [x] T004 — Mostrar sección Breakdown para LineChart en edit-chart
- [x] T005 — Mostrar sección Tipo (Línea / Acumulativa) para LineChart en edit-chart
- [x] T006 — Incluir `lineChartMode` en `hasChanges` y `handleSave`

## Fase 3: AddMetricSheet

- [x] T007 — Añadir paso `lineChartConfig` al tipo Step y flujo de navegación
- [x] T008 — Renderizar UI del paso lineChartConfig (tipo + breakdown picker)
- [x] T009 — Enviar `lineChartMode` y `breakdownProperty` en handleConfirm para LineChart

## Fase 4: LineChartWidget

- [x] T010 — Añadir llamada a useBreakdownSeries en LineChartWidget
- [x] T011 — Implementar transformación cumulative (running sum)
- [x] T012 — Renderizar múltiples líneas con dataSet para breakdown
- [x] T013 — Renderizar leyenda debajo del chart

## Fase 5: LineChartDetail

- [x] T014 — Añadir soporte breakdown (multi-line) en LineChartDetail
- [x] T015 — Añadir soporte cumulative en LineChartDetail
- [x] T016 — Tooltip con desglose breakdown + leyenda

## Fase 6: Integración

- [x] T017 — Reset breakdown/lineChartMode al cambiar evento en edit-chart
- [x] T018 — Cache invalidation para nuevos campos
