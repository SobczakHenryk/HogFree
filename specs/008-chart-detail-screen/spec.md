# Spec 008: Pantalla de Detalle de Chart (Interactive Pointer)

**Status**: Draft  
**Depends on**: `007-chart-edit-screen`

---

## Problema

Al hacer tap en un chart del dashboard, se abre directamente la pantalla de edición. El usuario quiere poder **deslizar el dedo sobre el chart** para ver los valores de cada día (pointer/tooltip interactivo), pero esto entra en conflicto con la navegación por tap.

## Solución

Insertar una **pantalla intermedia de detalle** entre el dashboard y la pantalla de edición:

1. **Dashboard** → tap en chart → **Pantalla de Detalle** (chart expandido con interacción táctil)
2. **Pantalla de Detalle** → tap en icono ⚙️ → **Pantalla de Edición** (existente: `edit-chart`)

---

## User Stories

### US1 — Navegar al detalle del chart
**Como** usuario del dashboard  
**Quiero** que al hacer tap en un chart se abra una pantalla de detalle  
**Para que** pueda ver el chart en tamaño completo sin abrir la edición directamente.

**Criterios de aceptación**:
- Tap en cualquier widget (MetricCard, BarChart, LineChart, FunnelChart) navega a `/chart-detail?id=<metricId>`.
- La pantalla de detalle muestra el nombre del chart, un botón de volver (←) y un icono de configuración (⚙️).
- El botón ← regresa al dashboard.
- El icono ⚙️ navega a `/edit-chart?id=<metricId>`.

### US2 — Interacción táctil con pointer en charts de series temporales
**Como** usuario  
**Quiero** deslizar el dedo sobre un LineChart o BarChart en la pantalla de detalle  
**Para que** pueda ver la fecha y el valor exacto de cada punto del chart.

**Criterios de aceptación**:
- En LineChart: al tocar y arrastrar, aparece una línea vertical (pointer strip) y un tooltip con la fecha formateada y el valor numérico del punto más cercano.
- En BarChart: al tocar y arrastrar, aparece un pointer con tooltip mostrando fecha y valor de la barra más cercana.
- El tooltip muestra: fecha (ej: "Mar 4, 2026") y valor (ej: "7").
- El pointer se activa inmediatamente al tocar el chart (no requiere long-press).
- En MetricCard y FunnelChart no hay pointer (no son series temporales); solo se muestra una versión expandida.

### US3 — Time filter independiente en detalle
**Como** usuario en la pantalla de detalle  
**Quiero** poder cambiar el rango de tiempo del chart  
**Para que** pueda explorar diferentes períodos sin volver al dashboard.

**Criterios de aceptación**:
- La pantalla de detalle incluye un `TimeFilterBar` debajo del chart.
- El filtro de tiempo se inicializa con el valor actual del dashboard (pasado como query param).
- Cambiar el filtro actualiza el chart en tiempo real (misma mecánica que el dashboard).
- El filtro de detalle es local a la pantalla; no afecta al dashboard.

### US4 — Vista expandida para MetricCard
**Como** usuario  
**Quiero** ver la métrica numérica en un formato más grande en la pantalla de detalle  
**Para que** pueda apreciar mejor el valor.

**Criterios de aceptación**:
- Al abrir un MetricCard en detalle, se muestra el nombre, el valor en tamaño grande, y la fecha de último refresh.
- No hay pointer interactivo (es un solo número, no una serie temporal).

### US5 — Vista expandida para FunnelChart
**Como** usuario  
**Quiero** ver el funnel en formato expandido en la pantalla de detalle  
**Para que** pueda ver los pasos con más claridad.

**Criterios de aceptación**:
- Al abrir un FunnelChart en detalle, se muestra el funnel con más espacio vertical.
- No hay pointer interactivo.

---

## Flujo de navegación actualizado

```
Dashboard
  └─ tap en chart → /chart-detail?id=<id>&timeFilter=<tf>
                        ├─ ← (back) → Dashboard
                        └─ ⚙️ → /edit-chart?id=<id>
                                    └─ ← (back) → /chart-detail
```

---

## Diseño de pantalla (chart-detail)

```
┌─────────────────────────────────────┐
│  ←    Usuarios Planntrip        ⚙️  │  ← Header
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │     CHART EXPANDIDO         │    │
│  │     (con pointer tooltip)   │    │
│  │                             │    │
│  │       ┌──────────┐         │    │
│  │       │Mar 4, 2026│        │    │
│  │       │    7      │         │    │
│  │       └──────────┘         │    │
│  │         │                   │    │
│  └─────┬───┴───────────────────┘    │
│        │                            │
│  [7d] [15d] [30d] [90d] [180d]     │  ← TimeFilterBar
│                                     │
└─────────────────────────────────────┘
```

---

## Tecnología

- **Pointer**: `react-native-gifted-charts` soporta `pointerConfig` en `LineChart` y `BarChart`.
  - `pointerStripColor`: color de la línea vertical.
  - `pointerColor`: color del punto.
  - `pointerLabelComponent`: componente custom para el tooltip.
  - `activatePointersOnLongPress`: false (activar al toque inmediato).
  - `autoAdjustPointerLabelPosition`: true.
- **Ruta**: `app/chart-detail.tsx` (Expo Router, fuera de tabs).
- **Datos**: Reutiliza `useMetricSeries`, `useMetricValue`, `useFunnelInsight` existentes.

---

## Fuera de alcance

- Zoom/pinch en charts.
- Rotación a landscape.
- Export/share de charts.
