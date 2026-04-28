# Feature Specification: Pantalla de Edición de Chart

**Feature Branch**: `007-chart-edit-screen`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: Reemplazar la interacción de long-press para eliminar charts por una pantalla de edición completa. Al hacer tap en cualquier chart del dashboard, se abre una nueva pantalla donde el usuario puede editar el nombre, cambiar el evento, cambiar el tipo de agregación (unique users / total events) y eliminar el chart.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir pantalla de edición al hacer tap en un chart (Priority: P1)

Un usuario autenticado está en el dashboard y ve sus charts configurados. Al hacer tap en cualquier chart (MetricCard, BarChart, LineChart o FunnelChart), navega a una nueva pantalla de edición dedicada a ese chart.

**Why this priority**: Es el punto de entrada a toda la funcionalidad de edición. Sin esta navegación, el resto de las historias no son accesibles.

**Independent Test**: Hacer tap en cualquier chart y verificar que se abre la pantalla de edición con los datos precargados del chart seleccionado.

**Acceptance Scenarios**:

1. **Given** el dashboard tiene al menos un chart, **When** el usuario hace tap sobre él, **Then** se abre la pantalla de edición mostrando los datos actuales del chart (nombre, evento, tipo de agregación).
2. **Given** el usuario está en la pantalla de edición, **When** presiona el botón de volver (back), **Then** regresa al dashboard sin cambios.
3. **Given** el usuario hace tap en un FunnelChart, **When** se abre la pantalla de edición, **Then** los campos de evento y agregación NO se muestran (los funnels tienen configuración distinta), solo se muestra el nombre editable y la opción de eliminar.

---

### User Story 2 - Editar el nombre del chart (Priority: P1)

El usuario puede cambiar el label/nombre que se muestra como título del chart en el dashboard. El campo de texto muestra el nombre actual y permite modificarlo.

**Why this priority**: Es una de las funcionalidades principales de la pantalla de edición.

**Independent Test**: Abrir la pantalla de edición, cambiar el nombre, guardar y verificar que el dashboard muestra el nuevo nombre.

**Acceptance Scenarios**:

1. **Given** la pantalla de edición está abierta, **When** el usuario ve el campo de nombre, **Then** muestra el `label` actual del chart como valor inicial.
2. **Given** el usuario modifica el nombre a "Mis Pageviews", **When** presiona "Guardar", **Then** el chart en el dashboard muestra "Mis Pageviews" como título.
3. **Given** el usuario deja el campo de nombre vacío (o solo espacios), **When** intenta guardar, **Then** el botón "Guardar" permanece deshabilitado.
4. **Given** el usuario cambia el nombre y guarda, **When** cierra y reabre la app, **Then** el nombre modificado persiste.

---

### User Story 3 - Cambiar el evento del chart (Priority: P1)

El usuario puede cambiar el evento de PostHog asociado al chart. Se muestra el evento actual y un selector que permite elegir otro evento de la lista de eventos disponibles del proyecto.

**Why this priority**: Permite reutilizar un chart existente para otro evento sin tener que eliminarlo y recrearlo.

**Independent Test**: Abrir la pantalla de edición, cambiar el evento, guardar y verificar que el chart muestra datos del nuevo evento.

**Acceptance Scenarios**:

1. **Given** la pantalla de edición está abierta para un chart no-funnel, **When** el usuario ve el selector de evento, **Then** muestra el `eventName` actual del chart como seleccionado.
2. **Given** el usuario toca el selector de evento, **When** se abre la lista de eventos, **Then** ve todos los eventos disponibles del proyecto PostHog con un buscador.
3. **Given** el usuario selecciona un nuevo evento "$signup", **When** presiona "Guardar", **Then** el chart en el dashboard se actualiza mostrando datos del evento "$signup".
4. **Given** el usuario cambia el evento, **When** los datos del evento anterior estaban en caché, **Then** el caché del chart anterior se invalida y se obtienen datos frescos del nuevo evento.
5. **Given** el chart es un FunnelChart, **When** la pantalla de edición se abre, **Then** el selector de evento NO aparece (los funnels usan múltiples eventos configurados en su flujo de creación).

---

### User Story 4 - Cambiar el tipo de agregación (Priority: P1)

El usuario puede alternar entre "Unique Users" (conteo de usuarios únicos con `math: 'dau'`) y "Total Events" (conteo total por defecto) para charts de tipo MetricCard, BarChart y LineChart.

**Why this priority**: Es una capacidad analítica clave que permite ver la misma métrica desde dos perspectivas distintas sin crear charts duplicados.

**Independent Test**: Abrir la pantalla de edición, cambiar la agregación de "Total Events" a "Unique Users", guardar y verificar que el chart muestra datos con la nueva agregación.

**Acceptance Scenarios**:

1. **Given** la pantalla de edición está abierta, **When** el usuario ve el selector de agregación, **Then** muestra la agregación actual del chart (por defecto "Total Events").
2. **Given** el usuario selecciona "Unique Users", **When** presiona "Guardar", **Then** el chart en el dashboard muestra datos agregados por usuarios únicos.
3. **Given** el usuario cambia de "Total Events" a "Unique Users" y guarda, **When** cierra y reabre la app, **Then** la agregación "Unique Users" persiste.
4. **Given** el chart es un FunnelChart, **When** la pantalla de edición se abre, **Then** el selector de agregación NO aparece.

---

### User Story 5 - Eliminar chart desde la pantalla de edición (Priority: P1)

El usuario puede eliminar el chart desde la pantalla de edición mediante un botón claramente visible (rojo, en la parte inferior de la pantalla). Al presionarlo se muestra un diálogo de confirmación. Esto reemplaza la interacción de long-press como mecanismo principal de eliminación.

**Why this priority**: La eliminación por long-press no es intuitiva. Un botón explícito de eliminar mejora significativamente la usabilidad.

**Independent Test**: Abrir la pantalla de edición, presionar "Eliminar", confirmar en el diálogo y verificar que el chart desaparece del dashboard.

**Acceptance Scenarios**:

1. **Given** la pantalla de edición está abierta, **When** el usuario ve la pantalla, **Then** hay un botón "Eliminar" rojo visible en la parte inferior.
2. **Given** el usuario presiona "Eliminar", **When** aparece un diálogo de confirmación, **Then** muestra opciones "Eliminar" (destructiva) y "Cancelar".
3. **Given** el diálogo de confirmación está visible, **When** el usuario elige "Eliminar", **Then** el chart se elimina del dashboard, el caché se invalida y el usuario es redirigido al dashboard.
4. **Given** el diálogo de confirmación está visible, **When** el usuario elige "Cancelar", **Then** el diálogo se cierra y permanece en la pantalla de edición.
5. **Given** el usuario elimina el último chart del dashboard, **When** regresa al dashboard, **Then** ve el estado vacío que invita a añadir la primera métrica.

---

### User Story 6 - Remover long-press de los widgets del dashboard (Priority: P2)

Se elimina la interacción de long-press para borrar charts de todos los widgets (MetricCard, BarChartWidget, LineChartWidget, FunnelChart). La eliminación ahora solo es accesible desde la pantalla de edición.

**Why this priority**: Limpia la UX inconsistente una vez que la pantalla de edición proporciona la funcionalidad de eliminación.

**Independent Test**: Hacer long-press en cualquier chart y verificar que NO aparece el diálogo de eliminación.

**Acceptance Scenarios**:

1. **Given** el dashboard tiene charts, **When** el usuario hace long-press en un MetricCard, **Then** NO aparece ningún diálogo de eliminación.
2. **Given** el dashboard tiene charts, **When** el usuario hace long-press en un BarChartWidget, **Then** NO aparece ningún diálogo de eliminación.
3. **Given** el dashboard tiene charts, **When** el usuario hace long-press en un LineChartWidget, **Then** NO aparece ningún diálogo de eliminación.
4. **Given** el dashboard tiene charts, **When** el usuario hace long-press en un FunnelChart, **Then** NO aparece ningún diálogo de eliminación.

---

### User Story 7 - Editar el display name personalizado del chart *(Added in 015-dashboard-ui-refactor)* (Priority: P1)

El usuario puede asignar un "display name" opcional que reemplaza el título de la tarjeta en el dashboard. Si se deja vacío, la tarjeta usa el `label` original como título.

**Why this priority**: Permite personalizar el dashboard sin afectar la identificación interna del chart.

**Independent Test**: Abrir la pantalla de edición, escribir un display name, guardar y verificar que el dashboard muestra el display name como título con el event name en gris debajo.

**Acceptance Scenarios**:

1. **Given** la pantalla de edición está abierta, **When** el usuario ve los campos, **Then** hay un campo "Display Name" debajo del campo de nombre con placeholder "Custom title (optional)".
2. **Given** el chart tiene un displayName existente, **When** se abre la pantalla de edición, **Then** el campo muestra el displayName actual.
3. **Given** el usuario escribe "Mi Métrica Custom" en displayName y guarda, **When** vuelve al dashboard, **Then** la tarjeta muestra "Mi Métrica Custom" como título y el eventName en gris debajo.
4. **Given** el usuario borra el displayName (lo deja vacío) y guarda, **When** vuelve al dashboard, **Then** la tarjeta vuelve a mostrar `label` como título sin caption.
5. **Given** el display name contiene solo espacios, **When** el usuario guarda, **Then** se trata como vacío (se persiste `undefined`).
6. **Given** el cambio de displayName, **When** se persiste, **Then** se almacena en `DashboardMetric.displayName` via `updateMetric`.

---

### Edge Cases

- ¿Qué pasa si el usuario edita un chart y cambia el evento mientras hay un pull-to-refresh en curso? → El pull-to-refresh en curso se ignora; al guardar se invalida el caché y los nuevos datos se obtienen en el siguiente render o pull-to-refresh.
- ¿Qué pasa si el evento seleccionado ya no existe en PostHog? → La API devuelve conteo 0; se comporta igual que hoy.
- ¿Qué pasa si el usuario cambia agregación y evento al mismo tiempo? → Ambos cambios se persisten atómicamente al pulsar "Guardar".
- ¿Qué pasa si el usuario navega a edición y no cambia nada? → Al volver atrás no se realizan cambios ni se invalida caché.
- ¿Qué pasa si se intenta editar un chart y AsyncStorage falla al guardar? → Se muestra un toast de error y los datos no se modifican.
- ¿Qué pasa si la lista de eventos falla al cargar? → El selector de eventos muestra un estado de error retry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Al hacer tap en cualquier chart del dashboard, el sistema DEBE navegar a una pantalla de edición dedicada para ese chart.
- **FR-002**: La pantalla de edición DEBE mostrar un campo de texto editable pre-rellenado con el `label` actual del chart.
- **FR-003**: La pantalla de edición DEBE mostrar un selector de evento que permita cambiar el `eventName` del chart, mostrando todos los eventos disponibles del proyecto PostHog con búsqueda. Este campo NO se muestra para FunnelChart.
- **FR-004**: La pantalla de edición DEBE mostrar un selector de tipo de agregación con dos opciones: "Total Events" (por defecto, sin `math`) y "Unique Users" (`math: 'dau'`). Este campo NO se muestra para FunnelChart.
- **FR-005**: El botón "Guardar" DEBE estar deshabilitado cuando el campo de nombre está vacío o contiene solo espacios.
- **FR-006**: Al presionar "Guardar", el sistema DEBE persistir los cambios (nombre, evento, agregación) en AsyncStorage y actualizar el estado del dashboard.
- **FR-007**: Al cambiar el evento o la agregación, el sistema DEBE invalidar el caché de TanStack Query asociado al chart para que se obtengan datos nuevos.
- **FR-008**: La pantalla de edición DEBE incluir un botón "Eliminar" con estilo destructivo (rojo) en la parte inferior.
- **FR-009**: Al presionar "Eliminar", el sistema DEBE mostrar un diálogo de confirmación antes de proceder. Al confirmar, elimina el chart, invalida su caché y navega de vuelta al dashboard.
- **FR-010**: Se DEBE eliminar la funcionalidad de long-press para eliminar charts de todos los widgets (MetricCard, BarChartWidget, LineChartWidget, FunnelChart).
- **FR-011**: Se DEBE eliminar la prop `onDelete` de todos los widgets de chart, ya que la eliminación ahora se gestiona desde la pantalla de edición.
- **FR-012**: El hook `useDashboardConfig` DEBE exponer una nueva función `updateMetric(id, changes)` que actualice parcialmente los campos de un `DashboardMetric` existente y persista los cambios.
- **FR-013**: La pantalla de edición DEBE usar navegación tipo stack (push/pop) integrada con Expo Router.
- **FR-014**: El campo `math` DEBE añadirse como campo opcional a `DashboardMetric` para persistir el tipo de agregación. Valores posibles: `undefined` (total events) o `'dau'` (unique users).
- **FR-015**: Los hooks `useMetricValue` y `useMetricSeries` DEBEN pasar el campo `math` del `DashboardMetric` al body de la query de PostHog cuando esté definido.
- **FR-016**: La pantalla de edición DEBE incluir un campo de texto "Display Name" (opcional) que permita asignar un nombre personalizado que reemplaza el título del widget en el dashboard. El campo se persiste en `DashboardMetric.displayName`. Si está vacío o solo contiene espacios, se persiste como `undefined`. *(Añadido en 015-dashboard-ui-refactor.)*

### Key Entities

- **DashboardMetric** (extensión): Se añade campo opcional `math?: 'dau'` para persistir el tipo de agregación.
- **EditableMetricFields**: Campos que pueden modificarse desde la pantalla de edición: `label`, `eventName`, `math`, `displayName`. *(displayName añadido en 015-dashboard-ui-refactor.)*
- **AggregationType**: Tipo de agregación para la query. Valores: `'total'` (default, sin math) o `'dau'` (unique users).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El usuario puede abrir la pantalla de edición de cualquier chart en menos de 300ms desde el tap.
- **SC-002**: Los cambios guardados (nombre, evento, agregación) se reflejan en el dashboard inmediatamente al volver.
- **SC-003**: Los cambios persisten correctamente tras cerrar y reabrir la aplicación.
- **SC-004**: La eliminación desde la pantalla de edición funciona para todos los tipos de chart (MetricCard, BarChart, LineChart, FunnelChart).
- **SC-005**: El long-press ya no activa eliminación en ningún tipo de widget del dashboard.
- **SC-006**: Al cambiar el evento o la agregación, los datos se refrescan mostrando información del nuevo evento/agregación.

## Clarifications

- Los FunnelCharts solo permiten editar nombre y eliminar (no cambiar evento ni agregación) porque su configuración multi-evento es más compleja.
- La agregación "Unique Users" usa `math: 'dau'` de la API de PostHog, que cuenta usuarios únicos por día.
- No se implementa edición de los pasos del funnel en esta spec; eso sería una feature futura.
- El long-press se elimina para simplificar la UX, pero se podría reconsiderar en el futuro como atajo (fuera del alcance de esta spec).
