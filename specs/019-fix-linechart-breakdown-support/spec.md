# Feature Specification: Soporte Completo de Breakdown en LineChart

**Feature Branch**: `019-fix-linechart-breakdown-support`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: El usuario reporta que la funcionalidad de breakdown en las gráficas no funciona correctamente: al seleccionar un evento y configurar un breakdown, la gráfica debería mostrar múltiples líneas o barras por valor de propiedad, pero esto no ocurre en ciertos flujos de la app (pantalla de detalle y pantalla de edición para LineChart).

---

## Análisis de Causa Raíz (Bug Report)

### Bugs identificados mediante revisión de código

**BUG-001 — `LineChartDetail` en `chart-detail.tsx` ignora `breakdownProperty`**

La función `LineChartDetail` dentro de la pantalla de detalle nunca recibe el parámetro `breakdownProperty`. Siempre llama a `useMetricSeries` (serie única), ignorando por completo si la métrica tiene un breakdown configurado. Resultado: el usuario ve una sola línea aunque haya configurado un breakdown con `AddMetricSheet`.

**BUG-002 — `edit-chart.tsx` no expone opciones de breakdown para LineChart**

La sección "Breakdown" en la pantalla de edición solo se renderiza cuando `isBarChart === true`. Los LineChart no tienen UI para editar, agregar ni eliminar la propiedad de breakdown. Adicionalmente, `usePropertyDefinitions` solo se activa para BarCharts (`isBarChart ? eventName : ''`), por lo que la lista de propiedades no se carga para LineCharts.

### Estado actual por flujo

| Flujo | BarChart | LineChart |
|-------|----------|-----------|
| Dashboard widget (múltiples series) | ✅ Funciona | ✅ Funciona |
| Pantalla de detalle (series expandidas) | ✅ Funciona | ❌ Siempre muestra 1 línea |
| Pantalla de edición (agregar/cambiar breakdown) | ✅ Funciona | ❌ No tiene UI de breakdown |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Ver múltiples líneas en la pantalla de detalle de un LineChart con breakdown (Priority: P1)

Un usuario configuró un LineChart con breakdown por propiedad (por ejemplo `$browser`) en `AddMetricSheet`. En el dashboard, el widget ya muestra múltiples líneas de colores. Sin embargo, al tocar el chart para ir a la pantalla de detalle, solo ve una línea simple, ignorando completamente el breakdown. El usuario espera que la pantalla de detalle también muestre las múltiples líneas coloreadas con su leyenda.

**Why this priority**: Es el bug principal reportado. La inconsistencia entre dashboard y detalle genera confusión. El detalle es la pantalla principal de análisis.

**Independent Test**: Crear un LineChart con breakdown `$browser`, verificar que en el dashboard aparecen múltiples líneas, luego tocar el chart para abrir el detalle y confirmar que también muestra múltiples líneas con colores y leyenda.

**Acceptance Scenarios**:

1. **Given** un LineChart tiene `breakdownProperty: "$browser"` configurado, **When** el usuario abre la pantalla de detalle, **Then** el chart muestra múltiples líneas de colores distintos, una por cada valor de la propiedad.
2. **Given** la pantalla de detalle muestra un LineChart con breakdown, **When** se renderizan los datos, **Then** aparece una leyenda con el nombre de cada valor de la propiedad y su color correspondiente.
3. **Given** un LineChart tiene breakdown con modo `cumulative`, **When** se abre en el detalle, **Then** cada línea muestra su valor acumulado, al igual que en el widget del dashboard.
4. **Given** un LineChart no tiene `breakdownProperty`, **When** el usuario abre el detalle, **Then** se sigue mostrando una sola línea (comportamiento actual, sin regresión).
5. **Given** el LineChart tiene breakdown activo pero la API devuelve cero items, **When** se abre el detalle, **Then** se muestra el mensaje "Sin datos para este período".

---

### User Story 2 — Editar o agregar breakdown desde la pantalla de edición de un LineChart (Priority: P1)

Un usuario tiene un LineChart existente y quiere añadirle un breakdown, o modificar el que ya tiene. Abre la pantalla de edición (`edit-chart`) y no encuentra ninguna sección de Breakdown. Solo los BarChart muestran esta sección. El usuario no puede modificar el breakdown de su LineChart sin eliminarlo y volver a crearlo.

**Why this priority**: Sin poder editar el breakdown en edit-chart, el usuario queda atrapado: o usa `AddMetricSheet` para crear uno nuevo, o elimina el chart y lo recrea. Esto rompe la experiencia de edición.

**Independent Test**: Crear un LineChart con breakdown, ir a edit-chart, verificar que aparece la sección "Breakdown" con la propiedad actual, cambiarla por otra, guardar, y confirmar que el dashboard refleja el nuevo breakdown.

**Acceptance Scenarios**:

1. **Given** el usuario abre edit-chart de un LineChart con `breakdownProperty` configurado, **When** ve las opciones, **Then** aparece una sección "Breakdown" que muestra la propiedad actualmente seleccionada.
2. **Given** el usuario abre edit-chart de un LineChart sin breakdown, **When** ve las opciones, **Then** la sección "Breakdown" muestra "Sin breakdown" y permite seleccionar una propiedad.
3. **Given** el usuario toca el selector de Breakdown, **When** se abre el modal, **Then** se muestran las propiedades disponibles para el evento del chart (cargadas desde la API) con opción de búsqueda.
4. **Given** el usuario selecciona una nueva propiedad de breakdown, **When** guarda, **Then** la configuración persiste y el widget en el dashboard muestra el nuevo breakdown.
5. **Given** el usuario selecciona "Sin breakdown" en el modal, **When** guarda, **Then** el LineChart vuelve a mostrar la serie simple (una sola línea).
6. **Given** el usuario cambia el evento del chart en edit-chart, **When** se produce el cambio, **Then** el `breakdownProperty` se resetea a `undefined` (igual que en BarChart) para evitar inconsistencias.

---

### User Story 3 — Tooltip interactivo en el detalle de LineChart con breakdown (Priority: P2)

En la pantalla de detalle de un BarChart con breakdown ya existe un tooltip que al tocar una barra muestra el desglose por valor de propiedad. Para LineChart con breakdown, el usuario espera una experiencia similar: al usar el pointer sobre la línea, poder ver los valores de cada serie para esa fecha.

**Why this priority**: Mejora la experiencia de exploración de datos pero no es bloqueante para la funcionalidad base del breakdown.

**Independent Test**: Abrir el detalle de un LineChart con breakdown, tocar/arrastrar el pointer, verificar que el tooltip muestra la fecha y los valores de cada serie de breakdown.

**Acceptance Scenarios**:

1. **Given** el detalle muestra un LineChart con breakdown, **When** el usuario activa el pointer (toca o arrastra), **Then** el tooltip muestra la fecha y un listado de los valores de cada serie con su conteo.
2. **Given** el tooltip de breakdown está visible, **When** el usuario mueve el pointer a otra posición, **Then** el tooltip se actualiza con los datos de la nueva fecha.
3. **Given** el LineChart no tiene breakdown, **When** el usuario usa el pointer, **Then** el tooltip sigue mostrando la fecha y el valor total (comportamiento actual, sin regresión).

---

### Edge Cases

- ¿Qué sucede si `breakdownData` aún está cargando cuando se abre el detalle? → Mostrar skeleton hasta que los datos estén disponibles.
- ¿Qué ocurre si el evento del LineChart no tiene propiedades disponibles en edit-chart? → Mostrar mensaje "Este evento no tiene propiedades disponibles" en el modal (igual que BarChart).
- ¿Qué pasa si se cambia el evento en edit-chart estando en un LineChart con breakdown activo? → Resetear `breakdownProperty` a `undefined`.
- ¿Qué sucede con el modo `cumulative` + breakdown en el detalle? → Cada línea debe acumular sus propios valores, igual que en el widget del dashboard.
- ¿Qué pasa si el breakdown devuelve más de 5 valores en el detalle? → La lógica de "top 5 + Otros" ya existe en la API, se aplica automáticamente.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla de detalle de un LineChart DEBE mostrar múltiples líneas de colores distintos cuando la métrica tiene `breakdownProperty` configurado.
- **FR-002**: La pantalla de detalle de un LineChart con breakdown DEBE mostrar una leyenda con el nombre de cada valor de la propiedad y su color.
- **FR-003**: La pantalla de detalle DEBE respetar el modo `lineChartMode` del LineChart (línea normal vs. acumulativa) incluso cuando hay breakdown activo.
- **FR-004**: La pantalla de edición de un LineChart DEBE mostrar una sección "Breakdown" equivalente a la que ya existe para BarChart *(equivalente en UI y persistencia, excepto por el selector de modo `barChartMode` que no aplica a LineChart)*.
- **FR-005**: La sección de Breakdown en edit-chart para LineChart DEBE cargar y mostrar la lista de propiedades del evento seleccionado.
- **FR-006**: Al guardar cambios de breakdown en edit-chart para LineChart, la caché de `breakdown_series` del metric DEBE invalidarse.
- **FR-007**: Al cambiar el evento de un LineChart en edit-chart, el `breakdownProperty` DEBE resetearse a `undefined`.
- **FR-008**: Un LineChart sin breakdown configurado NO DEBE verse afectado por estos cambios (sin regresión).
- **FR-009**: Un BarChart con breakdown NO DEBE verse afectado por estos cambios (sin regresión).

### Key Entities

- **DashboardMetric**: Ya contiene `breakdownProperty?: string` y `lineChartMode?: LineChartMode`. No requiere cambios en el tipo.
- **BreakdownSeries**: Ya existe. La pantalla de detalle para LineChart deberá usarla igual que la hace `LineChartWidget`.
- **LineChartDetail** (componente interno en `chart-detail.tsx`): Debe recibir `breakdownProperty` y `lineChartMode` como props adicionales.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un LineChart con breakdown configurado muestra el mismo número de líneas coloreadas en el dashboard y en la pantalla de detalle (paridad visual 1:1).
- **SC-002**: El 100% de los flujos de edición de LineChart tienen la sección Breakdown disponible, equivalente a la de BarChart.
- **SC-003**: No hay regresiones en BarChart con breakdown (todos los escenarios existentes siguen funcionando).
- **SC-004**: Un LineChart sin breakdown sigue mostrando el comportamiento original (una sola línea, modo area) tanto en dashboard como en detalle.
- **SC-005**: Los cambios de breakdown guardados en edit-chart se reflejan inmediatamente en el siguiente render del widget y del detalle (sin necesidad de reiniciar la app).

---

## Non-Functional Requirements

- **NFR-001 (Offline)**: Los datos de breakdown ya cacheados (gcTime: 24h) DEBEN seguir siendo visibles en la pantalla de detalle aunque no haya conexión de red. No se requiere limpiar el cache en el fix.
- **NFR-002 (Performance)**: La adición de `useBreakdownSeries` en `LineChartDetail` NO DEBE degradar el tiempo de render cuando `breakdownProperty` es `undefined` (el hook ya está deshabilitado cuando no hay propiedad). No se esperan nuevas llamadas de red para LineChart sin breakdown.
- **NFR-003 (Compatibilidad)**: Los cambios DEBEN funcionar en iOS y Android con React Native New Architecture habilitada. Sin librerías Bridge-only nuevas.

---

## TDD Process *(mandatory)*

### Estrategia

No hay framework de tests automatizados configurado. El proceso TDD se ejecuta manualmente en simulador/dispositivo en el orden indicado, verificando que cada escenario falla *antes* del fix y pasa *después*.

### Pre-condiciones de entorno

1. App corriendo en simulador iOS o dispositivo físico.
2. Cuenta PostHog válida con al menos 1 evento que tenga la propiedad `$browser` o `$os`.
3. Dashboard con al menos 1 LineChart configurado con breakdown y al menos 1 sin breakdown.

### Ciclo por Bug

**Ciclo RED (antes del fix):**
1. Confirmar que el comportamiento incorrecto es reproducible (ver tabla de estado en Causa Raíz).
2. Documentar el estado fallido (captura de pantalla o nota).

**Ciclo GREEN (después del fix):**
1. Ejecutar cada acceptance scenario del User Story implementado.
2. Para cada `Given/When/Then`: preparar la pre-condición, ejecutar la acción, verificar el resultado esperado.
3. Marcar el scenario como PASS o FAIL.

**Ciclo REFACTOR:**
1. Verificar que todos los scenarios de no-regresión (US1-AC4, US2 para BarChart, US3-AC3) siguen pasando.

### Orden de ejecución recomendado

| Prioridad | Story | Scenario | Descripción breve |
|-----------|-------|----------|-------------------|
| 1 | US1 | AC1 | Detalle muestra múltiples líneas |
| 2 | US1 | AC2 | Leyenda de colores visible |
| 3 | US1 | AC3 | Modo cumulative + breakdown |
| 4 | US1 | AC4 | No-regresión: sin breakdown = 1 línea |
| 5 | US1 | AC5 | Sin datos = mensaje vacío |
| 6 | US2 | AC1 | Edit-chart muestra breakdown existente |
| 7 | US2 | AC2 | Edit-chart sin breakdown — puede seleccionar |
| 8 | US2 | AC3 | Modal carga propiedades del evento |
| 9 | US2 | AC4 | Guardar persiste el nuevo breakdown |
| 10 | US2 | AC5 | Quitar breakdown vuelve a 1 línea |
| 11 | US2 | AC6 | Cambiar evento resetea breakdown |
| 12 | US3 | AC1 | Tooltip muestra valores de series |
| 13 | US3 | AC2 | Tooltip se actualiza al mover pointer |
| 14 | US3 | AC3 | No-regresión: tooltip sin breakdown |

### Criterios de paso/fallo

- **PASS**: El comportamiento observado coincide exactamente con el `Then` del scenario.
- **FAIL**: Cualquier desviación visual, de datos o de navegación respecto al `Then`.
- Un FAIL en cualquier scenario de regresión (AC4, AC3-US3, BarChart) bloquea el merge.

---

## Assumptions

- La lógica de "top 5 + Otros" ya está implementada en `queryBreakdownSeries` y no necesita cambios.
- El hook `useBreakdownSeries` ya funciona correctamente y puede reutilizarse sin modificaciones.
- Los colores de breakdown (`BREAKDOWN_COLORS`, `BREAKDOWN_OTHER_COLOR`) ya están definidos y son compartidos.
- La pantalla de detalle del LineChart con breakdown usará la misma estructura de `dataSet` que ya usa `LineChartWidget`.
- Para el tooltip del LineChart con breakdown en detalle (User Story 3), se reutilizará el `pointerConfig` existente adaptado para mostrar múltiples valores.
- No se requiere soporte de `barChartMode` para LineChart (ese selector solo aplica a BarChart).

