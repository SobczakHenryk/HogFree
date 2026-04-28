# Quickstart: Dashboard de Métricas PostHog

**Branch**: `003-metrics-dashboard` | **Date**: 2026-03-18

---

## Contexto

Esta feature añade la pantalla de Dashboard a la app `PostHogMobile`. El dashboard muestra tarjetas de métricas (`MetricCard`) configurables por el usuario, con filtros de tiempo y refresco por pull-down.

**Pre-requisito**: La feature `001-api-key-screen` debe estar completa. El usuario debe tener una API Key válida almacenada en SecureStore.

---

## Archivos nuevos a crear

```
app/PostHogMobile/src/
├── app/(tabs)/
│   └── dashboard.tsx              # Pantalla principal del Dashboard
├── components/
│   ├── MetricCard.tsx             # Tarjeta de métrica (número grande + label)
│   ├── TimeFilterBar.tsx          # Barra de chips de período de tiempo
│   ├── AddMetricSheet.tsx         # Bottom sheet: selección de evento + tipo de gráfico
│   └── DashboardEmptyState.tsx    # Estado vacío del dashboard
├── hooks/
│   ├── useDashboardConfig.ts      # CRUD de configuración del dashboard en AsyncStorage
│   ├── useMetricValue.ts          # TanStack Query: valor numérico de una métrica
│   ├── useEventDefinitions.ts     # TanStack Query: lista de eventos del proyecto
│   └── useProjectInfo.ts          # Lectura de PostHogProjectInfo desde AsyncStorage
├── services/
│   └── posthog-api.ts             # Funciones de fetch: getProjects, getEventDefinitions, queryMetric
├── types/
│   └── dashboard.ts               # Interfaces: DashboardMetric, PostHogEvent, MetricValue, etc.
└── constants/
    └── index.ts                   # Ampliar con DASHBOARD_METRICS_CONFIG_KEY, POSTHOG_PROJECT_INFO_KEY
```

**Archivos a modificar**:
```
app/PostHogMobile/src/
├── app/(tabs)/_layout.tsx         # Añadir tab de Dashboard
├── services/posthog.ts            # Ampliar validateApiKey para también guardar project_info
└── constants/index.ts             # Añadir nuevas constantes de storage
```

---

## Flujo de datos por historia de usuario

### US-1 & US-2: Ver métricas + filtrar por período

```
DashboardScreen
  → useDashboardConfig()         # Lee DASHBOARD_METRICS_CONFIG de AsyncStorage
  → Para cada DashboardMetric:
      → useMetricValue(metric.id, metric.eventName, timeFilter)
          → TanStack Query key: ['metric', metric.id, timeFilter]
          → Si hay cache: devuelve inmediatamente (staleTime: Infinity)
          → Si no hay cache: llama posthog-api.queryMetric(eventName, dateRange)
              → POST /api/projects/{id}/query/ (con TrendsQuery + BoldNumber)
```

### US-3: Añadir métrica

```
DashboardScreen (presiona "+")
  → AddMetricSheet abre (BottomSheet con topInset={useSafeAreaInsets().top} — FR-019)
      → useEventDefinitions(projectId)
          → GET /api/projects/{id}/event_definitions/?limit=200&ordering=-volume_30_day
      → Usuario selecciona evento
      → Usuario confirma tipo "MetricCard" (único disponible)
  → useDashboardConfig().addMetric(newDashboardMetric)
      → Escribe en DASHBOARD_METRICS_CONFIG (AsyncStorage)
  → useMetricValue se monta para la nueva métrica
      → Fetch inicial desde API (no hay cache todavía)
```

### US-4: Pull-to-refresh

```
DashboardScreen (pull-to-refresh)
  → queryClient.invalidateQueries({ queryKey: ['metric'] })
      → Marca todas las queries ['metric', *, *] como stale
      → TanStack Query refetches todas las métricas activas
          → POST /api/projects/{id}/query/ para cada métrica + período activo
  → RefreshControl.refreshing = true durante el proceso
  → RefreshControl.refreshing = false al completar (success o error)
```

### US-5: Eliminar métrica

```
DashboardScreen (long press sobre MetricCard)
  → expo-haptics.impactAsync(Medium)
  → Alert.alert("Eliminar métrica", ..., [{text: "Cancelar"}, {text: "Eliminar", onPress: ...}])
      → useDashboardConfig().removeMetric(metric.id)
          → Filtra el array + recalcula positions + AsyncStorage.setItem
      → queryClient.removeQueries({ queryKey: ['metric', metric.id] })
          → Limpia todo el cache de esa métrica
```

---

## Estructura del componente principal

```typescript
// src/app/(tabs)/dashboard.tsx
export default function DashboardScreen() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { metrics } = useDashboardConfig();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['metric'] });
    setIsRefreshing(false);
  }, [queryClient]);

  return (
    <SafeAreaView>
      <DashboardHeader onAddPress={() => setIsSheetOpen(true)} />
      <TimeFilterBar activeFilter={timeFilter} onFilterChange={setTimeFilter} />
      {metrics.length === 0 ? (
        <DashboardEmptyState onAddPress={() => setIsSheetOpen(true)} />
      ) : (
        <FlashList
          data={metrics}
          renderItem={({ item }) => (
            <MetricCard metric={item} timeFilter={timeFilter} />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}
      <AddMetricSheet visible={isSheetOpen} onClose={() => setIsSheetOpen(false)} />
    </SafeAreaView>
  );
}
```

### AddMetricSheet — Safe Area (FR-019)

```typescript
// src/components/AddMetricSheet.tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';

export function AddMetricSheet({ visible, onClose }: AddMetricSheetProps) {
  const { top } = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['70%', '92%'], []);

  return (
    <BottomSheet
      snapPoints={snapPoints}
      topInset={top}  // FR-019: respeta safe area superior (notch / Dynamic Island)
      // ...
    >
      {/* contenido del sheet */}
    </BottomSheet>
  );
}
```

---

## Consideraciones de diseño (Dark mode)

- **Background dashboard**: `bg-background` (`#0D0D0D`)
- **MetricCard**: `bg-background-secondary` (`#1A1A1A`) con borde `border` (`#262626`)
- **Número grande**: `font-inter-bold text-4xl text-white`
- **Label del evento**: `font-inter text-sm text-text-secondary`
- **Chips de filtro (inactivo)**: `bg-background-tertiary text-text-secondary`
- **Chip activo**: `bg-primary text-white`
- **Botón "+"**: ícono `Feather/plus` en el header derecho, color `primary` (`#F54E00`)
- **Estado vacío**: ícono central + texto invitando a añadir la primera métrica

---

## Comandos de desarrollo

```bash
# Desde app/PostHogMobile/
npx expo start --clear

# TypeScript check
npx tsc --noEmit

# Linting
npx eslint src/
```

---

## Orden de implementación recomendado

1. **Tipos y constantes** — `src/types/dashboard.ts`, ampliar `src/constants/index.ts`
2. **Servicios API** — `src/services/posthog-api.ts` (getProjects, getEventDefinitions, queryMetric)
3. **Ampliar useAuth** — guardar `PostHogProjectInfo` al validar API Key
4. **Hooks** — `useProjectInfo`, `useDashboardConfig`, `useEventDefinitions`, `useMetricValue`
5. **Componentes hoja** — `MetricCard`, `TimeFilterBar`, `DashboardEmptyState`
6. **AddMetricSheet** — bottom sheet con FlashList de eventos
7. **DashboardScreen** — pantalla completa con pull-to-refresh, long press, TabBar integration
8. **Tests manuales** — recorrer todas las User Stories del spec
