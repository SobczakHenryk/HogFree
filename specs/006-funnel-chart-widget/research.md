# Research: Funnel Chart Widget

**Branch**: `006-funnel-chart-widget` | **Phase**: 0 | **Date**: 2026-03-19  
**Depends on**: `specs/005-chart-widgets/research.md`, `specs/003-metrics-dashboard/research.md`

---

## 1. PostHog FunnelsQuery API

### Decisión
Usar `POST /api/projects/{projectId}/query/` con `kind: 'FunnelsQuery'` (Query API genérica), igual que se usa `TrendsQuery` para los charts existentes.

### Rationale
- Consistente con el patrón ya establecido en `queryMetricValue` y `queryMetricSeries`.
- El mismo cliente `ky` + auth header `Authorization: Bearer <key>` funciona sin cambios.
- La Query API genérica (`/query/`) es el endpoint recomendado por PostHog para queries programáticas a partir de 2024.

### Alternativa descartada
`POST /api/projects/{id}/insights/funnel/` — endpoint legacy con payload diferente, menos documentado y marcado como deprecated en el roadmap interno de PostHog.

### Payload de request
```json
{
  "refresh": "blocking",
  "query": {
    "kind": "FunnelsQuery",
    "series": [
      { "kind": "EventsNode", "event": "signup" },
      { "kind": "EventsNode", "event": "onboarding_complete" },
      { "kind": "EventsNode", "event": "$pageview" }
    ],
    "dateRange": { "date_from": "2026-03-12", "date_to": "2026-03-19" },
    "funnelsFilter": {
      "funnelOrderType": "ordered",
      "funnelVizType": "steps"
    }
  }
}
```

### Estructura de response
```json
{
  "results": [
    [
      { "name": "signup", "count": 1200, "order": 0 },
      { "name": "onboarding_complete", "count": 840, "order": 1 },
      { "name": "$pageview", "count": 610, "order": 2 }
    ]
  ],
  "last_refresh": "2026-03-19T09:00:00Z"
}
```

`results` es un array de arrays. El primer elemento (`results[0]`) contiene el array de pasos del funnel principal. Los pasos están ordenados por `order` ASC.

---

## 2. Estrategia de cache (TanStack Query)

### Decisión
- `queryKey`: `['funnel', cloudRegion, metricId, timeFilter]`
- `staleTime`: `Infinity` (nunca stale — refresco solo por pull-to-refresh)
- `gcTime`: `24h` (disponible offline)
- `enabled`: `!!projectInfo && events.length >= 2`

### Rationale
- Consistente con `useMetricValue` y `useMetricSeries` (ambos usan `staleTime: Infinity`).
- `gcTime: 24h` garantiza que los datos persistan entre sesiones via `PersistQueryClientProvider`.
- `metricId` en la query key garantiza aislamiento entre distintos widgets FunnelChart en el mismo dashboard.
- `enabled: events.length >= 2` evita llamadas a la API para funnels incompletos.

### Alternativa descartada
Usar `staleTime: 3600000` (1h como indica la constitution "por defecto"). Se descarta porque el patrón del dashboard establece que los widgets nunca se refresca automáticamente; el usuario controla el refresco via pull-to-refresh (FR-011 de la spec).

---

## 3. Animación de barras

### Decisión
`Animated.timing` de React Native core sobre `width` interpolado como porcentaje usando `Animated.Value` de 0 → ratio.

```typescript
// Animated.View con width interpolado:
width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
```

Cada barra se anima con un `delay` de `index * 80ms` para efecto cascada.

### Rationale
- No requiere nuevas dependencias.
- `Animated.timing` con `useNativeDriver: false` es necesario porque `width` no es soportado por el native driver — esto es esperado y válido.
- Efecto cascada (delay incremental) mejora la legibilidad mostrando el funnel de arriba a abajo.
- 500ms de duración + 80ms de delay entre pasos: rápido pero perceptible.

### Alternativa descartada
`react-native-reanimated` con `useSharedValue` — viable pero overkill para esta animación simple. Añade complejidad de Worklets sin beneficio medible.

---

## 4. Interpolación de color (gradiente visual)

### Decisión
Interpolación lineal en espacio RGB entre dos colores fijos:
- `colorA` (ratio = 1.0, paso sin caída): `#7B61FF` — purple del tema (≈ `accent.purple` de la constitution)
- `colorB` (ratio → 0, máxima caída): `#2E2E4A` — versión apagada del purple

```typescript
function interpolateColor(ratio: number): string {
  const t = 1 - ratio;
  const r = Math.round(0x7b + (0x2e - 0x7b) * t);
  const g = Math.round(0x61 + (0x2e - 0x61) * t);
  const b = Math.round(0xff + (0x4a - 0xff) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
```

Se aplica un ratio mínimo de `0.15` para que ningún paso quede completamente negro.

### Rationale
- `expo-linear-gradient` es para degradados de textura, no para animar el color de un elemento en función de datos.
- La interpolación en JS es suficiente; el resultado es string `rgb(...)` que React Native resuelve vía estilos dinámicos.
- El purple (`accent.purple`) está definido en la constitution como el color de funnels.

### Alternativa descartada
`expo-linear-gradient` como fondo de cada barra — crea un efecto visual diferente (degradado horizontal dentro de cada barra) que no comunica la caída entre pasos.

---

## 5. Flujo de configuración en AddMetricSheet

### Decisión
Tercer paso `'funnelSteps'` que se activa solo cuando `selectedChartType === 'FunnelChart'`. Flujo: `event` → `chartType` → `funnelSteps` (solo para FunnelChart) → confirmar.

- El evento seleccionado en el paso 1 se pre-carga como paso 1 del funnel.
- El usuario añade eventos adicionales buscando en la lista filtrada.
- Eventos ya añadidos se excluyen de la lista de búsqueda.
- Botón de eliminar individual habilitado solo si hay > 2 pasos (para mantener mínimo).
- Botón "Añadir funnel" deshabilitado si `funnelSteps.length < 2`.

### Rationale
- Mantiene el patrón de flujo de pasos de `AddMetricSheet` sin romper MetricCard/BarChart/LineChart.
- Pre-cargar el evento inicial reduce la fricción (el usuario ya eligió ese evento en el paso 1).
- El límite de 10 y mínimo de 2 están dictados por la spec (FR-006).

### Alternativa descartada
Crear un modal separado para configurar FunnelChart — rompe la consistencia UX del flujo "+" del dashboard.

---

## 6. Persistencia de funnelEvents

### Decisión
Campo opcional `funnelEvents?: string[]` en la interfaz `DashboardMetric` existente. Se persiste en el mismo `DASHBOARD_METRICS_CONFIG` en AsyncStorage junto con los demás campos de la métrica.

### Rationale
- JSON.stringify/parse preserva arrays de strings sin overhead.
- No requiere migración de datos existentes (campo opcional — backward-compatible).
- Consistente con la arquitectura de persistencia existente (AsyncStorage + `useDashboardConfig`).

### Alternativa descartada
Almacenar funnelEvents en una clave separada de AsyncStorage — innecesariamente fragmentado; la relación es 1:1 con DashboardMetric.
