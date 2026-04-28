# Feature Specification: Chart Widgets — BarChartWidget y LineChartWidget

**Feature Branch**: `005-chart-widgets`  
**Created**: 2026-03-18  
**Status**: Draft  
**Depends on**: `003-metrics-dashboard` (completo)  
**Input**: Extender el dashboard con dos nuevos tipos de visualización: `BarChartWidget` y `LineChartWidget`, que muestran la evolución temporal de un evento de PostHog en lugar de un único valor numérico agregado.

---

## Contexto

El spec 003 establece el tipo de visualización `MetricCard` que muestra un conteo único (ej. "1,234 — Usuarios Activos"). Este spec añade dos nuevos `ChartType` que muestran **series de tiempo**: el recuento del evento día a día (o semana a semana) dentro del período seleccionado. Ambos widgets conviven en el dashboard junto a las MetricCard existentes.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Añadir un BarChartWidget al dashboard (Priority: P1)

El usuario pulsa "+" en el dashboard, selecciona un evento y en el paso de elección de tipo de gráfico ahora ve tres opciones: MetricCard, BarChart y LineChart. Elige "BarChart" y confirma. El dashboard muestra una tarjeta más alta con un gráfico de barras que representa el volumen del evento por intervalo de tiempo dentro del período activo.

**Why this priority**: Es la funcionalidad principal de este spec. Sin poder añadir los nuevos tipos, el resto no aporta valor.

**Independent Test**: Con el dashboard operativo (spec 003), abrir el bottom sheet de añadir métrica y verificar que el paso 2 ofrece tres opciones de chart type. Seleccionar BarChart, confirmar, y comprobar que aparece una tarjeta con gráfico de barras.

**Acceptance Scenarios**:

1. **Given** el usuario pulsa "+" en el dashboard, **When** llega al paso de selección de tipo, **Then** ve tres opciones claramente diferenciadas: MetricCard, BarChart y LineChart, con una vista previa visual de cada tipo.
2. **Given** el usuario selecciona "BarChart" y confirma, **Then** se le solicita un nombre personalizado para la visualización (con el nombre del evento como valor por defecto) y, tras confirmar, la nueva tarjeta aparece en el dashboard mostrando el nombre elegido como título y un gráfico de barras del evento con datos del período activo.
3. **Given** el usuario cambia el filtro de tiempo mientras hay un BarChartWidget visible, **When** selecciona otro período, **Then** el gráfico se actualiza mostrando los intervalos correspondientes al nuevo período.
4. **Given** se confirma la nueva métrica BarChart, **When** el usuario cierra y vuelve a abrir la app, **Then** la tarjeta sigue presente con su tipo de gráfico correcto (persistencia local).
5. **Given** no hay datos para el período seleccionado, **When** el BarChartWidget intenta renderizar, **Then** muestra un estado vacío legible dentro de la tarjeta (ej. "Sin datos para este período").

---

### User Story 2 — Añadir un LineChartWidget al dashboard (Priority: P1)

Mismo flujo que la historia anterior, pero el usuario elige "LineChart". El dashboard muestra una tarjeta con una curva de línea que representa la tendencia del evento a lo largo del tiempo.

**Why this priority**: Complemento directo de BarChart; ambos comparten la misma capa de datos y estructura de componente.

**Independent Test**: Mismo procedimiento que US1 pero eligiendo LineChart.

**Acceptance Scenarios**:

1. **Given** el usuario selecciona "LineChart" y confirma, **Then** se le solicita un nombre personalizado (con el nombre del evento como valor por defecto) y, tras confirmar, la nueva tarjeta aparece mostrando el nombre elegido como título y un gráfico de línea del evento para el período activo.
2. **Given** el usuario tiene múltiples chart types (MetricCard + BarChart + LineChart) en el dashboard, **When** navega al tab, **Then** todos se muestran en la lista scrolleable sin conflictos visuales ni de layout.
3. **Given** el usuario cambia el período de tiempo, **When** el LineChartWidget actualiza, **Then** los datos del gráfico reflejan el rango y granularidad correctos para el nuevo período.

---

### User Story 3 — Granularidad temporal de los gráficos (Priority: P1)

Los ejes del gráfico reflejan el período seleccionado con una granularidad apropiada: días para períodos cortos (≤ 30d), semanas para períodos medios (90d y 180d) e histórico completo con intervalo mensual.

**Why this priority**: Sin una granularidad coherente los gráficos son ininterpretables.

**Independent Test**: Seleccionar "7 días" → tarjeta muestra 7 barras/puntos diarios. Cambiar a "90 días" → tarjeta muestra agrupación semanal. Cambiar a "Histórico" → agrupación mensual.

**Acceptance Scenarios**:

1. **Given** el período activo es Hoy, Ayer, 7d, 15d o 30d, **When** el widget renderiza, **Then** el eje X muestra intervalos diarios y el eje Y muestra los valores del evento.
2. **Given** el período activo es 90d o 180d, **When** el widget renderiza, **Then** el eje X muestra intervalos semanales y el eje Y muestra los valores del evento.
3. **Given** el período activo es "Histórico completo" (all), **When** el widget renderiza, **Then** el eje X muestra intervalos mensuales y el eje Y muestra los valores del evento.

---

### User Story 4 — Eliminar un BarChartWidget o LineChartWidget (Priority: P2)

El usuario puede eliminar un widget de gráfico exactamente igual que una MetricCard: pulsación larga → diálogo de confirmación → eliminación con limpieza de caché. Este comportamiento ya está especificado en spec 003 (FR-016/FR-017/FR-018) y aplica a cualquier `ChartType`.

**Why this priority**: Ya definido en spec 003; la implementación existente de eliminación debe funcionar sin cambios para los nuevos tipos.

**Independent Test**: Long-press sobre un BarChartWidget o LineChartWidget → diálogo aparece → confirmar → tarjeta desaparece y no reaparece al reabrir la app.

**Acceptance Scenarios**:

1. **Given** el usuario tiene un BarChartWidget o LineChartWidget en el dashboard, **When** realiza long-press sobre él, **Then** aparece el diálogo de confirmación (idéntico al de MetricCard).
2. **Given** el usuario confirma la eliminación, **Then** la tarjeta desaparece, su configuración y sus datos en caché (series de tiempo) se borran del almacenamiento local.

---

### User Story 5 — Nombre personalizado para cualquier visualización (Priority: P1)

Al añadir cualquier tipo de visualización (MetricCard, BarChart o LineChart), el usuario puede asignar un nombre personalizado que se mostrará como título de la tarjeta en el dashboard, en lugar del nombre técnico del evento de PostHog.

**Why this priority**: Los nombres de eventos de PostHog (ej. `$pageview`, `landing_page_viewed`) son técnicos y poco legibles para el usuario final. El nombre personalizado permite que el dashboard sea comprensible de un vistazo.

**Independent Test**: Añadir una métrica cualquiera, escribir un nombre personalizado (ej. "Visitas Landing"), confirmar, y verificar que la tarjeta muestra ese nombre como título.

**Acceptance Scenarios**:

1. **Given** el usuario ha seleccionado un evento y un tipo de visualización (MetricCard, BarChart o LineChart), **When** va a confirmar, **Then** se muestra un campo de texto con el nombre del evento como valor por defecto que el usuario puede editar antes de confirmar.
2. **Given** el usuario escribe un nombre personalizado en el campo, **When** confirma, **Then** la tarjeta aparece en el dashboard con ese nombre como título.
3. **Given** el usuario no modifica el campo de nombre (deja el valor por defecto), **When** confirma, **Then** la tarjeta usa el nombre del evento como título (comportamiento actual).
4. **Given** el campo de nombre está vacío (el usuario borró el texto), **When** intenta confirmar, **Then** el botón de confirmar permanece deshabilitado.
5. **Given** el usuario asignó un nombre personalizado, **When** cierra y reabre la app, **Then** el nombre personalizado se mantiene (persistido en `DashboardMetric.label` en AsyncStorage).

---

### Edge Cases

- ¿Qué ocurre si PostHog devuelve una serie con todos los valores en cero? → El gráfico se renderiza con el eje Y desde 0; no se muestra error, solo barras/puntos planos.
- ¿Qué ocurre si la serie tiene un único punto de datos? → Se muestra igualmente (una sola barra o un solo punto); no se trunca.
- ¿Qué ocurre cuando no hay caché y no hay conexión? → El widget muestra un estado de error dentro de la tarjeta con mensaje "Sin datos disponibles".
- ¿Qué ocurre durante el pull-to-refresh con widgets de gráfico en pantalla? → Los widgets de gráfico se actualizan junto con las MetricCard (misma lógica de refresco).
- ¿Qué pass si la API de PostHog no tiene datos para ciertos intervalos del período? → Los intervalos sin datos se representan con valor 0, sin gaps en el eje X.
- ¿Qué ocurre si el período es "Hoy" y aún no hay eventos? → Serie vacía → estado vacío en la tarjeta.
- ¿Qué ocurre con el caché de la series al cambiar de período? → Cada combinación `[metricId, timeFilter]` tiene su propia entrada de caché; no se invalidan las demás.
- ¿Pueden coexistir dos widgets del mismo evento pero distinto tipo (BarChart y LineChart)? → Sí. Las entradas en `DASHBOARD_METRICS_CONFIG` tienen `id` únicos, y el `queryKey` incluye `metricId` para diferenciarlas.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El paso 2 del flujo "Añadir Métrica" (bottom sheet, `AddMetricSheet`) DEBE mostrar tres opciones de tipo de visualización: MetricCard, BarChart y LineChart.
- **FR-002**: Al elegir BarChart y confirmar, el dashboard DEBE mostrar un `BarChartWidget` con el gráfico de barras del evento para el período activo.
- **FR-003**: Al elegir LineChart y confirmar, el dashboard DEBE mostrar un `LineChartWidget` con el gráfico de línea del evento para el período activo.
- **FR-004**: Todos los widgets (MetricCard, BarChart y LineChart) DEBEN mostrar el campo `DashboardMetric.label` como título de la tarjeta. Este campo contiene el nombre personalizado elegido por el usuario al crear la visualización (por defecto, el nombre del evento).
- **FR-005**: Ambos widgets DEBEN respetar el filtro de tiempo activo en el dashboard y actualizarse al cambiarlo.
- **FR-006**: La granularidad del eje X DEBE ser: diaria para períodos ≤ 30d, semanal para 90d/180d, y mensual para "Histórico completo".
- **FR-007**: Los datos de series de tiempo DEBEN cachearse bajo `queryKey: ['metric_series', metricId, timeFilter]` con `staleTime: Infinity` y `gcTime: 24h`, usando la misma estrategia de persistencia TanStack Query que las MetricCard.
- **FR-008**: Los widgets DEBEN mostrar un skeleton de carga mientras los datos se obtienen por primera vez o durante el pull-to-refresh.
- **FR-009**: Los widgets DEBEN mostrar un estado de error en la tarjeta si la consulta falla (sin conexión, API error).
- **FR-010**: Los widgets DEBEN mostrar un estado vacío si la serie retorna exclusivamente ceros o no hay puntos de datos.
- **FR-011**: La eliminación de un BarChartWidget o LineChartWidget DEBE funcionar con el mecanismo existente de long-press definido en spec 003 (FR-016/FR-017/FR-018), sin cambios en esa lógica.
- **FR-012**: La configuración `chartType: 'BarChart'` o `chartType: 'LineChart'` DEBE persistirse en `DASHBOARD_METRICS_CONFIG` en `AsyncStorage`.
- **FR-013**: El `DashboardMetric.chartType` DEBE aceptar los nuevos valores `'BarChart'` y `'LineChart'` además del ya existente `'MetricCard'`.
- **FR-023**: El flujo de creación de cualquier visualización (MetricCard, BarChart, LineChart) DEBE incluir un campo de texto editable para que el usuario asigne un nombre personalizado a la visualización. El campo DEBE pre-rellenarse con el nombre del evento seleccionado (`selectedEvent.name`) como valor por defecto. El nombre ingresado se almacena en `DashboardMetric.label`.
- **FR-024**: El botón de confirmar DEBE estar deshabilitado si el campo de nombre personalizado está vacío (solo espacios en blanco no cuentan como texto válido).
- **FR-025**: El nombre personalizado DEBE persistirse en `DashboardMetric.label` en `AsyncStorage` y sobrevivir reinicios de la app.
- **FR-014**: Los datos de series de tiempo se obtienen de la API de PostHog usando el endpoint `/api/projects/{id}/insights/trend/` (ver contrato en `contracts/posthog-api.md`).
- **FR-015**: La librería de gráficos a usar es `react-native-gifted-charts` (requiere `react-native-svg`). Ambas DEBEN añadirse a `package.json`.
- **FR-016**: Ambos widgets (BarChart y LineChart) DEBEN mostrar etiquetas en el eje Y con los valores del evento (conteos). Las etiquetas DEBEN formatearse de forma compacta (ej. "1.2k" para 1200) y mostrarse en color `#737373` con fuente de tamaño 10.
- **FR-017**: Ambos widgets DEBEN mostrar etiquetas en el eje X con las fechas correspondientes a cada intervalo, en formato vertical de dos líneas: `"d\nMMM"` (ej. `"18\nmar"`). Se usa `xAxisTextNumberOfLines={2}` y `labelsExtraHeight={30}` para acomodar las dos líneas. Las etiquetas DEBEN distribuirse de forma uniforme garantizando que siempre se muestren el primero y el último punto:
  - **BarChartWidget**: `targetLabels = min(max(3, ceil(total/3)), 5)`. Ejemplos: 7 puntos → 3 etiquetas; 15 puntos → 5; 30 puntos → 5.
  - **LineChartWidget**: `targetLabels = total >= 15 ? 6 : min(max(3, ceil(total/2)), 5)`. Se garantiza un mínimo de **6 etiquetas** para períodos de 15 días o más. Ejemplos: 7 puntos → 4 etiquetas; 15 puntos → 6; 30 puntos → 6; 90 puntos → 6.
  - Para ≤4 puntos en ambos widgets, todos muestran etiqueta.
- **FR-018**: El eje Y DEBE reservar un ancho fijo de 40dp para las etiquetas, y el ancho del gráfico DEBE ajustarse para acomodar dicho espacio sin desbordar la tarjeta.
- **FR-019**: El `LineChartWidget` DEBE calcular el spacing entre puntos de forma dinámica como `floor((chartWidth - padding) / (numPoints - 1))` para que la línea ocupe todo el ancho disponible de la tarjeta, independientemente del número de puntos.
- **FR-020**: Los datos de series de tiempo DEBEN usar el campo `days` (formato ISO "YYYY-MM-DD") de la respuesta `TrendsQuery` de PostHog para las fechas de los data points, con fallback a `labels` si `days` no está presente.
- **FR-021**: El `LineChartWidget` NO DEBE usar las props `isAnimated` ni `animationDuration` de `react-native-gifted-charts`. **Razón técnica**: la función interna `renderAnimatedLabel` del LineChart de la librería establece el ancho del contenedor de etiquetas como `width: spacing`, lo cual produce ~8px para 30 puntos y trunca las etiquetas a caracteres individuales. En cambio, `renderLabel` (sin animación) usa `width: spacing + labelsExtraHeight`, resultando en ~38px que acomoda correctamente el formato "d\nMMM". El `BarChartWidget` SÍ puede usar `isAnimated` ya que su implementación interna no tiene esta limitación.
- **FR-022**: Las props per-item `labelWidth` en los data points del `LineChartWidget` NO tienen efecto sobre las etiquetas del eje X en `react-native-gifted-charts`. La librería ignora completamente esta propiedad para las etiquetas X del LineChart. El ancho de las etiquetas se controla exclusivamente a nivel chart mediante la combinación de `spacing` y `labelsExtraHeight`.

### Non-Functional Requirements

- **NFR-001**: Las tarjetas de gráfico tienen altura mínima fija de **260 dp** (más alta que las MetricCard de ~120 dp) para acomodar el área del gráfico, las etiquetas del eje X en dos líneas y un margen inferior (`labelsExtraHeight: 30`).
- **NFR-002**: Los gráficos DEBEN seguir el tema dark-only de la app: fondo glassmorphism, barras/líneas en color primario de la paleta (`#7B61FF` o el token configurado en Tailwind/NativeWind).
- **NFR-003**: El renderizado inicial de los widgets desde caché DEBE completarse en menos de 500 ms (mismo criterio SC-002 de spec 003).
- **NFR-004**: Los widgets DEBEN ser compatibles con New Architecture (Fabric/JSI). `react-native-svg` y `react-native-gifted-charts` deben verificarse como compatibles antes de instalar.
- **NFR-005**: No se añadirán más dependencias adicionales a las mencionadas en FR-015.

---

## Key Entities

- **BarChartWidget**: Componente React Native que renderiza un gráfico de barras usando `react-native-gifted-charts`. Recibe una `DashboardMetric` (con `chartType: 'BarChart'`) y el `timeFilter` activo.
- **LineChartWidget**: Componente React Native que renderiza un gráfico de línea usando `react-native-gifted-charts`. Recibe una `DashboardMetric` (con `chartType: 'LineChart'`) y el `timeFilter` activo.
- **TimeSeriesCacheEntry**: Valor en caché de TanStack Query. Contiene un array de `TimeSeriesDataPoint` (ver `data-model.md`) más un timestamp de último refresco.
- **ChartType** (extender desde spec 003): `'MetricCard' | 'BarChart' | 'LineChart'`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El paso de selección de chart type en `AddMetricSheet` muestra las 3 opciones (MetricCard, BarChart, LineChart) sin truncamiento visual en dispositivos con pantalla de 4.7" o mayor.
- **SC-002**: Un BarChartWidget o LineChartWidget recién añadido muestra datos (desde caché o red) en menos de 5 segundos en condiciones normales de conectividad.
- **SC-003**: El cambio de filtro de tiempo en el dashboard actualiza los gráficos en menos de 300 ms si hay datos en caché.
- **SC-004**: La configuración de tipo de gráfico (`'BarChart'` / `'LineChart'`) persiste correctamente tras reinicio de la app en el 100% de los casos.
- **SC-005**: Los tres tipos de widget (MetricCard, BarChart, LineChart) coexisten en el dashboard sin degradación de rendimiento en listas de hasta 10 ítems.
- **SC-006**: Los gráficos son legibles en modo dark theme con contraste suficiente en las barras/líneas.

---

## Assumptions

- La librería `react-native-gifted-charts` es compatible con Expo SDK 54 y New Architecture. Esto DEBE verificarse como primer paso de implementación.
- El endpoint `/api/projects/{id}/insights/trend/` de PostHog está disponible con la misma API Key ya almacenada.
- La granularidad del eje X (día/semana/mes) se controla mediante el parámetro `interval` de la API de PostHog (`day`, `week`, `month`).
- El color de los gráficos se definirá como constante en `src/constants/index.ts` para mantener consistencia con el design system.
- No se implementa zoom ni interacciones avanzadas en el gráfico en esta versión (solo visualización estática).
- La altura mínima de las tarjetas de gráfico es fija (260 dp, incluye espacio para etiquetas del eje X). Altura adaptativa queda fuera del alcance de esta versión.

---

## Clarifications

- ¿El eje X debe mostrar etiquetas de fecha o solo marcas? → Etiquetas de fecha simplificadas en formato "d MMM" (ej. "18 mar") siempre, distribuidas uniformemente (3–6 etiquetas según total de puntos).
- ¿Se muestra el valor total (suma) también dentro del widget de gráfico? → Sí, como subtítulo encima del gráfico (mismo estilo que el número grande de MetricCard pero más pequeño).
- ¿El eje Y debe mostrar los valores del evento? → Sí. El eje Y DEBE mostrar etiquetas con los valores (conteos) del evento para que el usuario pueda analizar las gráficas correctamente. Se muestran 3–4 secciones con valores formateados de forma compacta.
- ¿El LineChart debe ocupar todo el ancho disponible? → Sí. El spacing entre puntos se calcula dinámicamente para que la línea se extienda por toda la tarjeta, evitando gráficas comprimidas.
- ¿Qué campo de la API de PostHog se usa para las fechas? → El campo `days` (ISO format) de TrendsQuery, con fallback a `labels` si no está presente. El campo `labels` usa formato humano ("18-Mar-2026") que no es parseable con `parseISO`.
- ¿Se puede usar `isAnimated` en el LineChart? → **No**. La librería `react-native-gifted-charts` tiene un bug en `renderAnimatedLabel` que establece `width: spacing` en el contenedor de etiquetas, lo que las trunca cuando el spacing es pequeño (ej. 8px para 30 puntos). Sin `isAnimated`, se usa `renderLabel` que establece `width: spacing + labelsExtraHeight` (~38px), suficiente para el formato "d\nMMM". Este bug no afecta al BarChart.
- ¿La propiedad per-item `labelWidth` controla el ancho de etiquetas X en LineChart? → **No**. La librería ignora completamente esta propiedad para etiquetas X del LineChart. Solo `dataPointLabelWidth` (etiquetas de data points) es respetada. El ancho de etiquetas X se determina internamente por `spacing` + `labelsExtraHeight`.
- ¿Cuántas etiquetas mínimas debe mostrar el LineChart para 15+ días? → **6 etiquetas mínimo**. No es aceptable reducir la cantidad de etiquetas para 15 o más días. El espacio de los puntos sin etiqueta se redistribuye internamente por la librería.
- ¿El usuario puede ponerle nombre personalizado a las visualizaciones? → **Sí**. Al crear cualquier tipo de visualización (MetricCard, BarChart, LineChart), se muestra un campo de texto pre-rellenado con el nombre del evento. El usuario puede editarlo libremente. El nombre se guarda en `DashboardMetric.label` y se usa como título de la tarjeta en el dashboard. Si el usuario no lo modifica, se usa el nombre del evento (comportamiento original).
