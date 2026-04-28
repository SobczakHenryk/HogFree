# Quickstart: Soporte Completo de Breakdown en LineChart

**Feature**: `019-fix-linechart-breakdown-support`  
**Date**: 2026-04-28

---

## Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `app/PostHogMobile/src/app/chart-detail.tsx` | Extender `LineChartDetail` (firma + lógica) y su call site |
| `app/PostHogMobile/src/app/edit-chart.tsx` | Añadir soporte de breakdown para LineChart |

**No hay archivos nuevos que crear** — todos los hooks, servicios y tipos ya existen.

---

## Flujo de Verificación Manual

### 1. Verificar BUG-001 — LineChartDetail con breakdown

```
1. Abrir la app
2. Ir al Dashboard
3. Tocar el botón "+" para agregar una métrica
4. Seleccionar cualquier evento → Seleccionar "LineChart" → "Continue"
5. En la pantalla de configuración, tocar el selector de Breakdown
6. Seleccionar cualquier propiedad disponible (ej. $browser, $os)
7. Tocar "Add"
8. Verificar en el dashboard que el widget muestra múltiples líneas de colores
9. Tocar el widget para abrir la pantalla de detalle
10. ANTES del fix: se ve una sola línea
    DESPUÉS del fix: se ven múltiples líneas coloreadas con leyenda
```

### 2. Verificar BUG-002 — edit-chart sin breakdown para LineChart

```
1. Tener un LineChart en el dashboard (con o sin breakdown)
2. Tocar el ícono ⚙ del widget para abrir edit-chart
3. ANTES del fix: no hay sección "Breakdown"
   DESPUÉS del fix: aparece sección "Breakdown" con el valor actual (o "Sin breakdown")
4. Tocar el selector → aparece modal con propiedades disponibles
5. Seleccionar una propiedad → guardar
6. Verificar que el widget en el dashboard ahora muestra el nuevo breakdown
```

### 3. Verificar modo cumulative con breakdown

```
1. Crear un LineChart con modo "cumulative" Y con breakdown
2. Abrir la pantalla de detalle
3. Verificar que cada línea muestra valores acumulados (crecientes monotónicamente)
```

### 4. Verificar no-regresión BarChart

```
1. Tener un BarChart con breakdown en el dashboard
2. Verificar que sigue funcionando igual en widget y en detalle
3. Abrir edit-chart del BarChart → verificar que la sección Breakdown y el selector de modo siguen visibles
```

---

## Dependencias de Desarrollo

No hay dependencias nuevas. Todos los imports ya existen:

```ts
// En chart-detail.tsx — ya importados:
import { useBreakdownSeries } from '../hooks/useBreakdownSeries';
import { BREAKDOWN_COLORS, BREAKDOWN_OTHER_COLOR } from '../constants';
// Falta importar: LineChartMode desde '../types'

// En edit-chart.tsx — ya importados:
import { usePropertyDefinitions } from '../hooks/usePropertyDefinitions';
// Falta importar: LineChartMode desde '../types'
```
