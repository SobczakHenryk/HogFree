# Feature Specification: Dashboard UI Refactor — Modern Analytics Theme

**Feature Branch**: `016-dashboard-ui-refactor`  
**Created**: 2026-03-20  
**Status**: Implemented  
**Depends on**: `003-metrics-dashboard`, `005-chart-widgets`, `006-funnel-chart-widget`, `007-chart-edit-screen`, `009-bar-chart-breakdown`, `010-line-chart-enhancements`, `011-dashboard-reorder`  
**Input**: Refactor the Dashboard UI and logic into a personalized, modern, high-performance data analytics tool. Teal color theme, custom display names, trend indicators, gradient charts, haptic drag-and-drop with grip handles, bold typography.

---

## Contexto

El dashboard existente utiliza un esquema de color naranja (#F54E00) y púrpura (#7B61FF) con íconos de arrastre ≡ (hamburger). Este refactor moderniza toda la estética hacia un look SaaS analytics con acento Teal (#2DD4BF), gradientes blue-to-teal en los charts, nombres personalizados por tarjeta, indicadores de tendencia, y drag-and-drop con feedback háptico y visual mejorado.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Tema visual Teal (#2DD4BF) (Priority: P1)

**Como** usuario del dashboard  
**Quiero** que todos los acentos visuales (tabs, botones, indicadores de carga, refresh control) usen Teal en vez de naranja  
**Para** tener una experiencia visual moderna y coherente tipo SaaS analytics.

**Why this priority**: El cambio de color es la base visual del refactor. Todos los demás cambios construyen sobre esta estética.

**Acceptance Scenarios**:

1. **Given** el usuario abre la app, **When** navega al dashboard, **Then** la tab activa, el FAB (+), los ActivityIndicator, y el RefreshControl usan Teal (#2DD4BF).
2. **Given** el usuario ve el TimeFilterBar, **When** selecciona un período, **Then** la pill activa tiene fondo Teal (#2DD4BF) con texto blanco.
3. **Given** las constantes de color, **When** se inspecciona el código, **Then** `CHART_PRIMARY_COLOR` es `#2DD4BF`, `primary` en Tailwind es `#2DD4BF`, y no quedan referencias a `#F54E00` ni `#7B61FF` en el código fuente (salvo node_modules).

---

### User Story 2 — Gradientes Blue-to-Teal en charts (Priority: P1)

**Como** usuario del dashboard  
**Quiero** que los charts de línea usen un degradado de Blue (#3B82F6) a Teal (#2DD4BF) como relleno del área, y que los funnel bars interpolen entre Blue y Teal según el ratio de conversión  
**Para** una estética visual sofisticada y diferenciada.

**Why this priority**: Los gradientes son parte central de la identidad visual del refactor.

**Acceptance Scenarios**:

1. **Given** un LineChartWidget sin breakdown, **When** se renderiza, **Then** la línea es Teal (#2DD4BF) y el área de relleno va de Blue (#3B82F6) a Teal (#2DD4BF) con opacidad decreciente.
2. **Given** un FunnelChart, **When** cada barra se renderiza, **Then** el color interpola de Blue (ratio alto) → Teal (ratio bajo) en vez del anterior Purple → Muted.
3. **Given** una constante `CHART_GRADIENT_START`, **When** se inspecciona, **Then** vale `#3B82F6` (Blue).
4. **Given** una constante `CHART_GRADIENT_END`, **When** se inspecciona, **Then** vale `#2DD4BF` (Teal).

---

### User Story 3 — Barras con esquinas redondeadas 8px (Priority: P2)

**Como** usuario  
**Quiero** que todas las barras (BarChart, FunnelChart) tengan esquinas redondeadas de 8px  
**Para** un look más suave y moderno.

**Acceptance Scenarios**:

1. **Given** un BarChartWidget (normal o stacked), **When** se renderiza, **Then** cada barra tiene `barBorderRadius={8}`.
2. **Given** un FunnelChart, **When** las barras animadas se muestran, **Then** tienen `borderRadius: 8`.

---

### User Story 4 — Nombre personalizado (displayName) por tarjeta (Priority: P1)

**Como** usuario del dashboard  
**Quiero** asignar un "display name" personalizado a cada tarjeta que se muestre como título principal, con el nombre técnico del evento de PostHog debajo como caption gris  
**Para** que mi dashboard sea comprensible sin conocimientos técnicos de PostHog.

**Why this priority**: La personalización de nombres es un requisito funcional clave para la usabilidad del dashboard.

**Acceptance Scenarios**:

1. **Given** una tarjeta tiene `displayName` configurado, **When** se renderiza en el dashboard, **Then** el título principal es el `displayName` (texto grande) y debajo aparece el `eventName` en gris pequeño como caption.
2. **Given** una tarjeta NO tiene `displayName`, **When** se renderiza, **Then** el título principal es `label` (comportamiento previo) y no se muestra caption.
3. **Given** el usuario abre edit-chart, **When** ve el formulario, **Then** hay un campo "Display Name" debajo del campo "Name" con placeholder "Custom title (optional)".
4. **Given** el usuario escribe un displayName y guarda, **When** vuelve al dashboard, **Then** la tarjeta refleja el nuevo displayName inmediatamente.
5. **Given** el usuario borra el displayName (deja vacío) y guarda, **When** vuelve al dashboard, **Then** la tarjeta vuelve a usar `label` como título.
6. **Given** el campo `displayName`, **When** se persiste, **Then** se almacena en `DashboardMetric.displayName` en AsyncStorage junto con el resto de la configuración.

---

### User Story 5 — Indicador de tendencia (porcentaje) en MetricCard (Priority: P2)

**Como** usuario  
**Quiero** ver un indicador verde (▲) o rojo (▼) con el porcentaje de cambio junto al número principal de cada MetricCard  
**Para** saber rápidamente si la métrica va bien o mal.

**Acceptance Scenarios**:

1. **Given** una MetricCard con datos, **When** se renderiza, **Then** junto al número total aparece un indicador con flecha ▲ (verde #22C55E) si el cambio es positivo o ▼ (rojo #EF4444) si es negativo.
2. **Given** no hay datos de período anterior, **When** se renderiza, **Then** el indicador no se muestra.
3. **Given** el porcentaje de cambio es 0%, **When** se renderiza, **Then** se muestra ▲ 0.0% en verde.

---

### User Story 6 — Tipografía bold para métricas numéricas (Priority: P2)

**Como** usuario  
**Quiero** que los números grandes de cada tarjeta usen font-weight 700 (bold) con tamaño 36px (MetricCard) y 28px (chart widgets)  
**Para** que los datos se destaquen visualmente.

**Acceptance Scenarios**:

1. **Given** una MetricCard, **When** se renderiza, **Then** el número total usa `fontSize: 36, fontWeight: '700'`.
2. **Given** un BarChartWidget o LineChartWidget, **When** se renderiza, **Then** el número total usa `fontSize: 28, fontWeight: '700'`.

---

### User Story 7 — Grip handle (6 dots) y drag con haptics (Priority: P1)

**Como** usuario  
**Quiero** ver un ícono de grip (6 puntos en dos columnas) a la derecha de cada tarjeta para arrastrar, con feedback háptico al levantar y soltar  
**Para** una experiencia de reordenamiento intuitiva y táctil.

**Why this priority**: Es un cambio fundamental en la interacción de reordenamiento del dashboard.

**Acceptance Scenarios**:

1. **Given** cualquier widget del dashboard (MetricCard, BarChart, LineChart, FunnelChart), **When** se renderiza, **Then** muestra un ícono de GripVertical (lucide-react-native) alineado a la derecha (far right) en color #525252.
2. **Given** el usuario hace long-press en la tarjeta, **When** el drag se activa, **Then** se dispara `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`.
3. **Given** el usuario suelta la tarjeta en su nueva posición, **When** el drag termina, **Then** se dispara `Haptics.impactAsync(ImpactFeedbackStyle.Light)` y el nuevo orden se persiste.
4. **Given** una tarjeta está siendo arrastrada (isActive), **When** se renderiza, **Then** tiene `transform: scale(0.98)`, `elevation: 12`, shadow offset 4px, y opacity 0.95.
5. **Given** el código, **When** se inspecciona, **Then** no se usa `ScaleDecorator` de draggable-flatlist (se maneja manualmente en cada widget).
6. **Given** el código, **When** se inspecciona, **Then** no hay referencias a `Ionicons reorder-three` en los widgets.

---

### User Story 8 — Paleta de colores de breakdown actualizada (Priority: P2)

**Como** usuario  
**Quiero** que los colores de breakdown de las series (BarChart breakdown, LineChart breakdown) usen una paleta coherente con el nuevo tema  
**Para** consistencia visual.

**Acceptance Scenarios**:

1. **Given** `BREAKDOWN_COLORS`, **When** se inspecciona, **Then** vale `['#2DD4BF', '#3B82F6', '#A78BFA', '#F472B6', '#FBBF24']`.
2. **Given** `BREAKDOWN_OTHER_COLOR`, **When** se inspecciona, **Then** sigue siendo `#888888`.

---

## Modelo de Datos

### Cambios a `DashboardMetric`

```typescript
export interface DashboardMetric {
  // ... campos existentes ...


  /** Nombre personalizado elegido por el usuario. Si existe, se usa como título principal. */
  displayName?: string;

  /** Modo visual del LineChart: 'line' o 'cumulative'. Default: 'line'. */
  lineChartMode?: LineChartMode;
}

export type LineChartMode = 'line' | 'cumulative';
```

### Cambios a constantes (`constants/index.ts`)

| Constante | Valor anterior | Valor nuevo |
|---|---|---|
| `CHART_PRIMARY_COLOR` | `#7B61FF` | `#2DD4BF` |
| `CHART_GRADIENT_START` | *(nuevo)* | `#3B82F6` |
| `CHART_GRADIENT_END` | *(nuevo)* | `#2DD4BF` |
| `TEAL_PRIMARY` | *(nuevo)* | `#2DD4BF` |
| `BREAKDOWN_COLORS` | `['#7B61FF', '#4ECDC4', ...]` | `['#2DD4BF', '#3B82F6', '#A78BFA', '#F472B6', '#FBBF24']` |

### Cambios a Tailwind (`tailwind.config.js`)

| Token | Valor anterior | Valor nuevo |
|---|---|---|
| `primary.DEFAULT` | `#F54E00` | `#2DD4BF` |
| `primary.light` | `#FF6B2D` | `#5EEAD4` |
| `primary.dark` | `#CC4100` | `#14B8A6` |
| `accent.teal` | `#14B8A6` | `#2DD4BF` |
| `trend.up` | *(nuevo)* | `#22C55E` |
| `trend.down` | *(nuevo)* | `#EF4444` |

### i18n — Claves añadidas

| Clave | en | es |
|---|---|---|
| `editChart.displayNameLabel` | `DISPLAY NAME` | `NOMBRE PERSONALIZADO` |
| `editChart.displayNamePlaceholder` | `Custom title (optional)` | `Título personalizado (opcional)` |
| `editChart.displayNameHint` | `Overrides the card title. Leave empty to use label.` | `Reemplaza el título de la tarjeta. Déjalo vacío para usar el nombre.` |

---

## Archivos Afectados

| Archivo | Cambio |
|---|---|
| `tailwind.config.js` | Colores primary, accent, trend |
| `constants/index.ts` | CHART_PRIMARY_COLOR, gradientes, BREAKDOWN_COLORS |
| `types/dashboard.ts` | `displayName`, `lineChartMode`, `LineChartMode` |
| `types/index.ts` | Re-export `LineChartMode` |
| `(tabs)/_layout.tsx` | tabBarActiveTintColor → #2DD4BF |
| `(tabs)/dashboard.tsx` | Haptics, no ScaleDecorator, colores actualizados |
| `components/MetricCard.tsx` | displayName, TrendIndicator, GripVertical, bold font |
| `components/BarChartWidget.tsx` | GripVertical, displayName, barBorderRadius 8 |
| `components/LineChartWidget.tsx` | GripVertical, displayName, gradient area fill |
| `components/FunnelChart.tsx` | GripVertical, displayName, blue-to-teal interpolation, conversion padding |
| `components/AddMetricSheet.tsx` | Color references updated |
| `hooks/useDashboardConfig.ts` | updateMetric accepts displayName |
| `app/edit-chart.tsx` | displayName field |
| `app/_layout.tsx` | ActivityIndicator color |
| `app/index.tsx` | ActivityIndicator color |
| `app/chart-detail.tsx` | ActivityIndicator color |
| `i18n/types.ts` | displayName keys |
| `i18n/locales/en.ts` | displayName translations |
| `i18n/locales/es.ts` | displayName translations |

---

## Fuera de Alcance

- No se cambia la lógica de queries a PostHog.
- No se migra de AsyncStorage a MMKV (futuro improvement).
- No se añade porcentaje de tendencia a BarChart/LineChart (solo MetricCard).
- No se implementa edición inline del displayName (solo desde edit-chart).
