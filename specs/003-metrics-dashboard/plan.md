# Implementation Plan: Dashboard de Métricas PostHog

**Branch**: `003-metrics-dashboard` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-metrics-dashboard/spec.md`

## Summary

Añadir la pantalla de Dashboard a PostHogMobile: tarjetas de métricas (`MetricCard`) configurables por el usuario que muestran conteos de eventos de PostHog. El usuario añade métricas seleccionando eventos del proyecto (via bottom sheet que respeta safe area superior), filtra por período de tiempo (8 opciones), refresca los datos con pull-down, y puede eliminar cualquier tarjeta con long press + confirmación. Los datos se cachean con TanStack Query + AsyncStorage (staleTime: Infinity, gcTime: 24h) y se actualizan **solo** bajo demanda, sin refresco automático.

## Technical Context

**Language/Version**: TypeScript ~5.9.2, React 19.1.0  
**Primary Dependencies**: React Native 0.81.5 (New Architecture), Expo ~54.0.33, Expo Router ~6.0.23, TanStack Query ^5.90.21, NativeWind ^4.2.1, @gorhom/bottom-sheet ^5.2.8, @shopify/flash-list ^2.2.2, ky ^1.14.3, date-fns ^4.1.0, expo-haptics ^15.0.8, react-native-safe-area-context (ya en stack)  
**Storage**: AsyncStorage (config + TanStack Query cache via PersistQueryClientProvider), SecureStore (API Key — ya existente)  
**Testing**: Manual (no test runner configurado en el proyecto)  
**Target Platform**: iOS + Android (mobile-first, portrait fija, dark only)  
**Project Type**: Mobile app (Expo managed workflow + New Architecture)  
**Performance Goals**: Render del dashboard desde cache < 500ms; pull-to-refresh < 5s; eliminación confirmada < 500ms  
**Constraints**: Offline-capable (datos visibles sin red desde cache); New Architecture compatible (Fabric/JSI only); sin refresco automático en background  
**Scale/Scope**: ~1 pantalla principal, 4 componentes nuevos, 4 hooks nuevos, 1 servicio API ampliado

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla Constitution | Estado | Notas |
|---|---|---|
| Componentes nunca llaman directamente a la API (siempre via hooks) | ✅ PASS | Todos los fetch ocurren en hooks `useMetricValue`, `useEventDefinitions` |
| Hooks usan `useQuery` / `useMutation` de TanStack Query | ✅ PASS | `useMetricValue` y `useEventDefinitions` usan `useQuery` |
| API Key nunca expuesta en UI ni logs | ✅ PASS | Solo pasa a `ky` interno en `posthog-api.ts` |
| Dark only, fondo `#0D0D0D`, glassmorphism sutil | ✅ PASS | Aplicado en todos los componentes nuevos |
| Solo librerías compatibles con New Architecture (Fabric/JSI) | ✅ PASS | `@gorhom/bottom-sheet` v5 compatible; `FlashList` compatible; `gesture-handler` compatible; `react-native-safe-area-context` compatible |
| No añadir dependencias fuera del stack existente | ✅ PASS | Todas las librerías requeridas ya están en `package.json` (`react-native-safe-area-context` forma parte del stack existente) |
| staleTime: 1h, gcTime: 24h (por constitution) | ⚠️ EXCEPCIÓN JUSTIFICADA | Para métricas del dashboard se usa `staleTime: Infinity` (FR-011 exige refresco solo por pull-to-refresh). `gcTime: 24h` se mantiene. |
| Safe area respetado en todas las pantallas | ✅ PASS | Dashboard usa `SafeAreaView`; `AddMetricSheet` usa `topInset` de `@gorhom/bottom-sheet` con valor de `useSafeAreaInsets().top` (FR-019) |

**Post-design re-check**: ✅ Sin violaciones adicionales. La excepción de `staleTime: Infinity` está justificada por el requisito funcional FR-011 y aprobada. FR-019 (safe area en bottom sheet) cumplido via `topInset` prop.

## Project Structure

### Documentation (this feature)

```text
specs/003-metrics-dashboard/
├── plan.md              # Este archivo
├── research.md          # Decisiones: APIs PostHog, patrones TanStack Query, date-fns
├── data-model.md        # Interfaces TypeScript: DashboardMetric, MetricValue, etc.
├── quickstart.md        # Guía de desarrollo y orden de implementación
├── contracts/
│   ├── posthog-api.md   # Contratos de los 3 endpoints PostHog usados
│   └── dashboard-storage.md  # Schema AsyncStorage
└── tasks.md             # (Phase 2 — generado por /speckit.tasks)
```

### Source Code

```text
app/PostHogMobile/
└── src/
    ├── app/
    │   └── (tabs)/
    │       ├── _layout.tsx              # MODIFICAR: añadir tab Dashboard
    │       └── dashboard.tsx            # NUEVO: pantalla principal del Dashboard
    ├── components/
    │   ├── MetricCard.tsx               # NUEVO: tarjeta con número grande + label + long press
    │   ├── TimeFilterBar.tsx            # NUEVO: chips horizontales de período
    │   ├── AddMetricSheet.tsx           # NUEVO: bottom sheet selección evento + tipo gráfico (con topInset para safe area)
    │   └── DashboardEmptyState.tsx      # NUEVO: estado vacío
    ├── hooks/
    │   ├── useDashboardConfig.ts        # NUEVO: CRUD config en AsyncStorage
    │   ├── useMetricValue.ts            # NUEVO: TanStack Query para valor de métrica
    │   ├── useEventDefinitions.ts       # NUEVO: TanStack Query para lista de eventos
    │   └── useProjectInfo.ts            # NUEVO: lectura de PostHogProjectInfo
    ├── services/
    │   ├── posthog.ts                   # MODIFICAR: ampliar con getProjects() y guardar project_info
    │   └── posthog-api.ts               # NUEVO: getEventDefinitions(), queryMetricValue()
    ├── types/
    │   ├── index.ts                     # MODIFICAR: re-exportar desde dashboard.ts
    │   └── dashboard.ts                 # NUEVO: DashboardMetric, PostHogEvent, MetricValue, TimeFilter, etc.
    └── constants/
        └── index.ts                     # MODIFICAR: añadir DASHBOARD_METRICS_CONFIG_KEY, POSTHOG_PROJECT_INFO_KEY
```

**Structure Decision**: Mobile single-project layout, siguiendo la arquitectura existente. No se añaden nuevas subcarpetas — se extienden las existentes (`components/`, `hooks/`, `services/`, `types/`).

## FR-019: Safe Area en AddMetricSheet

### Problema

En dispositivos con notch o Dynamic Island (iPhone X+, iPhone 14 Pro+), el bottom sheet `AddMetricSheet` al expandirse puede sobrepasar el safe area superior, quedando contenido detrás del notch/isla dinámica.

### Solución

Usar la prop `topInset` nativa de `@gorhom/bottom-sheet` v5 con el valor de `useSafeAreaInsets().top` de `react-native-safe-area-context`:

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Dentro del componente AddMetricSheet:
const { top } = useSafeAreaInsets();

<BottomSheet
  ref={ref}
  snapPoints={snapPoints}
  topInset={top}
  // ... rest props
>
```

### Impacto

- **Componente afectado**: `AddMetricSheet.tsx` — añadir `useSafeAreaInsets()` y pasar `topInset={top}` al `<BottomSheet>`.
- **Dependencias**: `react-native-safe-area-context` ya está en el stack (requerida por Expo Router / React Navigation).
- **Comportamiento**: El bottom sheet al expandirse se detendrá en el borde inferior del safe area superior, respetando el notch / Dynamic Island. En dispositivos sin notch, `top` es `0` y el comportamiento no cambia.

## Complexity Tracking

> No hay violaciones de constitution que requieran justificación adicional. La excepción de staleTime se documenta en Constitution Check arriba.
