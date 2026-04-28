# Implementation Plan: Funnel Chart Widget

**Branch**: `006-funnel-chart-widget` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-funnel-chart-widget/spec.md`

## Summary

Implementar el widget FunnelChart para el dashboard de PostHog Mobile: visualización de embudos de conversión con barras horizontales descendentes, porcentajes de conversión entre pasos, gradiente de color según caída de usuarios, y hook `useFunnelInsight` conectado a la PostHog Query API (`FunnelsQuery`). El flujo de creación (AddMetricSheet) se extiende con un tercer paso para configurar entre 2 y 10 eventos del funnel, incluyendo un campo de **nombre personalizado** (`DashboardMetric.label`) que se muestra como título del widget mientras las barras internas mantienen los nombres de los eventos de PostHog (`FunnelStep.name`). Los datos se cachean con TanStack Query (`staleTime: Infinity`, `gcTime: 24h`) y se actualizan solo via pull-to-refresh.

## Technical Context

**Language/Version**: TypeScript ~5.9.2, React 19.1.0
**Primary Dependencies**: React Native 0.81.5 (New Architecture), Expo ~54.0.33, Expo Router ~6.0.23, TanStack Query ^5.90.21, NativeWind ^4.2.1, @gorhom/bottom-sheet ^5.2.8, @shopify/flash-list ^2.2.2, ky ^1.14.3, expo-haptics ^15.0.8
**Storage**: AsyncStorage (config `DASHBOARD_METRICS_CONFIG` + TanStack Query cache via `PersistQueryClientProvider`), SecureStore (API Key — ya existente)
**Testing**: Manual (no test runner configurado en el proyecto)
**Target Platform**: iOS + Android (mobile-first, portrait fija, dark only)
**Project Type**: Mobile app (Expo managed workflow + New Architecture)
**Performance Goals**: Render del widget FunnelChart desde cache < 500ms; query de funnel < 5s con red normal; animaciones de barras a 60fps
**Constraints**: Offline-capable (datos visibles sin red desde cache); New Architecture compatible (Fabric/JSI only); sin refresco automático en background; máximo 10 pasos por funnel
**Scale/Scope**: 1 componente de visualización nuevo (`FunnelChart`), 1 hook nuevo (`useFunnelInsight`), 1 función de servicio nueva (`queryFunnelInsight`), extensión de `AddMetricSheet` (tercer paso + campo nombre personalizado), extensión de tipos (`ChartType`, `DashboardMetric`, nuevas interfaces)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla Constitution | Estado | Notas |
|---|---|---|
| Componentes nunca llaman directamente a la API (siempre via hooks) | ✅ PASS | `FunnelChart` usa `useFunnelInsight` hook; nunca llama a `queryFunnelInsight` directamente |
| Hooks usan `useQuery` / `useMutation` de TanStack Query | ✅ PASS | `useFunnelInsight` usa `useQuery<FunnelResult>` |
| API Key nunca expuesta en UI ni logs | ✅ PASS | Solo pasa internamente a `ky` en `posthog-api.ts` |
| Dark only, fondo `#0D0D0D`, glassmorphism sutil | ✅ PASS | Widget usa `bg-background-secondary` (`#1A1A1A`) con bordes `border-border` |
| Solo librerías compatibles con New Architecture (Fabric/JSI) | ✅ PASS | No se añaden dependencias nuevas; `Animated` core de RN, `Modal` nativo, `FlatList` nativo |
| No añadir dependencias fuera del stack existente | ✅ PASS | Todas las librerías usadas ya están en `package.json` |
| staleTime: 1h, gcTime: 24h (por constitution) | ⚠️ EXCEPCIÓN JUSTIFICADA | Para funnels se usa `staleTime: Infinity` (FR-011 exige refresco solo por pull-to-refresh). `gcTime: 24h` se mantiene. Mismo patrón que `useMetricValue` y `useMetricSeries`. |
| Color de funnels: `accent.purple` (`#7C3AED`) | ✅ PASS | Barras usan gradiente desde `#7B61FF` (≈ accent.purple) hasta `#2E2E4A` (apagado) |
| Fuente exclusiva Inter | ✅ PASS | Todos los textos usan clases `font-inter*` via NativeWind |

**Post-design re-check**: ✅ Sin violaciones adicionales. La excepción de `staleTime: Infinity` está justificada por FR-011 y es consistente con el patrón del dashboard (specs 003 y 005).

## Requirements Coverage

### Functional Requirements Map

| FR | Descripción | Componente/Archivo | User Story |
|---|---|---|---|
| FR-001 | Consultar `FunnelsQuery` a la API PostHog | `posthog-api.ts` → `queryFunnelInsight()`, `useFunnelInsight` hook | US-1 |
| FR-002 | Barras con **nombre del evento PostHog** y conteo | `FunnelChart.tsx` — cada `FunnelStep` renderiza `step.name` (no `metric.label`) | US-1, US-5 |
| FR-003 | Porcentaje de conversión entre pasos consecutivos + usuarios perdidos | `FunnelChart.tsx` — row intermedio entre barras | US-1 |
| FR-004 | Porcentaje de conversión total en footer del widget | `FunnelChart.tsx` — footer | US-1 |
| FR-005 | Gradiente de color por ratio de conversión | `FunnelChart.tsx` → `interpolateColor(ratio)` | US-3 |
| FR-006 | Configurar 2–10 eventos en `AddMetricSheet` (paso 3 `funnelSteps`) con modal de selección | `AddMetricSheet.tsx` — step `'funnelSteps'`, `Modal` con `TextInput` + `FlatList` | US-2 |
| FR-007 | Skeleton animado durante carga | `FunnelChart.tsx` — estado loading | US-1 |
| FR-008 | Estado de error legible | `FunnelChart.tsx` — estado error | US-1 |
| FR-009 | "Sin datos para este período" cuando vacío | `FunnelChart.tsx` — estado empty | US-1 |
| FR-010 | Persistencia en AsyncStorage | `useDashboardConfig.ts` — `funnelEvents` en `DashboardMetric` | US-2 |
| FR-011 | Pull-to-refresh actualiza datos | `useFunnelInsight` con `queryClient.invalidateQueries` en pull-to-refresh del dashboard | US-4 |
| FR-012 | Eliminar FunnelChart via long-press | `FunnelChart.tsx` + `dashboard.tsx` — mismo patrón que MetricCard | US-1 |
| FR-013 | Eliminar pasos intermedios (reordenable, mínimo 2) | `AddMetricSheet.tsx` — botón eliminar por paso, deshabilitado si ≤ 2 | US-2 |
| **FR-014** | **Campo de nombre personalizado** pre-rellenado con `funnelSteps[0]`, almacenado en `DashboardMetric.label` | `AddMetricSheet.tsx` — `TextInput` para nombre antes de confirmar | **US-5** |
| **FR-015** | **Título del widget = `DashboardMetric.label`** (nombre personalizado); barras internas = `FunnelStep.name` (evento PostHog) | `FunnelChart.tsx` — título usa `metric.label`, barras usan `step.name` | **US-5** |
| **FR-016** | **Botón confirmar deshabilitado si nombre vacío** (solo espacios no cuenta) | `AddMetricSheet.tsx` — validación `funnelName.trim().length === 0` → disabled | **US-5** |

### User Stories Map

| US | Título | Priority | FRs Cubiertos |
|---|---|---|---|
| US-1 | Visualizar un funnel de conversión en el dashboard | P1 | FR-001, FR-002, FR-003, FR-004, FR-007, FR-008, FR-009, FR-012 |
| US-2 | Configurar un funnel de hasta 10 pasos al añadir una métrica | P1 | FR-006, FR-010, FR-013, FR-014 |
| US-3 | Gradiente de color para indicar caída de usuarios | P2 | FR-005 |
| US-4 | Pull-to-refresh del funnel | P2 | FR-011 |
| US-5 | Nombre personalizado para el FunnelChart | P1 | FR-014, FR-015, FR-016 |

## Project Structure

### Documentation (this feature)

```text
specs/006-funnel-chart-widget/
├── plan.md              # Este archivo
├── research.md          # Decisiones: PostHog FunnelsQuery API, cache, animación, color, flujo UI
├── data-model.md        # Interfaces: FunnelStep, FunnelResult, DashboardMetric (extensión)
├── quickstart.md        # Guía de verificación manual
├── contracts/
│   └── posthog-api.md   # Contrato de queryFunnelInsight()
├── checklists/
│   └── requirements.md  # Checklist de requisitos
└── tasks.md             # (Phase 2 — generado por /speckit.tasks)
```

### Source Code

```text
app/PostHogMobile/
└── src/
    ├── components/
    │   ├── FunnelChart.tsx               # NUEVO: widget de embudo de conversión
    │   │   ├── Título: metric.label (nombre personalizado, FR-015)
    │   │   ├── Barras: step.name (nombre evento PostHog, FR-002/FR-015)
    │   │   ├── Conversión entre pasos (FR-003)
    │   │   ├── Footer: conversión total (FR-004)
    │   │   ├── Gradiente de color (FR-005)
    │   │   ├── Estados: loading/error/empty (FR-007/FR-008/FR-009)
    │   │   └── Long-press para eliminar (FR-012)
    │   └── AddMetricSheet.tsx            # MODIFICAR: añadir paso 3 funnelSteps + campo nombre personalizado
    │       ├── Step 'funnelSteps': config pasos 2–10 (FR-006/FR-013)
    │       ├── Modal con TextInput + FlatList para selección de eventos (FR-006)
    │       ├── TextInput para nombre personalizado pre-rellenado con funnelSteps[0] (FR-014)
    │       └── Botón confirmar disabled si nombre vacío/whitespace (FR-016)
    ├── hooks/
    │   └── useFunnelInsight.ts           # NUEVO: TanStack Query hook para FunnelsQuery
    ├── services/
    │   └── posthog-api.ts               # MODIFICAR: añadir queryFunnelInsight()
    ├── types/
    │   ├── index.ts                     # MODIFICAR: re-exportar FunnelStep, FunnelResult
    │   └── dashboard.ts                 # MODIFICAR: añadir FunnelStep, FunnelResult; extender ChartType, DashboardMetric
    └── app/
        └── (tabs)/
            └── dashboard.tsx            # MODIFICAR: renderizar FunnelChart + invalidar queries en pull-to-refresh
```

**Structure Decision**: Mobile single-project layout, siguiendo la arquitectura existente (misma que specs 003, 005). No se añaden nuevas subcarpetas — se extienden los archivos existentes en `components/`, `hooks/`, `services/`, `types/`. El campo `label` en `DashboardMetric` (ya existente) se reutiliza para el nombre personalizado del funnel.

## Design Decisions

### Nombre Personalizado (FR-014 / FR-015 / FR-016)

**Decisión**: El nombre personalizado se almacena en `DashboardMetric.label` (campo ya existente). El flujo de creación del FunnelChart incluye un `TextInput` editable que se pre-rellena con el nombre del primer evento (`funnelSteps[0]`). El usuario puede modificarlo libremente.

**Separación título vs. barras (FR-015)**:
- `FunnelChart.tsx` muestra `metric.label` como título del widget (nombre personalizado).
- Cada barra del funnel muestra `FunnelStep.name` (nombre del evento PostHog devuelto por la API).
- Esta separación es intencional: el título comunica el propósito del funnel ("Embudo de Compra"), mientras las barras mantienen los nombres técnicos exactos de los eventos.

**Validación (FR-016)**:
- El botón de confirmar comprueba `funnelName.trim().length > 0`.
- Solo espacios en blanco no es válido.
- Pre-relleno con `funnelSteps[0]` garantiza que siempre hay un valor por defecto razonable.

**Persistencia**:
- `label` ya se persiste en AsyncStorage como parte de `DashboardMetric`.
- No requiere migración ni cambio de schema.

### Selector de Eventos (Clarificación 2026-03-19)

**Decisión**: Botón "Agregar paso..." que abre un `Modal` nativo (`animationType="slide"`) con `TextInput` de búsqueda (autoFocus) y `FlatList` de eventos filtrados. Al seleccionar un evento, el modal cierra y el evento se añade a la lista.

**Rationale**: Evita el problema de scroll anidado que ocurría con `TextInput` + `BottomSheetFlashList` inline dentro del `BottomSheet`.

### Cache Strategy

**Decisión**: `staleTime: Infinity`, `gcTime: 24h`, `queryKey: ['funnel', cloudRegion, metricId, timeFilter]`.

**Rationale**: Consistente con `useMetricValue` y `useMetricSeries`. Sin refresco automático; el usuario controla via pull-to-refresh (FR-011).

### Animación de Barras

**Decisión**: `Animated.timing` con delay cascada (`index * 80ms`), duración 500ms, `useNativeDriver: false`.

**Rationale**: `width` no soporta native driver, pero la complejidad de `react-native-reanimated` no se justifica para esta animación simple.

### Interpolación de Color

**Decisión**: RGB lineal entre `#7B61FF` (primary/purple) y `#2E2E4A` (muted), con ratio mínimo `0.15`.

**Rationale**: Comunica la caída del funnel visualmente. El ratio mínimo evita barras completamente negras.

## Complexity Tracking

> No hay violaciones de constitution que requieran justificación adicional. La excepción de `staleTime: Infinity` se documenta en Constitution Check arriba.
