# Research: Dashboard de Métricas PostHog

**Branch**: `003-metrics-dashboard` | **Phase**: 0 | **Date**: 2026-03-18

---

## 1. PostHog API — Obtención del Project ID

**Decision**: `GET /api/projects/` con `Authorization: Bearer <key>`. Usar el primer elemento de `results`. Almacenar `project_id` en `AsyncStorage` bajo la clave `POSTHOG_PROJECT_ID`.

**Rationale**:
- La mayoría de las Personal API Keys de PostHog están asociadas a una organización con un único proyecto (o un proyecto principal). El primer resultado es el más reciente y activo.
- `GET /api/projects/` es el endpoint más simple para obtener los proyectos accesibles, sin overhead de organizaciones.
- `project_id` no es un secreto — es un identificador numérico que aparece en URLs públicas de PostHog. `AsyncStorage` (no `SecureStore`) es suficiente y apropiado.
- En el flujo de `useAuth`, se amplía `validateApiKey` (que ya llama `/api/me/`) para también llamar a `/api/projects/` y persistir el `project_id` en `AsyncStorage` antes de redirigir.

**Alternativas consideradas**:
- `GET /api/organizations/@current/projects/` — equivalente pero requiere extra razonamiento sobre `@current`, menos directo.
- Que el usuario seleccione su proyecto — añade fricción innecesaria en un MVP donde la mayoría tiene un solo proyecto.
- Embeber el `project_id` en la clave de `SecureStore` — sobreingeniería; no es un secreto.

**Respuesta esperada** (`/api/projects/`):
```json
{
  "count": 1,
  "results": [
    { "id": 12345, "name": "My App", "api_token": "phc_..." }
  ]
}
```

---

## 2. PostHog API — Listado de definiciones de eventos (Add Metric flow)

**Decision**: `GET /api/projects/{project_id}/event_definitions/?limit=200&ordering=-volume_30_day`

**Rationale**:
- El endpoint `event_definitions` devuelve los tipos de eventos registrados en el proyecto, no instancias individuales.
- `ordering=-volume_30_day` ordena por popularidad (más frecuentes primero), lo que facilita encontrar los eventos más relevantes en la parte superior de la lista.
- `limit=200` es razonable para la mayoría de proyectos. Si hay más de 200 eventos, se implementa paginación incremental.
- Usar `FlashList` de `@shopify/flash-list` para renderizar la lista de forma performante (ya en el stack).
- TanStack Query cachea el resultado con `staleTime: 5 * 60 * 1000` (5 min) e `gcTime: 30 * 60 * 1000` (30 min) — los eventos cambian poco, pero no tan lento como las métricas del dashboard.

**Respuesta esperada**:
```json
{
  "count": 45,
  "next": null,
  "results": [
    { "id": "uuid-1", "name": "$pageview", "volume_30_day": 15000 },
    { "id": "uuid-2", "name": "$identify", "volume_30_day": 8200 },
    { "id": "uuid-3", "name": "button_clicked", "volume_30_day": 3100 }
  ]
}
```

**Alternativas consideradas**:
- `GET /api/projects/{id}/events/` — devuelve instancias (filas individuales), no definiciones. Innecesariamente pesado.
- `GET /api/projects/{id}/event_definitions/?limit=50` — límite bajo requeriría más llamadas de paginación.

---

## 3. PostHog API — Conteo de eventos para MetricCard

**Decision**: `POST /api/projects/{project_id}/query/` con un `TrendsQuery` y `display: "BoldNumber"`.

**Rationale**:
- La Query API (`/api/projects/{id}/query/`) es la API más reciente de PostHog y soporta HogQL + Insights programáticos. Está diseñada para ser la interfaz canónica going forward.
- `display: "BoldNumber"` instruye a PostHog a devolver el valor agregado total (no una serie temporal), lo cual es exactamente lo que necesita `MetricCard`.
- La respuesta incluye `aggregated_value` como número entero en `results[0]`.
- Más flexible que la Insights API v1 (`/api/projects/{id}/insights/trend/`) para extensiones futuras.

**Request body**:
```json
{
  "query": {
    "kind": "TrendsQuery",
    "series": [
      {
        "event": "$pageview",
        "kind": "EventsNode",
        "math": "total"
      }
    ],
    "dateRange": {
      "date_from": "2026-03-11",
      "date_to": "2026-03-18"
    },
    "trendsFilter": {
      "display": "BoldNumber"
    }
  }
}
```

**Respuesta esperada**:
```json
{
  "results": [
    {
      "aggregated_value": 1234,
      "days": [],
      "labels": [],
      "data": []
    }
  ],
  "is_cached": false,
  "last_refresh": "2026-03-18T10:30:00Z"
}
```

**Para "Histórico completo"**: usar `"date_from": "all"` (PostHog acepta este valor especial).

**Alternativas consideradas**:
- `GET /api/projects/{id}/insights/trend/` (v1) — API más antigua, aún funcional pero habrá menor soporte futuro. Descartada en favor de la Query API.
- Calcular conteos propios desde `GET /api/projects/{id}/events/` — paginación compleja e ineficiente para grandes volúmenes de eventos.

---

## 4. Rango de fechas para los filtros de tiempo

**Decision**: Calcular fechas con `date-fns` (ya en el stack) en zona horaria local del dispositivo. Convertir a ISO 8601 `yyyy-MM-dd` para los requests.

**Rationale**:
- PostHog acepta tanto fechas relativas (ej. `-7d`) como fechas absolutas ISO. Las fechas absolutas dan control preciso sobre los límites del período, sin depender de la interpretación del servidor.
- `date-fns` está en el stack (`^4.1.0`) y es tree-shakable. Funciones `subDays`, `startOfDay`, `endOfDay` son suficientes.
- La zona horaria local es la más intuitiva para el usuario mobile (el "hoy" es su hoy, no UTC).

**Mapa de filtros**:

| TimeFilter | `date_from` | `date_to` |
|---|---|---|
| `today` | `format(startOfDay(now), 'yyyy-MM-dd')` | `format(now, 'yyyy-MM-dd')` |
| `yesterday` | `format(startOfDay(subDays(now, 1)), 'yyyy-MM-dd')` | `format(endOfDay(subDays(now, 1)), 'yyyy-MM-dd')` |
| `7d` | `format(subDays(now, 7), 'yyyy-MM-dd')` | `format(now, 'yyyy-MM-dd')` |
| `15d` | `format(subDays(now, 15), 'yyyy-MM-dd')` | `format(now, 'yyyy-MM-dd')` |
| `30d` | `format(subDays(now, 30), 'yyyy-MM-dd')` | `format(now, 'yyyy-MM-dd')` |
| `90d` | `format(subDays(now, 90), 'yyyy-MM-dd')` | `format(now, 'yyyy-MM-dd')` |
| `180d` | `format(subDays(now, 180), 'yyyy-MM-dd')` | `format(now, 'yyyy-MM-dd')` |
| `all` | `"all"` (string literal) | `format(now, 'yyyy-MM-dd')` |

**Alternativas consideradas**:
- Usar strings relativos de PostHog (`-7d`, `-30d`) — más simples, pero menos control sobre el límite exacto y no cubren todos los casos (ej. "ayer").
- `date-fns-tz` para conversión explícita de TZ — overhead innecesario para el caso de uso mobile donde la TZ es la del dispositivo.

---

## 5. TanStack Query — Patrón de refresco manual (pull-to-refresh only)

**Decision**: `staleTime: Infinity` por métrica + `queryClient.invalidateQueries({ queryKey: ['metric'] })` en el handler de pull-to-refresh.

**Rationale**:
- La spec (FR-011) establece que la API solo se consulta durante pull-to-refresh. `staleTime: Infinity` garantiza que TanStack Query nunca refetche automáticamente en background.
- `invalidateQueries` con prefijo `['metric']` marca como stale todas las queries de métricas activas, disparando un refetch síncrono en los componentes montados.
- `gcTime: 24 * 60 * 60 * 1000` (24h) mantiene los datos en el cache persistido (AsyncStorage via `PersistQueryClientProvider`) — ya configurado en la app según la constitution.
- Cuando el usuario cambia a un período sin datos en cache: la query no tiene datos previos, lo cual TanStack Query trata como "loading" y dispara el fetch automáticamente. Esto es correcto y deseable (FR-004).

**Patrón de query key**:
```typescript
queryKey: ['metric', metricId, timeFilter]
// ej: ['metric', 'uuid-abc', '7d']
```

**Invalidación en pull-to-refresh**:
```typescript
await queryClient.invalidateQueries({ queryKey: ['metric'] })
// Invalida TODAS las métricas activas, independiente de período
```

**Alternativas consideradas**:
- `staleTime: 0` + `enabled: false` + `refetch()` manual — más verbose, con el mismo resultado práctico.
- `refetchInterval` con intervalo largo — contradice el requisito de refresco solo por pull-to-refresh.
- Query key sin `metricId` — no permite invalidaciones selectivas en extensiones futuras.

---

## 6. Persistencia del dashboard config (qué métricas mostrar)

**Decision**: `AsyncStorage` directo bajo la clave `DASHBOARD_METRICS_CONFIG`. Serializado como `JSON.stringify(DashboardMetric[])`. Gestionado por un hook personalizado `useDashboardConfig`.

**Rationale**:
- La configuración del dashboard (qué eventos están en el dashboard, en qué orden) es **user config**, no API data. TanStack Query no es la herramienta adecuada para este dato.
- `AsyncStorage` es el mecanismo estándar para config ligero en el stack del proyecto (ya tiene `@react-native-async-storage/async-storage`).
- Un hook personalizado `useDashboardConfig` encapsula la lectura/escritura, expone `metrics: DashboardMetric[]`, `addMetric()`, `removeMetric()`, con estado reactivo via `useState`.
- La persistencia en `AsyncStorage` ocurre de forma asíncrona en background; la UI responde al estado inmediatamente (optimistic update).

**Alternativas consideradas**:
- Zustand / Jotai para estado global — overhead innecesario para un único array de configuración local.
- MMKV (`react-native-mmkv`) — síncrono y más rápido, pero añade una dependencia nativa no presente en el stack actual.
- TanStack Query con `queryFn` que lee AsyncStorage — mezcla de responsabilidades; la config no es dato servidor.

---

## 7. Patrón de eliminación (long press → confirmación)

**Decision**: `react-native-gesture-handler` `LongPressGestureHandler` (ya en el stack) + `expo-haptics` para feedback háptico + `Alert.alert()` de React Native para el diálogo de confirmación.

**Rationale**:
- `react-native-gesture-handler` está en el stack (`^2.30.0`) y es compatible con la New Architecture (Fabric/JSI). Soporta long press apropiadamente.
- Alternativamente, la prop `onLongPress` de `Pressable` (React Native core) también soporta long press sin librería adicional. Dado que el comportamiento requerido es simple, `Pressable` es suficiente y más simple.
- `expo-haptics.impactAsync(ImpactFeedbackStyle.Medium)` en el momento del long press refuerza visualmente la acción destructiva.
- `Alert.alert()` presenta el diálogo nativo de iOS/Android con botones "Eliminar" (rojo/destructivo) y "Cancelar" — no requiere librerías adicionales y sigue las convenciones de plataforma.

**Alternativas consideradas**:
- Bottom sheet con opciones — sobrecarga visual para una acción única y destructiva; el diálogo es más directo.
- Botón de eliminar visible siempre — ocupa espacio en la tarjeta y no es el patrón móvil estándar.
- Swipe-to-delete — compite con el scroll vertical del dashboard.

---

## 8. UI para el flujo "Añadir Métrica"

**Decision**: `@gorhom/bottom-sheet` (ya en el stack `^5.2.8`) con `BottomSheetFlatList` o `FlashList` para la lista de eventos. Dos pasos dentro del sheet: (1) selección de evento, (2) selección de tipo de gráfico.

**Rationale**:
- `@gorhom/bottom-sheet` está en el stack y es compatible con la New Architecture. Es el patrón modal natural para selectors en apps mobile.
- Mantenerse en la misma pantalla del dashboard (no navegar a otra ruta) mantiene el contexto y es más fluido.
- Dos pasos en el mismo sheet (step 1: evento, step 2: tipo de gráfico) permiten extensibilidad cuando se añadan más tipos de gráfico. Por ahora, si solo hay `MetricCard`, el step 2 se puede saltar automáticamente o mostrar solo una opción pre-seleccionada.
- `BottomSheetFlashList` (integración de `@gorhom/bottom-sheet` con `@shopify/flash-list`) para listas largas de eventos.

**Alternativas consideradas**:
- Modal de React Native — más básico, sin el comportamiento de drag/snap elegante.
- Nueva ruta de Expo Router — navegación completa, innecesaria para un flujo de selección.
- Inline en el dashboard — requeriría mostrar/ocultar, más complejo de manejar con el estado.
