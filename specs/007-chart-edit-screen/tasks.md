---
description: "Task list for 007-chart-edit-screen feature"
---

# Tasks: Pantalla de Edición de Chart

**Input**: `specs/007-chart-edit-screen/`  
**Prerequisites**: spec.md ✅, plan.md ✅  
**Depends on**: `006-funnel-chart-widget` completamente implementado

**Tests**: No test runner configurado. Verificación manual.

**Organization**: Tasks agrupados por fase. Las fases son secuenciales; dentro de cada fase, los tasks marcados [P] pueden ejecutarse en paralelo.

## Format: `- [x|·] [ID] [P?] [US#] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias incompletas)
- **[US#]**: User story a la que pertenece la tarea
- Rutas relativas a `app/PostHogMobile/src/`

---

## Phase 1: Data Model — Extensión de tipos y persistencia

**Purpose**: Añadir el campo `math` al modelo de datos y exponer `updateMetric` en el hook de configuración. Bloqueante para todas las fases posteriores.

- [x] T001 [US4] Actualizar `types/dashboard.ts`: añadir campo opcional `math?: 'dau'` a la interfaz `DashboardMetric`. Añadir type alias `AggregationMath = 'dau'` para documentar el valor.

- [x] T002 [US2][US3][US4] Añadir función `updateMetric(id: string, changes: Partial<Pick<DashboardMetric, 'label' | 'eventName' | 'math'>>)` al hook `useDashboardConfig`. La función debe:
  - Buscar la métrica por `id` en el array actual.
  - Aplicar los cambios parciales (`{ ...metric, ...changes }`).
  - Persistir en AsyncStorage.
  - Actualizar el estado local.

**Checkpoint**: Tipos y hook listos para la pantalla de edición.

---

## Phase 2: API Layer — Soporte de `math` en queries

**Purpose**: Modificar las funciones de API y hooks para que pasen el parámetro `math` a PostHog cuando esté definido.

- [x] T003 [P] [US4] Modificar `queryMetricValue` en `services/posthog-api.ts`: añadir parámetro opcional `math?: string`. En el body de la query, usar `math: math ?? 'total'` en el `series[0]` del `TrendsQuery`.

- [x] T004 [P] [US4] Modificar `queryMetricSeries` en `services/posthog-api.ts`: añadir parámetro opcional `math?: string`. En el body de la query, usar `math: math ?? 'total'` en el `series[0]` del `TrendsQuery`.

- [x] T005 [US4] Modificar `useMetricValue` en `hooks/useMetricValue.ts`: añadir parámetro `math?: string` a la firma. Incluir `math` en el `queryKey` (para que cambios de math generen queries distintos). Pasar `math` a `queryMetricValue`.

- [x] T006 [US4] Modificar `useMetricSeries` en `hooks/useMetricSeries.ts`: añadir parámetro `math?: string` a la firma. Incluir `math` en el `queryKey`. Pasar `math` a `queryMetricSeries`.

- [x] T007 [US4] Actualizar las llamadas a `useMetricValue` y `useMetricSeries` en los componentes `MetricCard.tsx`, `BarChartWidget.tsx`, `LineChartWidget.tsx` para pasar `metric.math` como argumento.

**Checkpoint**: La capa de datos soporta agregación `dau`.

---

## Phase 3: Navigation — Ruta stack para edición

**Purpose**: Crear la ruta de navegación y la pantalla de edición.

- [x] T008 [US1] Actualizar `app/_layout.tsx`: añadir `<Stack.Screen name="edit-chart" options={{ headerShown: false }} />` al Stack de navegación principal (fuera de tabs).

- [x] T009 [US1][US2][US3][US4][US5] Crear `app/edit-chart.tsx`: pantalla de edición con las siguientes secciones:
  - **Header**: Botón "Volver" (router.back) y título "Editar Chart".
  - **Campo nombre**: `TextInput` pre-rellenado con `metric.label`. Editable.
  - **Selector de evento** (solo no-funnel): Muestra el evento actual. Al tocar, abre `Modal` con buscador + `FlatList` de eventos (usa `useEventDefinitions`). Al seleccionar, actualiza el evento seleccionado local.
  - **Selector de agregación** (solo no-funnel): Dos opciones "Total Events" y "Unique Users" como toggle/segmented control.
  - **Botón Guardar**: Deshabilitado si nombre vacío/solo espacios. Al presionar: llama a `updateMetric(id, changes)`, invalida caché si cambió evento o math (`queryClient.removeQueries` para todas las entradas del metricId), y navega de vuelta con `router.back()`.
  - **Botón Eliminar** (rojo, abajo): Muestra `Alert.alert` de confirmación. Al confirmar: llama a `removeMetric(id)`, invalida caché, y navega al dashboard.

**Checkpoint**: Pantalla de edición completa y funcional.

---

## Phase 4: Dashboard Integration — Tap to edit

**Purpose**: Conectar los widgets del dashboard con la pantalla de edición al hacer tap.

- [x] T010 [US1] Modificar `app/(tabs)/dashboard.tsx`:
  - Envolver cada widget en un `Pressable` (o `TouchableOpacity`) que al hacer `onPress` navega a `/edit-chart?id=${metric.id}`.
  - Eliminar la prop `onDelete` que se pasaba a cada widget.
  - Actualizar `handleRefresh` para pasar `metric.math` a las funciones de query (`queryMetricValue`, `queryMetricSeries`).

**Checkpoint**: Tap en cualquier chart navega a edición.

---

## Phase 5: Widget Cleanup — Eliminar long-press y onDelete

**Purpose**: Remover la funcionalidad de long-press y la prop `onDelete` de todos los widgets de chart.

- [x] T011 [P] [US6] Modificar `components/MetricCard.tsx`: eliminar la prop `onDelete` del tipo de Props, eliminar el handler de `onLongPress`, eliminar el import de `Alert` y `Haptics` (si no se usan para otra cosa), y eliminar el `Pressable`/`TouchableOpacity` wrapper del long-press.

- [x] T012 [P] [US6] Modificar `components/BarChartWidget.tsx`: eliminar la prop `onDelete`, el handler de `onLongPress`, y las dependencias de haptics/alert relacionadas.

- [x] T013 [P] [US6] Modificar `components/LineChartWidget.tsx`: eliminar la prop `onDelete`, el handler de `onLongPress`, y las dependencias de haptics/alert relacionadas.

- [x] T014 [P] [US6] Modificar `components/FunnelChart.tsx`: eliminar la prop `onDelete`, el handler de `onLongPress`, y las dependencias de haptics/alert relacionadas.

**Checkpoint**: Long-press ya no activa eliminación en ningún widget.

---

## Phase 6: Verification

**Purpose**: Verificación manual end-to-end.

- [x] T015 Verificar que `npx tsc --noEmit` pasa sin errores (type-check completo).

- [ ] T016 Verificación manual del flujo completo:
  1. Tap en MetricCard → abre edición → cambiar nombre → guardar → ver nombre actualizado.
  2. Tap en BarChart → cambiar evento → guardar → ver datos del nuevo evento.
  3. Tap en LineChart → cambiar agregación a Unique Users → guardar → ver datos actualizados.
  4. Tap en FunnelChart → solo nombre y eliminar visibles → cambiar nombre → guardar.
  5. Eliminar un chart desde la pantalla de edición → confirmar → chart desaparece del dashboard.
  6. Long-press en cualquier widget → NO aparece diálogo de eliminación.
  7. Cerrar y reabrir app → todos los cambios persisten.
