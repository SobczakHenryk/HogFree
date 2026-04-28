# Feature Specification: Bar Chart Breakdown & Stacked Mode

**Feature Branch**: `009-bar-chart-breakdown`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: Permitir que los BarChart soporten breakdown por propiedad de evento (ej. `$browser`, `$os`, `$referring_domain`) y ofrecer la opción de cambiar entre BarChart normal (agrupado por fecha) y BarChart apilado (stacked), donde cada segmento del stack corresponde a un valor de la propiedad.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Seleccionar una propiedad de breakdown para un BarChart (Priority: P1)

Un usuario abre la pantalla de edición de un BarChart y puede seleccionar una propiedad del evento configurado (ej. `$browser`) para hacer un breakdown. La API de PostHog devuelve múltiples series (una por cada valor de la propiedad) en lugar de una sola serie agregada.

**Why this priority**: Es el requisito central del feature. Sin la selección de propiedad, no es posible hacer breakdowns.

**Independent Test**: Abrir edit-chart de un BarChart, seleccionar una propiedad de breakdown, guardar, y verificar que los datos se consultan con breakdown y el chart muestra múltiples colores/series.

**Acceptance Scenarios**:

1. **Given** el usuario está en la pantalla de edición de un BarChart, **When** ve las opciones, **Then** hay una sección "Breakdown" que permite seleccionar una propiedad del evento.
2. **Given** el usuario abre el picker de propiedades, **When** se carga la lista, **Then** se muestran las propiedades disponibles para el evento seleccionado (obtenidas de la API de PostHog) y se puede buscar por nombre.
3. **Given** el usuario selecciona la propiedad `$browser`, **When** guarda los cambios, **Then** la configuración de la métrica persiste con `breakdownProperty: "$browser"` en AsyncStorage.
4. **Given** el usuario ya tiene un breakdown configurado, **When** abre de nuevo la edición, **Then** la propiedad seleccionada aparece pre-seleccionada; puede cambiarla o eliminarla (opción "Sin breakdown").
5. **Given** el usuario selecciona "Sin breakdown", **When** guarda, **Then** el BarChart vuelve a mostrar la serie simple (un solo color) como antes.

---

### User Story 2 — Visualizar el breakdown en el BarChart del dashboard (Priority: P1)

Cuando un BarChart tiene breakdown configurado, el widget del dashboard y la pantalla de detalle muestran barras apiladas (o agrupadas) con distintos colores, uno por cada valor de la propiedad. Se muestra una leyenda con los valores de breakdown y sus colores.

**Why this priority**: Sin la visualización, el breakdown no tiene efecto visible.

**Independent Test**: Configurar un BarChart con breakdown `$browser`, ir al dashboard, y verificar que las barras tienen múltiples colores correspondientes a los valores de la propiedad, con una leyenda visible.

**Acceptance Scenarios**:

1. **Given** un BarChart tiene breakdown por `$browser` configurado, **When** el dashboard lo renderiza, **Then** las barras son apiladas (stacked) con secciones de colores distintos para cada valor (ej. Chrome=azul, Safari=verde, Firefox=naranja).
2. **Given** el breakdown devuelve más de 5 valores, **When** se renderiza, **Then** solo se muestran los top 5 valores por volumen total y el resto se agrupa como "Otros".
3. **Given** el BarChart tiene breakdown, **When** se muestra, **Then** debajo del chart aparece una leyenda horizontal con el nombre de cada valor y su color correspondiente.
4. **Given** el BarChart tiene breakdown, **When** no hay datos para el período, **Then** se muestra "Sin datos para este período" como antes.

---

### User Story 3 — Seleccionar modo de BarChart: Normal vs Stacked (Priority: P2)

El usuario puede elegir entre dos modos de visualización para el BarChart desde la pantalla de edición:
- **Normal**: Barras simples sin breakdown (comportamiento actual).
- **Stacked**: Barras apiladas con segmentos por valor de breakdown.

**Why this priority**: El modo stacked es la consecuencia natural del breakdown. Sin breakdown activo, el modo siempre es "normal".

**Independent Test**: En edit-chart, activar breakdown y verificar que se puede cambiar entre normal y stacked; en stacked las barras se apilan, en normal solo se muestra el total.

**Acceptance Scenarios**:

1. **Given** el usuario ha seleccionado una propiedad de breakdown, **When** ve las opciones de edición, **Then** aparece un selector de modo con dos opciones: "Normal" y "Stacked".
2. **Given** el modo es "Stacked" y hay breakdown activo, **When** se renderiza el chart, **Then** cada barra es una pila de secciones coloreadas (una por valor de propiedad).
3. **Given** el modo es "Normal" y hay breakdown activo, **When** se renderiza el chart, **Then** se muestra solo la serie total (sin breakdown visual), equivalente al comportamiento sin breakdown.
4. **Given** no hay breakdown activo, **When** el usuario ve las opciones, **Then** el selector de modo **no** aparece (o está deshabilitado), ya que stacked no aplica sin breakdown.
5. **Given** el usuario cambia de stacked a normal, **When** guarda, **Then** la configuración persiste y al volver al dashboard el chart refleja el modo normal.

---

### User Story 4 — Tooltip interactivo con datos de breakdown en chart-detail (Priority: P2)

En la pantalla de detalle del BarChart (chart-detail), al tocar una barra apilada, el tooltip muestra el desglose por valor de propiedad para esa fecha.

**Why this priority**: Mejora la experiencia de exploración de datos sin ser esencial para la funcionalidad base.

**Independent Test**: Abrir chart-detail de un BarChart con breakdown, tocar una barra, y verificar que el tooltip muestra la fecha y un desglose con cada valor y su conteo.

**Acceptance Scenarios**:

1. **Given** el chart-detail muestra un BarChart con breakdown stacked, **When** el usuario toca una barra, **Then** el tooltip muestra la fecha y un listado de los valores de la propiedad con su conteo respectivo.
2. **Given** el tooltip está abierto, **When** el usuario toca otra barra, **Then** el tooltip se actualiza con los datos de la nueva fecha.
3. **Given** el BarChart no tiene breakdown, **When** el usuario toca una barra, **Then** el tooltip sigue mostrando la fecha y el valor total como antes.

---

### User Story 5 — Obtener propiedades de un evento desde la API de PostHog (Priority: P1)

La app consulta la API de PostHog para obtener las definiciones de propiedades de un evento específico, permitiendo al usuario seleccionar una propiedad válida para el breakdown.

**Why this priority**: Sin las propiedades disponibles, el usuario no sabe qué opciones tiene para el breakdown.

**Independent Test**: Seleccionar un evento en edit-chart y verificar que el picker de propiedades muestra las propiedades reales de ese evento (ej. `$browser`, `$os`, `$current_url`).

**Acceptance Scenarios**:

1. **Given** el usuario selecciona un evento en edit-chart, **When** abre el picker de propiedades, **Then** la app consulta `GET /api/projects/{id}/property_definitions/?event_names={event}&type=event` y muestra las propiedades devueltas.
2. **Given** la API devuelve propiedades, **When** se muestra la lista, **Then** las propiedades se ordenan alfabéticamente y el usuario puede buscar por nombre.
3. **Given** la llamada a la API falla, **When** se intenta cargar la lista, **Then** se muestra un mensaje de error con opción de reintentar.

---

## Technical Notes

### PostHog API — Breakdown Filter

Para obtener series desglosadas por propiedad, se añade `breakdownFilter` al TrendsQuery:

```json
{
  "kind": "TrendsQuery",
  "series": [{ "event": "$pageview", "kind": "EventsNode", "math": "total" }],
  "dateRange": { "date_from": "2026-03-12", "date_to": "2026-03-19" },
  "interval": "day",
  "breakdownFilter": {
    "breakdown": "$browser",
    "breakdown_type": "event"
  }
}
```

La respuesta contiene **múltiples objetos** en `results[]`, uno por cada valor de propiedad:

```json
{
  "results": [
    { "data": [10, 20, ...], "days": [...], "labels": [...], "count": 100, "breakdown_value": "Chrome" },
    { "data": [5, 8, ...],  "days": [...], "labels": [...], "count": 50,  "breakdown_value": "Safari" },
    { "data": [2, 3, ...],  "days": [...], "labels": [...], "count": 20,  "breakdown_value": "Firefox" }
  ]
}
```

### PostHog API — Property Definitions

```
GET /api/projects/{projectId}/property_definitions/?event_names={eventName}&type=event&limit=100
```

Devuelve:
```json
{
  "results": [
    { "name": "$browser", "property_type": "String" },
    { "name": "$os", "property_type": "String" },
    ...
  ]
}
```

### react-native-gifted-charts — stackData

Para barras apiladas, se usa `stackData` en lugar de `data`:

```tsx
<BarChart
  stackData={[
    { stacks: [{ value: 10, color: '#7B61FF' }, { value: 5, color: '#FF6B6B' }], label: '12/03' },
    { stacks: [{ value: 20, color: '#7B61FF' }, { value: 8, color: '#FF6B6B' }], label: '13/03' },
  ]}
/>
```

### Paleta de colores para breakdown

Colores asignados a los top 5 valores + "Otros":
1. `#7B61FF` (púrpura — primario actual)
2. `#4ECDC4` (teal)
3. `#FF6B6B` (coral)
4. `#45B7D1` (azul cielo)
5. `#FFA07A` (salmón)
6. `#888888` (gris — "Otros")

### Nuevos campos en `DashboardMetric`

```typescript
interface DashboardMetric {
  // ... campos existentes ...
  /** Propiedad del evento para breakdown. Solo aplica a BarChart. */
  breakdownProperty?: string;
  /** Modo visual del BarChart: 'normal' (sin stacking) o 'stacked'. Default: 'stacked'. */
  barChartMode?: 'normal' | 'stacked';
}
```

### Nuevo tipo `BreakdownSeries`

```typescript
interface BreakdownSeriesItem {
  breakdownValue: string;
  dataPoints: TimeSeriesDataPoint[];
  total: number;
}

interface BreakdownSeries {
  items: BreakdownSeriesItem[];
  lastRefreshedAt: string;
}
```
