# Feature Specification: Dashboard de Métricas PostHog

**Feature Branch**: `003-metrics-dashboard`  
**Created**: 2026-03-18  
**Status**: Draft  
**Input**: User description: "Dashboard donde se visualizan las métricas de PostHog con MetricCard, filtros de tiempo y refresh por pull-down"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver métricas en el dashboard (Priority: P1)

Un usuario autenticado abre la pantalla de Dashboard y ve todas las tarjetas de métricas que había configurado previamente. Cada tarjeta muestra un número grande con una etiqueta descriptiva del evento (ej. "1,234 — Usuarios Activos"). Los valores mostrados corresponden al período de tiempo actualmente seleccionado. Los datos provienen del caché local y no requieren conexión activa.

**Why this priority**: Es el núcleo de la funcionalidad. Sin esto, el resto de historias no aportan valor.

**Independent Test**: Puede probarse añadiendo manualmente tarjetas de métricas con datos ficticios en el almacenamiento local y verificando que se muestran correctamente en el dashboard.

**Acceptance Scenarios**:

1. **Given** un usuario tiene métricas configuradas y datos en caché, **When** abre el Dashboard, **Then** ve todas sus tarjetas de métricas con los valores del período seleccionado.
2. **Given** el dashboard no tiene métricas configuradas, **When** un usuario lo abre por primera vez, **Then** ve un estado vacío con un mensaje que invita a añadir la primera métrica.
3. **Given** hay datos en caché del período seleccionado, **When** el usuario navega al dashboard, **Then** los datos se muestran de inmediato sin indicador de carga.

---

### User Story 2 - Filtrar métricas por período de tiempo (Priority: P1)

El usuario puede cambiar el período de análisis usando un selector de filtros ubicado en el dashboard. Las opciones disponibles son: Hoy, Ayer, 7 días, 15 días, 30 días, 90 días, 180 días y Histórico completo. Al cambiar el período, los valores de todas las tarjetas se actualizan reflejando los datos del nuevo período (usando caché si están disponibles, o disparando una consulta si no).

**Why this priority**: El filtro de tiempo es esencial para interpretar correctamente cualquier métrica. Sin él, los números carecen de contexto.

**Independent Test**: Puede probarse con una sola tarjeta de métrica y verificando que al cambiar el período el valor mostrado cambia en consecuencia.

**Acceptance Scenarios**:

1. **Given** el usuario está en el Dashboard, **When** selecciona "7 días", **Then** todas las tarjetas muestran los valores acumulados de los últimos 7 días.
2. **Given** el usuario cambia de "Hoy" a "30 días", **When** el cambio se aplica, **Then** el período seleccionado queda visualmente destacado y los valores de las tarjetas se actualizan.
3. **Given** el usuario selecciona "Histórico completo", **When** los datos se cargan, **Then** las tarjetas reflejan todos los datos disponibles desde el inicio del proyecto en PostHog.
4. **Given** el período seleccionado no tiene datos en caché, **When** el usuario lo selecciona, **Then** se muestra un indicador de carga mientras se obtienen los datos de la API.

---

### User Story 3 - Añadir una nueva métrica al dashboard (Priority: P2)

El usuario presiona el botón "+" ubicado en la esquina superior derecha del Dashboard. Se abre un panel o pantalla que muestra la lista de todos los eventos disponibles en su proyecto PostHog. El usuario selecciona un evento, elige el tipo de visualización (actualmente solo MetricCard) y confirma. La nueva tarjeta aparece en el dashboard y se persiste localmente.

**Why this priority**: Es la forma de poblar el dashboard. Sin métricas configuradas el dashboard no tiene utilidad, pero puede demostrarse con datos iniciales precargados.

**Independent Test**: Puede probarse de manera aislada verificando que el flujo completo de selección (evento → tipo de gráfico → confirmación) resulta en una tarjeta visible en el dashboard.

**Acceptance Scenarios**:

1. **Given** el usuario está en el Dashboard, **When** presiona el botón "+", **Then** se abre una pantalla con la lista de eventos disponibles en su proyecto PostHog.
2. **Given** el usuario está en la lista de eventos, **When** busca o desplaza la lista, **Then** puede ver todos los eventos que expone la API de PostHog para su proyecto.
3. **Given** el usuario selecciona un evento, **When** elige el tipo "MetricCard" y confirma, **Then** la nueva tarjeta aparece en el dashboard mostrando el conteo del evento.
4. **Given** se confirma la nueva métrica, **When** el usuario cierra y vuelve a abrir la app, **Then** la tarjeta sigue presente en el dashboard (persistencia local).

---

### User Story 5 - Eliminar una métrica del dashboard (Priority: P2)

El usuario puede eliminar cualquier tarjeta de métrica del dashboard (independientemente del tipo de visualización). Para hacerlo, realiza una pulsación larga sobre la tarjeta deseada. El sistema muestra un diálogo de confirmación para evitar eliminaciones accidentales. Al confirmar, la tarjeta desaparece del dashboard, su configuración se elimina del almacenamiento local y los datos en caché asociados se borran también.

**Why this priority**: Sin la capacidad de eliminar métricas, el dashboard crece indefinidamente y el usuario no puede corregir errores de configuración. Es complemento directo del flujo de añadir métricas.

**Independent Test**: Puede probarse de forma aislada verificando que una pulsación larga sobre cualquier tarjeta activa el diálogo de confirmación y, al confirmar, la tarjeta desaparece y no reaparece al reiniciar la app.

**Acceptance Scenarios**:

1. **Given** el usuario está en el Dashboard con al menos una tarjeta, **When** realiza una pulsación larga sobre ella, **Then** aparece un diálogo de confirmación con opciones de "Eliminar" y "Cancelar".
2. **Given** el diálogo de confirmación está visible, **When** el usuario elige "Eliminar", **Then** la tarjeta desaparece del dashboard, su configuración se elimina localmente y sus datos en caché son borrados.
3. **Given** el diálogo de confirmación está visible, **When** el usuario elige "Cancelar", **Then** el diálogo se cierra y la tarjeta permanece sin cambios.
4. **Given** el usuario elimina todas las tarjetas, **When** elimina la última, **Then** el dashboard muestra el estado vacío que invita a añadir la primera métrica.
5. **Given** el usuario elimina una métrica y vuelve a abrir la app, **When** navega al dashboard, **Then** la tarjeta eliminada no aparece.

---

### User Story 4 - Refrescar datos del dashboard con pull-to-refresh (Priority: P2)

El usuario hace un gesto de "jalar hacia abajo" (pull-down) desde la parte superior del dashboard para actualizar todos los valores. La app consulta la API de PostHog para obtener datos frescos, actualiza el caché local y refresca los valores mostrados. Este es el único mecanismo que dispara una actualización activa de la API.

**Why this priority**: Garantiza que el usuario pueda ver datos actualizados cuando lo necesite, sin que la app consuma datos innecesariamente en segundo plano.

**Independent Test**: Puede probarse verificando que el gesto de pull-down desencadena una llamada a la API y los valores en pantalla cambian si hay datos nuevos.

**Acceptance Scenarios**:

1. **Given** el usuario está en el Dashboard, **When** realiza un gesto de jalar hacia abajo, **Then** aparece un indicador de actualización y se consultan los datos frescos de PostHog.
2. **Given** la actualización se completa con éxito, **When** el indicador desaparece, **Then** todas las tarjetas muestran los valores más recientes y el caché local está actualizado.
3. **Given** falla la conexión durante el pull-to-refresh, **When** se completa el intento fallido, **Then** se muestra un mensaje de error no invasivo y los datos anteriores del caché siguen visibles.
4. **Given** el usuario no ha realizado pull-to-refresh, **When** navega al dashboard, **Then** solo se muestran los datos del último refresco exitoso guardados en caché.

---

### Edge Cases

- ¿Qué ocurre cuando la API de PostHog no devuelve eventos (proyecto vacío)? → El selector de eventos muestra un estado vacío con mensaje informativo.
- ¿Qué ocurre cuando se intenta añadir el mismo evento más de una vez? → Se permite añadir duplicados (útil para comparar el mismo evento con distintos tipos de gráfico en el futuro).
- ¿Qué ocurre cuando no hay caché y no hay conexión? → Las tarjetas muestran un estado de error indicando que no hay datos disponibles.
- ¿Qué pasa si el período seleccionado no tiene eventos registrados? → La tarjeta muestra "0" como valor con el label correspondiente.
- ¿Qué ocurre cuando hay muchas métricas? → Las tarjetas se muestran en un scroll vertical sin límite máximo en esta versión.
- ¿Qué pasa si la API Key expira durante el pull-to-refresh? → El error de autenticación lleva al usuario al flujo de configuración de API Key.
- ¿Qué ocurre si el usuario intenta eliminar una métrica mientras hay un pull-to-refresh en curso? → El diálogo de confirmación se puede mostrar igualmente; la eliminación se procesa localmente y el refresco en curso se cancela o ignora la métrica eliminada.
- ¿Qué pasa con los datos en caché al eliminar una métrica? → Se eliminan todos los valores en caché asociados a esa métrica para todos los períodos de tiempo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El dashboard DEBE mostrar una lista scrolleable de tarjetas MetricCard configuradas por el usuario.
- **FR-002**: Cada MetricCard DEBE mostrar un número grande (conteo del evento) y una etiqueta con el nombre del evento.
- **FR-003**: El dashboard DEBE incluir un selector de período con las siguientes opciones: Hoy, Ayer, 7 días, 15 días, 30 días, 90 días, 180 días e Histórico completo.
- **FR-004**: Al cambiar el período de tiempo, todas las MetricCards DEBEN actualizarse para reflejar los valores del nuevo período.
- **FR-005**: El dashboard DEBE incluir un botón "+" en la esquina superior derecha de la pantalla.
- **FR-006**: Al presionar "+", el sistema DEBE mostrar la lista de todos los eventos disponibles en el proyecto PostHog del usuario (obtenidos desde la API).
- **FR-007**: El usuario DEBE poder seleccionar un evento de la lista y elegir el tipo de visualización; la única opción disponible en esta versión es MetricCard.
- **FR-008**: Al confirmar la selección de una nueva métrica, la MetricCard DEBE aparecer en el dashboard con el valor correcto para el período activo.
- **FR-009**: La configuración de métricas del dashboard (eventos seleccionados y tipo de visualización) DEBE persistirse localmente en el dispositivo.
- **FR-010**: Los valores numéricos de las métricas DEBEN almacenarse en caché local indexados por métrica y período de tiempo.
- **FR-011**: Los datos del caché DEBEN ser la única fuente de datos al renderizar el dashboard; la API solo se consulta durante el pull-to-refresh o cuando se cambia a un período sin caché.
- **FR-012**: El usuario DEBE poder refrescar todos los valores del dashboard realizando un gesto de jalar hacia abajo (pull-to-refresh).
- **FR-013**: Durante el pull-to-refresh, el sistema DEBE mostrar un indicador visual de carga.
- **FR-014**: Si el pull-to-refresh falla, el sistema DEBE mostrar un mensaje de error y conservar los últimos datos del caché.
- **FR-015**: Cuando el dashboard no tiene métricas configuradas, el sistema DEBE mostrar un estado vacío que invite a añadir la primera métrica.
- **FR-016**: El usuario DEBE poder eliminar cualquier tarjeta de métrica del dashboard (independientemente del tipo de visualización) mediante una pulsación larga sobre ella.
- **FR-017**: Antes de eliminar una métrica, el sistema DEBE mostrar un diálogo de confirmación con opciones de confirmar y cancelar para evitar eliminaciones accidentales.
- **FR-018**: Al confirmar la eliminación, el sistema DEBE borrar tanto la configuración de la métrica como todos sus datos en caché del almacenamiento local.
- **FR-019**: El bottom sheet de "Añadir Métrica" (`AddMetricSheet`) DEBE respetar el safe area superior del dispositivo. Al expandirse, el sheet NO DEBE sobrepasar el inset superior (notch / Dynamic Island en iPhone). Se DEBE usar la prop `topInset` de `@gorhom/bottom-sheet` con el valor proporcionado por `useSafeAreaInsets()` de `react-native-safe-area-context`.

### Key Entities

- **DashboardMetric**: Representa una métrica configurada en el dashboard. Tiene un evento PostHog asociado, un tipo de visualización (MetricCard) y un orden de posición.
- **MetricCache**: Almacena el valor numérico de una métrica para un período de tiempo específico. Asocia una DashboardMetric con un período y su valor resuelto, junto con la fecha del último refresco.
- **TimeFilter**: Representa el período de tiempo seleccionado activamente. Valores posibles: `today`, `yesterday`, `7d`, `15d`, `30d`, `90d`, `180d`, `all`.
- **PostHogEvent**: Representa un evento registrado en PostHog. Tiene un identificador único y un nombre legible para el usuario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los usuarios pueden añadir una nueva métrica al dashboard en menos de 30 segundos desde que presionan "+".
- **SC-002**: El dashboard muestra los valores del caché en menos de 500 ms desde que se abre la pantalla.
- **SC-003**: El pull-to-refresh actualiza todos los valores visibles en menos de 5 segundos en condiciones normales de conectividad.
- **SC-004**: Al cambiar el período de tiempo, los valores de las tarjetas se actualizan en menos de 300 ms cuando hay datos en caché disponibles.
- **SC-005**: El 100% de las métricas configuradas persisten correctamente tras cerrar y volver a abrir la aplicación.
- **SC-006**: La pantalla de selección de eventos muestra la lista completa de eventos del proyecto PostHog sin truncamiento.
- **SC-007**: En ausencia de conectividad, el dashboard sigue siendo completamente funcional mostrando los últimos valores almacenados en caché.
- **SC-008**: La eliminación de una métrica (desde pulsación larga hasta desaparición de la tarjeta tras confirmar) se completa en menos de 500 ms.

## Clarifications

### Session 2026-03-18

- Q: ¿Cómo accede el usuario a la opción de eliminar una métrica del dashboard? → A: Pulsación larga (long press) sobre la tarjeta → diálogo de confirmación para eliminar.
- Q: ¿Es necesario poder eliminar métricas del dashboard? → A: Sí, aplica a MetricCard y a cualquier tipo de gráfico futuro.

## Assumptions

- El usuario ya está autenticado con una API Key válida de PostHog (cubierto por la feature 001-api-key-screen).
- La API de PostHog expone un endpoint para listar los eventos disponibles del proyecto.
- La API de PostHog permite consultar el conteo agregado de un evento para un rango de fechas dado.
- El orden de las tarjetas es el orden de creación (más recientes al final). La reordenación queda fuera del alcance de esta versión.
- La eliminación de métricas está dentro del alcance de esta versión y aplica a todos los tipos de visualización presentes y futuros.
- Solo se implementa el tipo de visualización MetricCard en esta versión; otros tipos son extensiones futuras.
- "Histórico completo" consulta todos los datos sin filtro de fecha, equivalente a "desde el inicio del proyecto".
