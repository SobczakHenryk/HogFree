# Research: Chart Widgets — BarChartWidget y LineChartWidget

**Branch**: `005-chart-widgets` | **Phase**: 0 | **Date**: 2026-03-19

---

## R1: Librería de gráficos para React Native

**Decision**: `react-native-gifted-charts` ^1.4.74  
**Rationale**: API declarativa con soporte nativo para BarChart y LineChart, compatible con New Architecture (Fabric/JSI), y no requiere web views. Soporta etiquetas personalizadas, colores por barra, y spacing configurable.  
**Alternatives considered**:
- `victory-native`: API más expresiva pero bundle significativamente mayor y problemas reportados con Expo SDK 54.
- `react-native-chart-kit`: API limitada, sin soporte activo para New Architecture.
- `react-native-wagmi-charts`: Enfocado en datos financieros, no generalista.

---

## R2: Endpoint API para series de tiempo

**Decision**: `POST /api/projects/{id}/query/` con `kind: 'TrendsQuery'`  
**Rationale**: API v2 de PostHog, soporta `interval` y `dateRange` directamente en el body. Más flexible que el endpoint legacy `/insights/trend/` documentado inicialmente en el contrato.  
**Alternatives considered**:
- `POST /api/projects/{id}/insights/trend/`: Endpoint legacy, funcional pero deprecated en favor del query API.

---

## R3: Campo de fechas en la respuesta API

**Decision**: Usar `result.days` (formato ISO "YYYY-MM-DD") con fallback a `result.labels`  
**Rationale**: `days` es parseable directamente con `parseISO` de date-fns. `labels` puede tener formato humano ("18-Mar-2026") que requiere parsing adicional.  
**Alternatives considered**:
- Usar solo `labels`: No confiable para formato ISO.

---

## R4: Animación en LineChart

**Decision**: NO usar `isAnimated` en LineChart. SÍ usar en BarChart.  
**Rationale**: Bug en `react-native-gifted-charts`: `renderAnimatedLabel` establece `width: spacing` en el contenedor de etiquetas (~8px para 30 puntos), truncando etiquetas. `renderLabel` (sin animación) usa `width: spacing + labelsExtraHeight` (~38px), suficiente para formato "d\nMMM". El BarChart no tiene esta limitación.  
**Alternatives considered**:
- Usar `isAnimated` con `labelWidth` per-item: La librería ignora `labelWidth` para etiquetas X en LineChart (FR-022).

---

## R5: Distribución de etiquetas del eje X

**Decision**: Algoritmo uniforme que garantiza primero y último punto siempre visibles.  
**Rationale**:
- **BarChart**: `targetLabels = min(max(3, ceil(total/3)), 5)` → 3-5 etiquetas.
- **LineChart**: `targetLabels = total >= 15 ? 6 : min(max(3, ceil(total/2)), 5)` → 3-6 etiquetas, mínimo 6 para ≥15 puntos.
- Para ≤4 puntos, todos muestran etiqueta.  
**Alternatives considered**:
- Mostrar todas las etiquetas: Ilegible con >10 puntos.
- Intervalo fijo (cada N puntos): No garantiza primero y último.

---

## R6: UX para nombre personalizado (FR-023)

**Decision**: Campo `TextInput` inline en el paso `chartType` de `AddMetricSheet`, entre el resumen del evento y el botón de confirmar.  
**Rationale**: Mínimo cambio de flujo. No requiere un paso adicional ni cambio en la navegación del bottom sheet. El campo se pre-rellena con `selectedEvent.name` para que el usuario pueda confirmar sin editar (comportamiento actual preservado).  
**Alternatives considered**:
- Paso adicional "Nombrar visualización": Over-engineering, añade fricción innecesaria.
- Modal de edición post-creación: No cumple FR-023 (nombre debe asignarse al crear).
- Campo en paso de evento: Confuso, el usuario aún no sabe qué tipo de visualización elegirá.

---

## R7: Validación del nombre personalizado (FR-024)

**Decision**: `customLabel.trim().length > 0` para habilitar el botón de confirmar.  
**Rationale**: Previene nombres vacíos o con solo espacios. No se necesita validación de longitud máxima en esta versión (UX no lo requiere). El `.trim()` se aplica también al persistir el valor.  
**Alternatives considered**:
- Regex para caracteres permitidos: Over-engineering, cualquier texto legible es válido.
