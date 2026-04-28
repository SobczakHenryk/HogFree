# Plan 008: Pantalla de Detalle de Chart

**Spec**: `specs/008-chart-detail-screen/spec.md`

---

## Resumen de cambios

| Archivo | Acción | Descripción |
|---|---|---|
| `app/chart-detail.tsx` | CREAR | Nueva pantalla de detalle con chart expandido e interacción pointer |
| `app/_layout.tsx` | MODIFICAR | Añadir `chart-detail` a la lista de rutas permitidas en el guard de navegación |
| `app/(tabs)/dashboard.tsx` | MODIFICAR | Cambiar destino de tap: `/edit-chart` → `/chart-detail` pasando `timeFilter` |
| `components/LineChartWidget.tsx` | SIN CAMBIO | Se reutiliza el hook `useMetricSeries` pero el chart de detalle renderiza su propio `LineChart` con `pointerConfig` |
| `components/BarChartWidget.tsx` | SIN CAMBIO | Mismo patrón — el chart de detalle renderiza su propio `BarChart` con `pointerConfig` |

---

## Arquitectura

### Nueva pantalla: `chart-detail.tsx`

La pantalla recibe `id` y `timeFilter` como query params. Busca la métrica en `useDashboardConfig` y renderiza:

1. **Header**: botón ← (`router.back()`), título (metric.label), icono ⚙️ (`router.push('/edit-chart?id=...')`)
2. **Chart expandido**: Según `chartType`:
   - `LineChart` / `BarChart`: Renderiza el chart a pantalla completa con `pointerConfig` habilitado.
   - `MetricCard`: Muestra el número grande con nombre y last refresh.
   - `FunnelChart`: Muestra el funnel expandido.
3. **TimeFilterBar**: Filtro de tiempo local (inicializado desde query param).

### pointerConfig para LineChart

```ts
pointerConfig={{
  pointerStripColor: '#F54E00',
  pointerStripWidth: 1,
  pointerColor: '#F54E00',
  radius: 5,
  pointerLabelWidth: 120,
  pointerLabelHeight: 50,
  activatePointersOnLongPress: false,
  autoAdjustPointerLabelPosition: true,
  pointerLabelComponent: (items) => <TooltipLabel items={items} />,
}}
```

### pointerConfig para BarChart

```ts
pointerConfig={{
  pointerStripColor: '#F54E00',
  pointerStripWidth: 1,
  pointerColor: 'transparent',
  radius: 0,
  pointerLabelWidth: 120,
  pointerLabelHeight: 50,
  activatePointersOnLongPress: false,
  autoAdjustPointerLabelPosition: true,
  pointerLabelComponent: (items) => <TooltipLabel items={items} />,
}}
```

### Componente TooltipLabel

Componente inline que recibe los items del pointer y muestra:
- Fecha formateada (ej: "Mar 4, 2026")
- Valor numérico

Estilo: fondo oscuro (`#1A1A1A`), bordes redondeados, texto blanco.

---

## Fases de implementación

### Phase 1: Chart Detail Screen
- Crear `app/chart-detail.tsx` con header, chart expandido + pointer, y time filter.
- Actualizar guard de navegación en `_layout.tsx`.

### Phase 2: Dashboard Integration
- Cambiar destino de tap en dashboard de `/edit-chart` a `/chart-detail`.
- Pasar `timeFilter` como query param.

### Phase 3: Verificación
- `npx tsc --noEmit`
- Verificación manual del flujo completo.
