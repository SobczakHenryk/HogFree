# Feature Specification: Funnel Chart Widget

**Feature Branch**: `006-funnel-chart-widget`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: Componente FunnelChart para visualizar embudos de conversión en el Dashboard de PostHog Mobile. Barras horizontales descendentes con porcentaje de conversión entre pasos, colores degradados según caída de usuarios, hook useFunnelInsight conectado a la API de PostHog tipo Funnel, soporte de hasta 10 eventos por funnel.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar un funnel de conversión en el dashboard (Priority: P1)

Un usuario autenticado abre el dashboard y ve un widget de tipo FunnelChart que muestra los pasos de un embudo de conversión configurado por él. Cada paso muestra el nombre del evento, el conteo de usuarios y una barra horizontal cuya anchura refleja la proporción respecto al primer paso. Entre cada barra se muestra el porcentaje de conversión respecto al paso anterior.

**Why this priority**: Es el núcleo del feature. Sin la visualización del funnel, el resto carece de valor.

**Independent Test**: Completamente testeable añadiendo un FunnelChart al dashboard y verificando que muestra pasos, conteos y porcentajes de conversión.

**Acceptance Scenarios**:

1. **Given** el dashboard contiene un widget FunnelChart con datos de PostHog, **When** el usuario lo visualiza, **Then** ve cada paso con nombre, conteo de usuarios y barra horizontal proporcional al primer paso.
2. **Given** el funnel tiene ≥ 2 pasos, **When** se renderizan los pasos, **Then** entre cada par de pasos consecutivos se muestra el porcentaje de conversión del paso anterior al actual y el número de usuarios perdidos.
3. **Given** el funnel tiene ≥ 2 pasos, **When** la visualización es completa, **Then** el footer muestra el porcentaje de conversión total (primer paso → último paso).
4. **Given** no hay datos para el período seleccionado, **When** el widget se renderiza, **Then** muestra un mensaje "Sin datos para este período" en lugar de barras.
5. **Given** ocurre un error de red, **When** el widget se renderiza, **Then** muestra un mensaje de error sin crashear la app.

---

### User Story 2 - Configurar un funnel de hasta 10 pasos al añadir una métrica (Priority: P1)

El usuario pulsa el botón "+" del dashboard, selecciona un evento inicial, elige "FunnelChart" como tipo de visualización, y luego configura una secuencia ordenada de hasta 10 eventos que forman el embudo.

**Why this priority**: Sin la configuración del funnel no se puede crear un widget FunnelChart desde la UI.

**Independent Test**: Completamente testeable abriendo el sheet de añadir métrica, siguiendo el flujo de 3 pasos hasta "FunnelChart" y verificando que el funnel queda guardado.

**Acceptance Scenarios**:

1. **Given** el usuario selecciona "FunnelChart" en el paso de selección de tipo, **When** pulsa "Continuar", **Then** se abre un tercer paso donde el evento inicial ya aparece como paso 1.
2. **Given** el usuario está en el paso de configuración del funnel, **When** pulsa "Agregar paso...", **Then** se abre un modal con un campo de búsqueda y la lista de eventos del proyecto; al seleccionar uno se añade al final de la lista de pasos y el modal se cierra.
3. **Given** la lista de pasos ya tiene 10 eventos, **When** el usuario los ve, **Then** el botón "Agregar paso..." desaparece y no es posible añadir más pasos.
4. **Given** la lista de pasos tiene menos de 2 eventos, **When** el usuario intenta confirmar, **Then** el botón "Añadir funnel" permanece deshabilitado.
5. **Given** la lista tiene ≥ 3 pasos, **When** el usuario pulsa el icono de eliminar de un paso intermediario, **Then** ese paso se elimina y la numeración se recalcula.
6. **Given** la configuración es válida (≥ 2 pasos), **When** el usuario confirma, **Then** se le solicita un nombre personalizado para el funnel (con el nombre del primer evento como valor por defecto) y, tras confirmar, el widget FunnelChart aparece en el dashboard con ese nombre como título y persiste tras cerrar y reabrir la app.

---

### User Story 3 - Gradiente de color para indicar caída de usuarios (Priority: P2)

Las barras del funnel utilizan un color que se degrada desde el color primario (mayor intensidad para el primer paso) hasta un tono apagado (menor intensidad para los pasos con mayor caída), transmitiendo visualmente la pérdida de usuarios.

**Why this priority**: Mejora la legibilidad sin ser esencial para la funcionalidad.

**Independent Test**: Verificable visualmente comparando el color de la primera barra (primario) contra el de la última (apagado).

**Acceptance Scenarios**:

1. **Given** el funnel tiene múltiples pasos, **When** se renderizan las barras, **Then** la primera barra tiene el color Blue (#3B82F6) y cada barra subsiguiente degrada hacia Teal (#2DD4BF), proporcional a su ratio de conversión. *(Actualizado en 015-dashboard-ui-refactor: antes era #7B61FF → tono apagado.)*
2. **Given** un paso tiene ratio de conversión cercano al 100% respecto al primero, **When** se renderiza, **Then** su barra mantiene un color próximo al Blue (#3B82F6).

---

### User Story 4 - Pull-to-refresh del funnel (Priority: P2)

El usuario desliza hacia abajo en el dashboard para refrescar los datos. El widget FunnelChart actualiza sus datos llamando a la API de PostHog con `force_blocking`.

**Why this priority**: Consistente con el comportamiento de los demás widgets del dashboard.

**Independent Test**: Verificable haciendo pull-to-refresh y confirmando que el widget muestra un indicador de carga y luego datos actualizados.

**Acceptance Scenarios**:

1. **Given** el dashboard contiene un FunnelChart, **When** el usuario hace pull-to-refresh, **Then** el widget vuelve a consultar la API y actualiza los datos mostrados.

---

### User Story 5 — Nombre personalizado para el FunnelChart (Priority: P1)

Al crear un FunnelChart, el usuario puede asignar un nombre personalizado que se mostrará como título del widget en el dashboard (ej. "Embudo de Registro" en lugar de `$pageview`). Las barras internas del funnel mantienen los nombres de los eventos de PostHog.

**Why this priority**: Los nombres técnicos de eventos no comunican el propósito del funnel. Un nombre descriptivo como "Embudo de Compra" es esencial para interpretar el dashboard rápidamente.

**Independent Test**: Crear un FunnelChart, escribir un nombre personalizado (ej. "Conversión Checkout"), confirmar, y verificar que (a) el título del widget muestra "Conversión Checkout" y (b) las barras internas siguen mostrando los nombres de los eventos.

**Acceptance Scenarios**:

1. **Given** el usuario ha configurado los pasos del funnel y va a confirmar, **When** se presenta el campo de nombre, **Then** el campo muestra el nombre del primer evento como valor por defecto.
2. **Given** el usuario escribe "Embudo de Registro" en el campo de nombre, **When** confirma, **Then** el título del widget FunnelChart en el dashboard muestra "Embudo de Registro".
3. **Given** el widget tiene nombre personalizado, **When** se observan las barras internas del funnel, **Then** cada barra muestra el nombre del evento de PostHog correspondiente (no el nombre personalizado).
4. **Given** el campo de nombre está vacío, **When** el usuario intenta confirmar, **Then** el botón de confirmar permanece deshabilitado.
5. **Given** el usuario asignó un nombre personalizado, **When** cierra y reabre la app, **Then** el nombre personalizado se mantiene.

---

### Edge Cases

- ¿Qué pasa si un evento del funnel ya no existe en PostHog? → La API devuelve conteo 0 para ese paso; se muestra el paso con 0 y "0% conversión".
- ¿Qué pasa si el funnel tiene solo 1 paso configurado? → El widget no realiza la query (disabled) y muestra estado vacío.
- ¿Qué pasa si todos los pasos tienen igual conteo? → Todas las barras tienen la misma anchura (100%) y el color primario completo.
- ¿Qué pasa si el primer paso tiene 0 usuarios? → Se evita división por cero; todas las barras muestran anchura mínima y "0.0% conversión total".
- ¿Qué pasa si el usuario borra la app y la reinstala? → Los funnelEvents se persisten en AsyncStorage igual que las demás métricas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE consultar un insight de tipo `FunnelsQuery` a la API de PostHog con una lista ordenada de eventos y el rango de fechas del filtro de tiempo activo.
- **FR-002**: El sistema DEBE mostrar las barras del funnel en orden descendente de conversión, cada una con el **nombre del evento de PostHog** (no el nombre personalizado del widget) y el conteo absoluto de usuarios.
- **FR-003**: El sistema DEBE calcular y mostrar el porcentaje de conversión entre cada par de pasos consecutivos (paso N-1 → paso N), junto con el número absoluto de usuarios perdidos.
- **FR-004**: El sistema DEBE mostrar al pie del widget el porcentaje de conversión total (primer paso → último paso).
- **FR-005**: El sistema DEBE usar colores que degraden desde Blue (#3B82F6, ratio 1.0) hasta Teal (#2DD4BF, ratio 0) para cada barra, proporcional al ratio de conversión del paso respecto al primero. *(Actualizado en 015-dashboard-ui-refactor.)*
- **FR-006**: El usuario DEBE poder configurar entre 2 y 10 eventos en un funnel al crear un widget FunnelChart. La selección de eventos adicionales se realiza mediante un dropdown que abre un modal con buscador integrado y `FlatList` de eventos disponibles, evitando el scroll anidado dentro del BottomSheet.
- **FR-007**: El sistema DEBE mostrar un estado de carga (skeleton animado) mientras la query está en progreso.
- **FR-008**: El sistema DEBE mostrar un estado de error con mensaje legible cuando la query falla.
- **FR-009**: El sistema DEBE mostrar "Sin datos para este período" cuando la API devuelve un funnel sin pasos.
- **FR-010**: Los pasos del funnel configurados DEBEN persistir en almacenamiento local y sobrevivir reinicios de la app.
- **FR-011**: El widget FunnelChart DEBE responder al pull-to-refresh del dashboard actualizando sus datos desde la API.
- **FR-012**: El usuario DEBE poder eliminar un widget FunnelChart del dashboard mediante long-press igual que los demás widgets.
- **FR-013**: Los pasos del funnel configurados durante la creación DEBEN ser reordenables: el usuario puede eliminar pasos intermedios (manteniendo mínimo 2).
- **FR-014**: El flujo de creación de un FunnelChart DEBE incluir un campo de texto editable para que el usuario asigne un nombre personalizado al widget. El campo DEBE pre-rellenarse con el nombre del primer evento del funnel (`funnelSteps[0]`) como valor por defecto. El nombre ingresado se almacena en `DashboardMetric.label`.
- **FR-015**: El título del widget FunnelChart en el dashboard DEBE mostrar `DashboardMetric.label` (nombre personalizado). Las barras internas del funnel DEBEN seguir mostrando los nombres de los eventos de PostHog (`FunnelStep.name`), no el nombre personalizado.
- **FR-016**: El botón de confirmar DEBE estar deshabilitado si el campo de nombre personalizado está vacío (solo espacios en blanco no cuentan como texto válido).

### Key Entities

- **FunnelStep**: Representa un paso dentro del resultado del funnel. Atributos: nombre del evento, conteo de usuarios que llegaron a este paso, índice de orden.
- **FunnelResult**: Resultado completo de un insight Funnel. Contiene la lista ordenada de FunnelSteps y el timestamp del último refresco.
- **DashboardMetric (extensión)**: Entidad existente. Se extiende con `funnelEvents: string[]` (opcional, presente solo cuando `chartType === 'FunnelChart'`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El usuario puede configurar y guardar un funnel de 2 a 10 pasos en menos de 60 segundos.
- **SC-002**: El widget FunnelChart muestra datos reales de PostHog en menos de 5 segundos tras añadirse al dashboard (con red normal).
- **SC-003**: El porcentaje de conversión entre pasos es visualmente distinguible: la diferencia de anchura entre barras con distinto ratio es perceptible a simple vista.
- **SC-004**: El widget persiste correctamente: al cerrar y reabrir la app, el funnel configurado aparece con los mismos pasos y datos en cache.
- **SC-005**: El flujo de creación de un FunnelChart no introduce errores en los demás tipos de widgets del dashboard.

## Clarifications

### Session 2026-03-19

- Q: ¿Cómo debe funcionar el selector de eventos en el paso 3 del funnel? → A: Dropdown con botón "Agregar paso..." que abre un `Modal` nativo (`animationType="slide"`) con `TextInput` de búsqueda con `autoFocus` y `FlatList` de eventos filtrados. Al seleccionar un evento, el modal cierra y el evento se añade a la lista de pasos. Esto reemplaza el `TextInput` + `BottomSheetFlashList` inline que presentaba problemas de scroll anidado dentro del `BottomSheet`.
- Q: ¿El usuario puede ponerle nombre personalizado a un FunnelChart? → **Sí**. Al confirmar la creación del funnel, se muestra un campo de texto pre-rellenado con el nombre del primer evento. El usuario puede editarlo libremente (ej. "Embudo de Compra"). Este nombre se guarda en `DashboardMetric.label` y se muestra como título del widget. Las barras internas del funnel **siempre** muestran los nombres de los eventos de PostHog (`FunnelStep.name`), no el nombre personalizado. Esto aplica a todos los tipos de visualización: MetricCard, BarChart, LineChart y FunnelChart.

## Assumptions

- La API de PostHog soporta `FunnelsQuery` con `funnelOrderType: 'ordered'` y devuelve results como array de arrays de pasos.
- El tiempo de expiración del cache de funnels se alinea con los demás widgets: `staleTime: Infinity`, `gcTime: 24h`.
- El idioma de la UI es español (mismo que el resto de la app).
- El primer evento seleccionado al elegir el tipo FunnelChart sirve como paso 1 del funnel; el usuario puede añadir más desde el tercer paso del sheet.
- El color de las barras se interpola en el espacio RGB entre Blue (#3B82F6) y Teal (#2DD4BF). *(Actualizado en 015-dashboard-ui-refactor: antes era primario → tono apagado.)*

