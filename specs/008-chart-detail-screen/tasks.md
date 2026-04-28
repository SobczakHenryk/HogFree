# Tasks: Pantalla de Detalle de Chart (Interactive Pointer)

**Input**: `specs/008-chart-detail-screen/`  
**Prerequisites**: spec.md ✅, plan.md ✅  
**Depends on**: `007-chart-edit-screen` completamente implementado

**Tests**: No test runner configurado. Verificación manual.

**Organization**: Tasks agrupados por fase. Las fases son secuenciales.

## Format: `- [x|·] [ID] Description`

- Rutas relativas a `app/PostHogMobile/src/`

---

## Phase 1: Chart Detail Screen

**Purpose**: Crear la pantalla de detalle con chart expandido, pointer interactivo, y time filter local.

- [x] T001 [US1][US2][US3][US4][US5] Crear `app/chart-detail.tsx`:
  - Recibe `id` y `timeFilter` como query params (`useLocalSearchParams`).
  - **Header**: Botón ← (`router.back()`), título centrado (`metric.label`), icono ⚙️ que navega a `/edit-chart?id=...`.
  - **Chart expandido** según `chartType`:
    - `LineChart`: Reutiliza `useMetricSeries`. Renderiza `LineChart` de gifted-charts con `pointerConfig` habilitado (pointer strip, tooltip con fecha y valor).
    - `BarChart`: Igual que LineChart pero con `BarChart` y `pointerConfig` apropiado.
    - `MetricCard`: Muestra valor numérico grande, nombre, y last refresh usando `useMetricValue`.
    - `FunnelChart`: Muestra funnel expandido usando `useFunnelInsight`.
  - **TimeFilterBar**: Filtro de tiempo local inicializado desde query param.
  - **Guard**: Si métrica no encontrada, mostrar mensaje + botón volver.
  - **Sync**: Usa `useFocusEffect` para re-leer `useDashboardConfig().reload()` cuando vuelve de edit-chart (para reflejar cambios de nombre/evento).

- [x] T002 [US1] Actualizar `app/_layout.tsx`: añadir `'chart-detail'` a la lista de rutas permitidas en el guard de navegación (junto a `edit-chart`).

**Checkpoint**: Pantalla de detalle funcional con pointer.

---

## Phase 2: Dashboard Integration

**Purpose**: Conectar el dashboard con la nueva pantalla de detalle.

- [x] T003 [US1] Modificar `app/(tabs)/dashboard.tsx`:
  - Cambiar el `onPress` del `Pressable` wrapper de cada widget: de `router.push('/edit-chart?id=...')` a `router.push('/chart-detail?id=...&timeFilter=...')` pasando el `timeFilter` actual del dashboard.
  - Actualizar `accessibilityLabel` de "Editar" a "Ver detalle de".

**Checkpoint**: Tap en chart → detalle. Desde detalle, ⚙️ → edición.

---

## Phase 3: Verificación

- [x] T004 Verificar que `npx tsc --noEmit` pasa sin errores.

- [ ] T005 Verificación manual:
  1. Tap en LineChart → pantalla de detalle → deslizar dedo muestra pointer con fecha y valor.
  2. Tap en BarChart → pantalla de detalle → deslizar dedo muestra pointer con fecha y valor.
  3. Tap en MetricCard → pantalla de detalle → muestra valor grande sin pointer.
  4. Tap en FunnelChart → pantalla de detalle → muestra funnel expandido sin pointer.
  5. Cambiar time filter en detalle → chart se actualiza.
  6. Tap ⚙️ → abre edición → cambiar nombre → guardar → volver a detalle → nombre actualizado.
  7. ← desde detalle → vuelve al dashboard.
