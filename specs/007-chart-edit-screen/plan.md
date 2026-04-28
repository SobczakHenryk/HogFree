# Implementation Plan: Pantalla de Edición de Chart

**Branch**: `007-chart-edit-screen` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-chart-edit-screen/spec.md`

## Summary

Implementar una pantalla de edición de charts accesible al hacer tap en cualquier widget del dashboard. La pantalla permite editar el nombre (`label`), cambiar el evento (`eventName`), cambiar el tipo de agregación (`math: 'dau'` para unique users o `undefined` para total events), y eliminar el chart. Se elimina la interacción de long-press de todos los widgets. Se añade el campo `math` a `DashboardMetric` y se modifica `queryMetricValue`/`queryMetricSeries` para pasar el `math` a la PostHog Query API. Para FunnelChart, solo se permite editar el nombre y eliminar.

## Technical Context

**Language/Version**: TypeScript ~5.9.2, React 19.1.0
**Primary Dependencies**: React Native 0.81.5 (New Architecture), Expo ~54.0.33, Expo Router ~6.0.23, TanStack Query ^5.90.21, NativeWind ^4.2.1, @gorhom/bottom-sheet ^5.2.8, @shopify/flash-list ^2.2.2, ky ^1.14.3, expo-haptics ^15.0.8
**Storage**: AsyncStorage (config `DASHBOARD_METRICS_CONFIG` + TanStack Query cache), SecureStore (API Key)
**Testing**: Manual (no test runner configurado)
**Target Platform**: iOS + Android (mobile-first, portrait fija, dark only)
**Constraints**: Offline-capable; New Architecture compatible; sin refresco automático en background

## Constitution Check

| Regla Constitution | Estado | Notas |
|---|---|---|
| Componentes nunca llaman directamente a la API (siempre via hooks) | ✅ PASS | La pantalla de edición usa hooks existentes (`useEventDefinitions`, `useDashboardConfig`) |
| Hooks usan `useQuery` / `useMutation` de TanStack Query | ✅ PASS | Hooks existentes no se modifican en su patrón |
| API Key nunca expuesta en UI ni logs | ✅ PASS | API Key solo se usa internamente en `posthog-api.ts` |
| Dark only, fondo `#0D0D0D`, glassmorphism sutil | ✅ PASS | Pantalla sigue esquema dark con `bg-background` / `bg-background-secondary` |
| Solo librerías compatibles con New Architecture | ✅ PASS | No se añaden dependencias nuevas |
| No añadir dependencias fuera del stack existente | ✅ PASS | Usa expo-router Stack, NativeWind, componentes React Native nativos |

## Requirements Coverage

### Functional Requirements Map

| FR | Descripción | Componente/Archivo | User Story |
|---|---|---|---|
| FR-001 | Tap en chart → navega a pantalla de edición | `dashboard.tsx` (onPress), `app/edit-chart.tsx` (nueva pantalla) | US-1 |
| FR-002 | Campo de texto editable con `label` actual | `edit-chart.tsx` — TextInput | US-2 |
| FR-003 | Selector de evento con búsqueda (no para FunnelChart) | `edit-chart.tsx` — Modal con FlatList + TextInput búsqueda | US-3 |
| FR-004 | Selector de agregación: Total Events / Unique Users (no FunnelChart) | `edit-chart.tsx` — Two-option toggle | US-4 |
| FR-005 | Botón Guardar deshabilitado si nombre vacío | `edit-chart.tsx` — validación | US-2 |
| FR-006 | Persistir cambios en AsyncStorage al guardar | `useDashboardConfig.ts` → `updateMetric()` | US-2, US-3, US-4 |
| FR-007 | Invalidar caché TanStack Query al cambiar evento/math | `edit-chart.tsx` — `queryClient.removeQueries` | US-3, US-4 |
| FR-008 | Botón Eliminar rojo en parte inferior | `edit-chart.tsx` — botón destructivo | US-5 |
| FR-009 | Diálogo confirmación al eliminar + navegar al dashboard | `edit-chart.tsx` — Alert.alert + router.back | US-5 |
| FR-010 | Eliminar long-press de todos los widgets | `MetricCard.tsx`, `BarChartWidget.tsx`, `LineChartWidget.tsx`, `FunnelChart.tsx` | US-6 |
| FR-011 | Eliminar prop `onDelete` de widgets | Todos los widgets de chart | US-6 |
| FR-012 | `useDashboardConfig.updateMetric(id, changes)` | `useDashboardConfig.ts` | US-2, US-3, US-4 |
| FR-013 | Navegación tipo stack con Expo Router | `app/edit-chart.tsx` como ruta stack | US-1 |
| FR-014 | Campo `math` en `DashboardMetric` | `types/dashboard.ts` | US-4 |
| FR-015 | Hooks pasan `math` a la PostHog Query API | `posthog-api.ts`, `useMetricValue.ts`, `useMetricSeries.ts` | US-4 |

## Project Structure

### Source Code Changes

```text
app/PostHogMobile/
└── src/
    ├── app/
    │   ├── _layout.tsx                    # MODIFICAR: Añadir ruta stack para edit-chart
    │   ├── edit-chart.tsx                 # NUEVO: Pantalla de edición de chart
    │   └── (tabs)/
    │       └── dashboard.tsx              # MODIFICAR: Tap navega a edición, eliminar onDelete de widgets
    ├── components/
    │   ├── MetricCard.tsx                 # MODIFICAR: Eliminar long-press y onDelete
    │   ├── BarChartWidget.tsx             # MODIFICAR: Eliminar long-press y onDelete
    │   ├── LineChartWidget.tsx            # MODIFICAR: Eliminar long-press y onDelete
    │   └── FunnelChart.tsx               # MODIFICAR: Eliminar long-press y onDelete
    ├── hooks/
    │   └── useDashboardConfig.ts          # MODIFICAR: Añadir updateMetric()
    ├── services/
    │   └── posthog-api.ts                 # MODIFICAR: Aceptar math param en queryMetricValue/queryMetricSeries
    └── types/
        └── dashboard.ts                   # MODIFICAR: Añadir math a DashboardMetric
```

## Design Decisions

### D-001: Pantalla Stack vs Bottom Sheet para edición

**Decisión**: Usar una pantalla Stack (Expo Router) en lugar de un Bottom Sheet.

**Razón**: La pantalla de edición tiene múltiples campos y un selector de eventos que requiere espacio. Un Bottom Sheet sería demasiado restrictivo en espacio vertical. Además, una pantalla stack permite navegación natural con gesto de back y botón de retorno.

### D-002: Pasar metricId como parámetro de ruta

**Decisión**: La pantalla de edición recibe el `metricId` como search param de la ruta (`/edit-chart?id=xxx`). Luego busca la métrica completa en `useDashboardConfig.metrics`.

**Razón**: Expo Router soporta search params de forma nativa. Pasar el ID y resolver la métrica del state garantiza datos frescos y evita problemas de serialización.

### D-003: Selector de evento usando Modal nativo

**Decisión**: El selector de evento abre un `Modal` con `TextInput` de búsqueda + `FlatList` de eventos, reutilizando el mismo patrón de `AddMetricSheet`.

**Razón**: Consistencia con UX existente. El usuario ya conoce este patrón del flujo de creación.

### D-004: Agregación como campo `math` en DashboardMetric

**Decisión**: Añadir `math?: 'dau'` como campo opcional a `DashboardMetric`. `undefined` = total events (default, `math: 'total'` en la API), `'dau'` = unique users.

**Razón**: Se alinea directamente con el campo `math` de la PostHog Events API. Mantener `undefined` como default asegura retrocompatibilidad con métricas existentes sin necesidad de migración.

### D-005: Invalidación de caché al cambiar evento/math

**Decisión**: Al guardar cambios que afectan el evento o math, se usa `queryClient.removeQueries` para eliminar todas las entradas de caché del metricId afectado (todos los timeFilters).

**Razón**: Los datos cached para el evento/math anterior ya no son válidos. Eliminar (no invalidar) garantiza que TanStack Query haga un fetch fresco la próxima vez.

### D-006: FunnelChart excluido de edición de evento/math

**Decisión**: Para FunnelChart, la pantalla de edición solo muestra nombre y eliminar. No se permite cambiar evento ni agregación.

**Razón**: Los FunnelCharts tienen una configuración multi-evento compleja (2-10 pasos ordenados). Editar esto requeriría re-implementar el paso 3 del flujo de creación, que queda fuera del alcance de esta spec.
