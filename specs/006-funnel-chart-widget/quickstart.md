# Quickstart: Funnel Chart Widget

**Feature**: 006-funnel-chart-widget  
**Branch**: `006-funnel-chart-widget`

> Esta guía explica cómo verificar la implementación del widget FunnelChart manualmente y cómo entender la estructura del código.

---

## Prerequisitos

```bash
cd app/PostHogMobile
npx expo start
```

Necesitas:
- Una API key válida de PostHog (US o EU)
- Al menos 2 eventos con datos en el período seleccionado

---

## Flujo para Agregar un Funnel

1. En la pantalla **Dashboard**, toca **"+ Add Metric"**
2. **Paso 1 — Evento**: Selecciona el evento del primer paso (ej. `$pageview`)
3. **Paso 2 — Tipo de gráfico**: Selecciona **"Funnel"** en la lista
4. **Paso 3 — Pasos del Funnel**:
   - La barra de búsqueda filtra los eventos disponibles del proyecto
   - Toca eventos para agregarlos a la lista ordenada (min 2, max 10)
   - El orden en la lista es el orden del funnel
   - El botón **"Add Funnel"** se habilita cuando hay ≥ 2 pasos
5. Toca **"Add Funnel"** → el widget aparece en el dashboard

---

## Estructura de Archivos

```
src/
├── components/
│   ├── FunnelChart.tsx          ← Componente principal del widget
│   └── AddMetricSheet.tsx       ← Flujo 3 pasos para agregar funnel
├── hooks/
│   └── useFunnelInsight.ts      ← TanStack Query hook
├── services/
│   └── posthog-api.ts           ← queryFunnelInsight() function
└── types/
    └── dashboard.ts             ← FunnelStep, FunnelResult, DashboardMetric.funnelEvents
```

---

## Verificación Manual

### 1. TypeScript sin errores

```bash
cd app/PostHogMobile
npx tsc --noEmit
# Debe salir sin output y exit code 0
```

### 2. Verificar que el widget renderiza

- Agrega un funnel con eventos que tengan datos
- El widget debe mostrar barras horizontales animadas
- El porcentaje de conversión general aparece en el footer
- El color cambia de púrpura (`#7B61FF`) a oscuro (`#2E2E4A`) según la tasa de conversión

### 3. Verificar estado vacío

- Agrega un funnel con eventos del período actual que no tengan datos
- El widget debe mostrar el estado empty (en lugar de crashear)

### 4. Verificar estado de carga

- Desactiva la conexión → recarga el app → los datos deben servirse desde el cache
- El widget nunca debe mostrar el spinner si los datos están cacheados

### 5. Long-press para eliminar

- Mantén presionado cualquier widget FunnelChart → aparece el botón de eliminar
- Confirma la eliminación → el widget desaparece y se remueve de AsyncStorage

---

## Datos de Ejemplo (Debug)

Si no tienes eventos reales con datos, puedes mockear la respuesta en `posthog-api.ts`:

```typescript
// Temporal — solo para testing local
export async function queryFunnelInsight(...): Promise<FunnelResult> {
  return {
    steps: [
      { name: 'signup', count: 1000, order: 0 },
      { name: 'email_verified', count: 650, order: 1 },
      { name: 'first_purchase', count: 120, order: 2 },
    ],
    lastRefreshedAt: new Date().toISOString(),
  };
}
```

---

## Cómo Funciona el Cache

El cache opera en dos capas:

1. **En memoria** (TanStack Query): `staleTime: Infinity` — no refetch automático
2. **AsyncStorage** (persistido): `gcTime: 24h` — sobrevive reinicios del app

Para forzar un refetch: realiza **pull-to-refresh** en el dashboard.

El query key: `['funnel', cloudRegion, metricId, timeFilter]`
- Cambiar el `timeFilter` invalida el cache automáticamente.
- Cada widget tiene su propio cache por `metricId`.

---

## Troubleshooting

| Problema | Causa probable | Solución |
|---|---|---|
| Widget muestra error | API key inválida o sin datos para esos eventos | Verifica la key en Settings |
| "Add Funnel" botón deshabilitado | Menos de 2 eventos seleccionados | Agrega al menos 2 pasos |
| No aparece "Funnel" en chart types | `AddMetricSheet` desactualizado | Verifica que `CHART_TYPES` incluye `FunnelChart` |
| Barras no animan | `useNativeDriver: false` con conflicto | Verifica que no hay otro `Animated` con `useNativeDriver: true` en el mismo componente |
| `expo-linear-gradient not found` | Dependencia no instalada | `npx expo install expo-linear-gradient` |
