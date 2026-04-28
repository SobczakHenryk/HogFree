---
description: "Task list for 006-funnel-chart-widget feature"
---

# Tasks: Funnel Chart Widget

**Input**: `specs/006-funnel-chart-widget/`  
**Prerequisites**: spec.md ✅, plan.md ✅, data-model.md ✅, research.md ✅, contracts/posthog-api.md ✅, quickstart.md ✅  
**Depends on**: `005-chart-widgets` completamente implementado

**Tests**: No test runner configurado. Verificación manual (ver `quickstart.md`).

**Estado**: FR-001 a FR-013 completamente implementados. FR-014, FR-015, FR-016 (User Story 5 — nombre personalizado) pendientes de implementación.

**Organization**: Tasks agrupados por user story. US1/US2 son P1 (ya completados). US3/US4 son P2 (ya completados). US5 es P1 (pendiente — requiere US2 completado).

## Format: `- [x|·] [ID] [P?] [StoryN] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias incompletas)
- **[US#]**: User story a la que pertenece la tarea
- Rutas relativas a `app/PostHogMobile/src/`

---

## Phase 1: Setup — Verificación de Dependencias

**Purpose**: Confirmar que las dependencias necesarias para FunnelChart están disponibles antes de implementar.

- [x] T001 Verificar que `expo-linear-gradient` está instalado en `app/PostHogMobile/package.json` (`npx expo install expo-linear-gradient`). **Resultado**: instalado y disponible (aunque se usa interpolación RGB en JS).
- [x] T002 Verificar compatibilidad de `Animated.timing` sobre la propiedad `width` con New Architecture (Fabric/JSI). **Resultado**: compatible — `useNativeDriver: false` requerido para propiedades de layout.

**Checkpoint**: ✅ Sin nuevas dependencias necesarias.

---

## Phase 2: Fundación — Tipos y Servicio API

**Purpose**: Extender el data model y el servicio PostHog existente para soportar FunnelsQuery. Bloqueante para US1–US5.

**⚠️ CRÍTICO**: Ninguna tarea de fase 3+ puede comenzar hasta completar esta fase.

- [x] T003 Actualizar `types/dashboard.ts`: añadir `'FunnelChart'` a `ChartType`, añadir interfaces `FunnelStep` y `FunnelResult`, añadir campo opcional `funnelEvents?: string[]` a `DashboardMetric`.
- [x] T004 [P] Actualizar `types/index.ts`: re-exportar `FunnelStep` y `FunnelResult` desde `types/dashboard.ts`.
- [x] T005 Añadir `queryFunnelInsight()` en `services/posthog-api.ts`. Body con `kind: 'FunnelsQuery'`, `funnelOrderType: 'ordered'`, `funnelVizType: 'steps'`. Normalizar `results[0] ?? []`.

**Checkpoint**: ✅ Tipos y servicio listos.

---

## Phase 3: User Story 1 — Visualizar un funnel de conversión (Priority: P1) 🎯 MVP

**Goal**: Widget FunnelChart con barras horizontales proporcionales, conteos, porcentajes de conversión entre pasos y footer con conversión total.

**Independent Test**: Añadir un FunnelChart al dashboard y verificar barras, conteos, porcentajes, y estados de carga/error/vacío.

- [x] T006 Crear `hooks/useFunnelInsight.ts` con `useQuery<FunnelResult>`. `queryKey: ['funnel', cloudRegion, metricId, timeFilter]`. `enabled: !!projectInfo && events.length >= 2`. `staleTime: Infinity`, `gcTime: 24h`.
- [x] T007 [P] Actualizar `hooks/index.ts`: export de `useFunnelInsight`.
- [x] T008 [US1] Crear `components/FunnelChart.tsx`: barras proporcionales con nombre de evento (`step.name`) y conteo, conversión entre steps consecutivos + usuarios perdidos, footer con conversión total, skeleton/error/empty states, long-press para eliminar. Props: `metric`, `timeFilter`, `onDelete`.
- [x] T009 [P] [US1] Actualizar `components/index.ts`: export de `FunnelChart`.
- [x] T010 [US1] Integrar en `app/(tabs)/dashboard.tsx`: `case 'FunnelChart'` en `renderItem` del `FlashList`.

**Checkpoint**: ✅ US1 completamente funcional.

---

## Phase 4: User Story 2 — Configurar un funnel de hasta 10 pasos (Priority: P1)

**Goal**: Crear un FunnelChart desde el bottom sheet con flujo de 3 pasos (evento → tipo → configuración funnel). Persiste en AsyncStorage.

**Independent Test**: Flujo completo desde "+" → evento → "Funnel" → añadir pasos → confirmar. Widget aparece y persiste tras reinicio.

- [x] T011 [US2] Extender `hooks/useDashboardConfig.ts`: campo opcional `funnelEvents?: string[]` en `NewMetricInput` y en `addMetric`.
- [x] T012 [US2] Añadir opción `'FunnelChart'` en el Paso 2 de `components/AddMetricSheet.tsx`. Al seleccionar y pulsar "Continuar", navegar al Paso 3 (`'funnelSteps'`).
- [x] T013 [US2] Implementar Paso 3 (`'funnelSteps'`) en `components/AddMetricSheet.tsx`: lista ordenada (ScrollView), evento del Paso 1 pre-cargado como paso 1, botón eliminar (min 2 pasos), botón "Agregar paso..." que abre `Modal` nativo con `TextInput` autoFocus + `FlatList` de eventos filtrados, límite 10 pasos, botón "Añadir funnel" deshabilitado si < 2 pasos.
- [x] T014 [US2] Actualizar `handleAddMetric` en `app/(tabs)/dashboard.tsx`: aceptar `funnelEvents?: string[]` y pasarlos a `addMetric`.

**Checkpoint**: ✅ Flujo de creación end-to-end funcional.

---

## Phase 5: User Story 3 — Gradiente de color según caída de usuarios (Priority: P2)

**Goal**: Barras con color degradado desde #7B61FF (alta conversión) a #2E2E4A (alta caída).

**Independent Test**: Primera barra = púrpura primario, barras con menor conversión degradan visualmente.

- [x] T015 [US3] Implementar `interpolateColor(ratio)` en `components/FunnelChart.tsx`: interpolación RGB lineal con ratio mínimo 0.15. Animar ancho con `Animated.timing` (500ms, delay cascada `index * 80ms`).

**Checkpoint**: ✅ Gradiente visual funcional.

---

## Phase 6: User Story 4 — Pull-to-refresh del FunnelChart (Priority: P2)

**Goal**: Pull-to-refresh actualiza datos del FunnelChart desde la API.

**Independent Test**: Pull-to-refresh con FunnelChart → spinner → datos actualizados.

- [x] T016 [US4] En `app/(tabs)/dashboard.tsx` → `handleRefresh`: caso `'FunnelChart'` que invalida el cache con `queryClient.invalidateQueries({ queryKey: getFunnelQueryKey(...) })`.

**Checkpoint**: ✅ Pull-to-refresh consistente con el resto de widgets.

---

## Phase 7: User Story 5 — Nombre personalizado para el FunnelChart (Priority: P1)

**Goal**: Al crear un FunnelChart, el usuario asigna un nombre personalizado (ej. "Embudo de Compra") que se muestra como título del widget. Las barras internas mantienen los nombres de los eventos de PostHog.

**Independent Test**: Crear un FunnelChart, escribir un nombre personalizado, confirmar. Verificar que (a) el título del widget muestra el nombre personalizado, (b) las barras muestran nombres de eventos PostHog, (c) el nombre persiste tras cerrar y reabrir la app.

**FRs cubiertos**: FR-014, FR-015, FR-016

### Implementación para User Story 5

- [x] T018 [US5] Añadir estado `funnelName` en `components/AddMetricSheet.tsx` e inicializarlo con `funnelSteps[0]` al transicionar al paso `'funnelSteps'`. En `handleChartTypeNext`, al hacer `setStep('funnelSteps')`, añadir `setFunnelName(selectedEvent?.name ?? '')`. En `resetSheet`, añadir `setFunnelName('')`. Archivo: `components/AddMetricSheet.tsx`.
- [x] T019 [US5] Añadir un `TextInput` para el nombre personalizado del funnel en el paso `'funnelSteps'` de `components/AddMetricSheet.tsx`. Ubicar **debajo** de la lista de pasos y **encima** del botón "Añadir funnel". El TextInput debe: mostrar placeholder "Nombre del funnel" con `placeholderTextColor="#737373"`, binding bidireccional con `funnelName`/`setFunnelName`, label visible "Nombre del funnel" (`Text` encima del input), estilo consistente con los demás inputs del sheet (`rounded-xl bg-background px-4 py-3 text-text-primary`). El valor por defecto visible debe ser el nombre del primer evento (`funnelSteps[0]`). Archivo: `components/AddMetricSheet.tsx`.
- [x] T020 [US5] Actualizar la condición de habilitación del botón "Añadir funnel" en `components/AddMetricSheet.tsx`: cambiar de `funnelSteps.length < 2` a `funnelSteps.length < 2 || funnelName.trim().length === 0`. Aplicar la misma condición en la prop `disabled` y en las clases condicionales de estilo (`bg-background-tertiary` / `text-text-tertiary` cuando deshabilitado). Archivo: `components/AddMetricSheet.tsx`.
- [x] T021 [US5] Actualizar `handleConfirm` en `components/AddMetricSheet.tsx`: cuando `selectedChartType === 'FunnelChart'`, cambiar `label: selectedEvent.name` por `label: funnelName.trim()` para que el nombre personalizado se persista en `DashboardMetric.label`. Archivo: `components/AddMetricSheet.tsx`.
- [x] T022 [US5] Verificar que `components/FunnelChart.tsx` ya renderiza correctamente `metric.label` como título del widget (línea `<Text ...>{metric.label}</Text>` en el header) y `step.name` para las barras internas. **No requiere cambios** si la implementación actual ya cumple FR-015 — solo confirmar leyendo el componente.

**Checkpoint**: Al crear un FunnelChart, el usuario escribe un nombre personalizado. El widget muestra ese nombre como título. Las barras muestran nombres de eventos PostHog. El nombre persiste en AsyncStorage via `DashboardMetric.label`.

---

## Phase 8: Polish y Verificación Final

**Purpose**: Validación TypeScript y verificación cruzada de todos los FRs.

- [x] T023 Ejecutar `npx tsc --noEmit` desde `app/PostHogMobile/`. Verificar exit code 0 y sin errores de tipos en `AddMetricSheet.tsx`, `FunnelChart.tsx`, `dashboard.tsx`.
- [ ] T024 Verificación manual end-to-end: crear un FunnelChart con nombre personalizado "Embudo de Prueba", verificar que (1) el título del widget muestra "Embudo de Prueba", (2) las barras muestran los nombres de eventos PostHog, (3) cerrar y reabrir la app → el nombre persiste, (4) campo vacío deshabilita el botón, (5) campo con solo espacios deshabilita el botón. Ver `quickstart.md`.

**Checkpoint Final**: Todos los FRs (FR-001 a FR-016) verificados. TypeScript limpio. Edge cases gestionados.

---

## Dependencias entre User Stories

```
Phase 2 (Fundación) ✅
  ├── US1 (Phase 3) ✅ → US3 (Phase 5) ✅
  │                    → US4 (Phase 6) ✅
  ├── US2 (Phase 4) ✅ → US5 (Phase 7) ⬜ PENDIENTE
  │                    → US4 (Phase 6) ✅
  └── US5 (Phase 7) ⬜ → requiere US2 completado (AddMetricSheet con paso funnelSteps)
```

### Orden de ejecución para tareas pendientes

```
T018 → T019 → T020 → T021 (secuencial — todos modifican AddMetricSheet.tsx)
T022 (independiente — solo lectura de FunnelChart.tsx)
T023 → T024 (secuencial — primero TypeScript, luego verificación manual)
```

## Oportunidades de Paralelización

**Dentro de Phase 7 (US5)**:
- T022 (verificar FunnelChart.tsx) puede ejecutarse en paralelo con T018–T021 ya que no modifica archivos.
- T018–T021 son **secuenciales** (todos modifican `AddMetricSheet.tsx` y cada tarea depende de la anterior).

**Phase 8**:
- T023 y T024 son secuenciales: primero verificar tipos, luego verificación manual.

## Implementación MVP Sugerida

**MVP ya entregado**: Phases 1–6 (US1 + US2 + US3 + US4) = widget visualizable, configurable, con gradiente y pull-to-refresh.

**Incremento pendiente**: Phase 7 (US5) = nombre personalizado. Mejora UX significativa: los títulos descriptivos ("Embudo de Compra") reemplazan nombres técnicos de eventos (`$pageview`).

---

## Resumen

| Fase | US | Tasks | Estado |
|---|---|---|---|
| Phase 1: Setup | — | T001–T002 | ✅ Completo |
| Phase 2: Fundación | — | T003–T005 | ✅ Completo |
| Phase 3: Visualización | US1 | T006–T010 | ✅ Completo |
| Phase 4: Configuración | US2 | T011–T014 | ✅ Completo |
| Phase 5: Gradiente | US3 | T015 | ✅ Completo |
| Phase 6: Pull-to-refresh | US4 | T016 | ✅ Completo |
| Phase 7: Nombre personalizado | US5 | T018–T022 | ⬜ Pendiente |
| Phase 8: Polish | — | T023–T024 | ⬜ Pendiente |

**Total**: 24 tareas | **Completadas**: 17 | **Pendientes**: 7  
**Por US**: US1=5 ✅, US2=4 ✅, US3=1 ✅, US4=1 ✅, US5=5 ⬜ | **Setup/Fundación/Polish**: 8 (6 ✅, 2 ⬜)

## Backlog / Fuera de Scope (esta versión)

- Reordenado via drag-and-drop de los pasos del funnel (arrastrar para cambiar orden)
- Zoom e interacciones táctiles en el widget (tap en paso para ver detalle)
- Comparación de dos funnels en el mismo widget
- Exportar/compartir imagen del funnel
- Breakdowns del funnel por propiedad (ej. por país, dispositivo)
- Configuración de la ventana de conversión (conversion window)
- Anotaciones sobre caídas de conversión anómalas
- Editar nombre personalizado de un funnel existente (requiere flujo de edición)
