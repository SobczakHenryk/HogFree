# Tasks: Soporte Completo de Breakdown en LineChart

**Input**: Design documents from `specs/019-fix-linechart-breakdown-support/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Testing**: Manual en simulador/dispositivo (no hay framework de tests automatizados configurado)  
**Archivos a modificar**: 2 (`chart-detail.tsx`, `edit-chart.tsx`)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo con otras tareas marcadas [P] (diferente archivo, sin dependencias)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3)
- Todos los paths son relativos a `app/PostHogMobile/src/`

---

## Phase 1: Setup

**Purpose**: Revisar los archivos de referencia antes de implementar

- [X] T001 Revisar `LineChartWidget.tsx` en `app/PostHogMobile/src/components/LineChartWidget.tsx` como patrón de referencia para el breakdown (dataSet, BREAKDOWN_COLORS, leyenda, pointerConfig)

**Checkpoint**: Patrón de referencia comprendido — implementación puede comenzar en paralelo (T002 y T007)

---

## Phase 2: Foundational

No hay prerequisitos bloqueantes compartidos entre las dos historias P1.  
Las dos cadenas de tareas (US1 y US2) son independientes entre sí y pueden ejecutarse en paralelo.

---

## Phase 3: User Story 1 — Pantalla de detalle de LineChart con breakdown (Priority: P1) 🎯 MVP

**Goal**: `LineChartDetail` en `chart-detail.tsx` muestra múltiples líneas coloreadas con leyenda cuando la métrica tiene `breakdownProperty` configurado

**Independent Test**: Crear un LineChart con breakdown `$browser`, verificar que el widget del dashboard muestra múltiples líneas, abrir el detalle y confirmar que también muestra las mismas líneas con leyenda.

### Implementación

- [X] T002 [P] [US1] Importar `LineChartMode` desde `../types` y extender la firma de la función `LineChartDetail` con `breakdownProperty?: string` y `lineChartMode?: LineChartMode` en `app/PostHogMobile/src/app/chart-detail.tsx`
- [X] T003 [US1] Extender el call site de `LineChartDetail` (línea ~210) añadiendo las props `breakdownProperty={metric.breakdownProperty}` y `lineChartMode={metric.lineChartMode}` en `app/PostHogMobile/src/app/chart-detail.tsx` *(requiere T002)*
- [X] T004 [US1] Agregar la llamada a `useBreakdownSeries` dentro de `LineChartDetail` (con `enabled` condicional) y calcular `hasBreakdown`, `isCumulative`, `activeLoading`, `activeError` en `app/PostHogMobile/src/app/chart-detail.tsx`
- [X] T005 [US1] Construir el array `dataSet` desde `breakdownData.items` usando `BREAKDOWN_COLORS` (y acumular valores si `isCumulative`) y renderizar `<LineChart dataSet={dataSet}>` cuando `hasBreakdown` o `<LineChart data={singleLineData}>` cuando no, en `app/PostHogMobile/src/app/chart-detail.tsx`
- [X] T006 [US1] Añadir el bloque de leyenda de colores (igual al de `LineChartWidget`) debajo del chart cuando `hasBreakdown === true` en `app/PostHogMobile/src/app/chart-detail.tsx`

**Checkpoint**: US1 completa — LineChart con breakdown muestra múltiples líneas + leyenda en detalle; LineChart sin breakdown sigue mostrando una sola línea (sin regresión)

---

## Phase 4: User Story 2 — Editar breakdown de LineChart en edit-chart (Priority: P1)

**Goal**: `edit-chart.tsx` muestra la sección "Breakdown" para LineChart, permitiendo agregar, cambiar o quitar la propiedad de breakdown, con persistencia correcta

**Independent Test**: Abrir edit-chart de un LineChart existente, verificar que aparece sección "Breakdown", seleccionar una propiedad, guardar, y confirmar que el dashboard refleja el nuevo breakdown.

### Implementación

- [X] T007 [P] [US2] Añadir `LineChartMode` al import de tipos existente y declarar `const isLineChart = metric?.chartType === 'LineChart'` en `app/PostHogMobile/src/app/edit-chart.tsx`
- [X] T008 [US2] Cambiar la condición de `usePropertyDefinitions` de `isBarChart ? eventName : ''` a `(isBarChart || isLineChart) ? eventName : ''` en `app/PostHogMobile/src/app/edit-chart.tsx`
- [X] T009 [US2] En `app/PostHogMobile/src/app/edit-chart.tsx`: (a) extender `hasChanges` añadiendo `(isLineChart && breakdownProperty !== metric?.breakdownProperty)`; (b) extender `handleSave` para persistir `breakdownProperty` cuando `isLineChart` y llamar a `queryClient.invalidateQueries({ queryKey: ['breakdown_series', ..., metricId] })` al guardar (FR-006); (c) verificar/extender el handler del event picker para que resetee `breakdownProperty` a `undefined` también cuando `isLineChart`, igual que lo hace para `isBarChart` (FR-007, US2-AC6)
- [X] T010 [US2] Cambiar la condición de la sección Breakdown en el render de `{isBarChart && !isFunnel && (...)}` a `{(isBarChart || isLineChart) && !isFunnel && (...)}` (el selector de modo BarChart `{isBarChart && breakdownProperty && (...)}` no cambia) en `app/PostHogMobile/src/app/edit-chart.tsx`

**Checkpoint**: US2 completa — edit-chart muestra y persiste breakdown para LineChart; BarChart no tiene regresión

---

## Phase 5: User Story 3 — Tooltip interactivo con breakdown en detalle (Priority: P2)

**Goal**: Al activar el pointer en el detalle del LineChart con breakdown, el tooltip muestra la fecha y los valores de cada serie de breakdown

**Independent Test**: Abrir detalle de LineChart con breakdown, tocar/arrastrar el pointer, verificar que el tooltip lista las series con sus valores para esa fecha.

### Implementación

- [ ] T011 [US3] Adaptar el `pointerLabelComponent` en `LineChartDetail` para que, cuando `hasBreakdown`, itere sobre `breakdownData.items` y muestre el `breakdownValue` y el `value` de cada serie en `app/PostHogMobile/src/app/chart-detail.tsx`
- [ ] T012 [US3] Asegurar que el `selectedIndex` del `pointerConfig` está sincronizado con el orden de `breakdownData.items` en `dataSet`; si el orden difiere, reordenar `dataSet` para mantener la correspondencia posicional al construirlo en T005, en `app/PostHogMobile/src/app/chart-detail.tsx`

**Checkpoint**: US3 completa — tooltip de breakdown funcional; tooltip de modo normal sin regresión

---

## Phase Final: Verificación y No-Regresión

- [ ] T013 Verificar no-regresión: BarChart con breakdown sigue mostrando múltiples barras/líneas en dashboard, detalle y edit-chart (`app/PostHogMobile/src/app/chart-detail.tsx`, `app/PostHogMobile/src/app/edit-chart.tsx`)
- [ ] T014 Verificar no-regresión: LineChart sin breakdown sigue mostrando serie única en dashboard y en detalle (`app/PostHogMobile/src/app/chart-detail.tsx`)
- [ ] T015 Verificar modo cumulative con breakdown: cada línea en el detalle acumula sus propios valores, al igual que en el widget del dashboard (`app/PostHogMobile/src/app/chart-detail.tsx`)

---

## Dependency Graph

```
T001 (setup — leer referencia)
  ├── T002 [P] [US1] call site (chart-detail.tsx)
  │     └── T003 [US1] firma + useBreakdownSeries
  │           └── T004 [US1] hook calls + estado
  │                 └── T005 [US1] dataSet + render
  │                       └── T006 [US1] leyenda
  │                             └── T011 [US3] tooltip breakdown
  │                                   └── T012 [US3] verificar pointer
  │
  └── T007 [P] [US2] import + isLineChart (edit-chart.tsx)
        └── T008 [US2] usePropertyDefinitions
              └── T009 [US2] hasChanges + handleSave
                    └── T010 [US2] render Breakdown section

T002 y T007 son el punto de entrada de las dos ramas en paralelo (diferente archivo).
Dentro de la rama US1: T002 → T003 → T004 → T005 → T006 son secuenciales.
T011-T012 (US3) dependen de T006 (US1 completa).
T013-T015 (no-regresión) requieren US1 + US2 completas.
Nota: `[P]` en T002 y T007 indica paralelismo *entre* ramas (US1 vs US2), no paralelismo *interno* dentro de cada cadena.
```

## Parallel Execution

| Grupo A (US1 — chart-detail.tsx) | Grupo B (US2 — edit-chart.tsx) |
|----------------------------------|-------------------------------|
| T002 → T003 → T004 → T005 → T006 | T007 → T008 → T009 → T010 |

Ambos grupos pueden comenzar simultáneamente después de T001.

## Implementation Strategy

**MVP (entrega mínima)**: Completar Phase 3 (US1) + Phase 4 (US2) — ambas son P1.  
**Incremento 2**: Phase 5 (US3, tooltip) — mejora de UX, no bloqueante.  
**Cierre**: Phase Final (verificación de no-regresión).

**Total tasks**: 15  
**US1**: 5 tareas (T002–T006)  
**US2**: 4 tareas (T007–T010)  
**US3**: 2 tareas (T011–T012)  
**Setup + No-regresión**: 4 tareas (T001, T013–T015)
