# Feature Specification: Pantalla de API Key

**Feature Branch**: `001-api-key-screen`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: User description: "Pantalla para ingresar la API Key de PostHog, guardar solo en el dispositivo de forma segura, validar contra la API, y no mostrar completa una vez guardada"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro inicial de API Key (Priority: P1)

Un usuario nuevo abre la aplicación por primera vez. Se le presenta una pantalla para ingresar su API Key de PostHog y seleccionar si su cuenta usa US Cloud o EU Cloud. Escribe la clave, elige la región, toca "Guardar" y la app valida la clave contra la API privada correcta de PostHog. Al ser válida, la clave y la región seleccionada se almacenan de forma segura en el dispositivo y el usuario accede a la aplicación.

**Why this priority**: Es la puerta de entrada a toda la aplicación. Sin este flujo, ninguna otra funcionalidad es accesible.

**Independent Test**: Puede probarse abriendo la app desde cero en un dispositivo, ingresando una API Key válida de PostHog, seleccionando US Cloud o EU Cloud, y verificando que la navegación avanza correctamente.

**Acceptance Scenarios**:

1. **Given** la app no tiene API Key guardada, **When** el usuario ingresa una API Key válida, selecciona la región correcta (US Cloud o EU Cloud) y toca "Guardar", **Then** la clave se valida contra el cloud seleccionado, se almacena de forma segura junto con la región y el usuario es redirigido a la pantalla principal.
2. **Given** la app no tiene API Key guardada, **When** el usuario ingresa una API Key inválida y toca "Guardar", **Then** la app muestra un mensaje de error claro indicando que la clave no es válida, sin navegar ni almacenar nada.
3. **Given** la app no tiene API Key guardada, **When** el usuario toca "Guardar" con el campo vacío, **Then** la app muestra un mensaje de validación y no realiza ninguna petición a la API.

---

### User Story 2 - Visualización y copia de API Key guardada (Priority: P2)

Un usuario que ya configuró su API Key accede a la sección de ajustes/configuración. Por defecto la clave se muestra enmascarada (ej: `phx_AbCd...rSt`). El usuario puede alternar la visibilidad para ver la clave completa, y puede copiarla al portapapeles. Al cambiar la clave, el campo de edición aparece vacío por seguridad.

**Why this priority**: Es un requisito de usabilidad y seguridad: la clave debe estar protegida visualmente por defecto, pero el usuario necesita poder consultarla y copiarla cuando lo requiera (por ejemplo, para verificarla o usarla en otro contexto).

**Independent Test**: Puede probarse navegando a la pantalla de configuración con una API Key ya guardada, verificando que se muestra enmascarada por defecto, alternando visibilidad para ver la clave completa, y copiando al portapapeles para verificar que se copia el valor íntegro.

**Acceptance Scenarios**:

1. **Given** existe una API Key guardada, **When** el usuario visualiza la pantalla de configuración, **Then** la clave se muestra enmascarada por defecto (primeros 8 y últimos 4 caracteres visibles con `...` en medio, el resto oculto con puntos).
2. **Given** la clave se muestra enmascarada, **When** el usuario toca el botón de visibilidad (ojo), **Then** se revela la API Key completa sin truncar.
3. **Given** la clave es visible u oculta, **When** el usuario toca el botón de copiar, **Then** la API Key completa (no la versión enmascarada) se copia al portapapeles y se muestra una confirmación visual.
4. **Given** existe una API Key guardada, **When** el usuario inicia el flujo de cambio de clave, **Then** el campo de edición aparece vacío (no pre-relleno con la clave almacenada), obligando al usuario a ingresar una nueva clave.

---

### User Story 3 - Actualización de API Key (Priority: P3)

Un usuario con API Key guardada quiere cambiar a otra clave (por rotación de credenciales, cambio de proyecto PostHog o cambio de región cloud). Accede a la configuración, ingresa la nueva clave, ajusta la región si corresponde, la app la valida y reemplaza la anterior de forma segura.

**Why this priority**: Es necesario para el ciclo de vida del uso, pero no bloquea el MVP inicial.

**Independent Test**: Puede probarse teniendo una API Key guardada, ingresando una nueva clave válida y verificando que la anterior queda reemplazada.

**Acceptance Scenarios**:

1. **Given** existe una API Key guardada, **When** el usuario ingresa una nueva API Key válida, selecciona la región correcta y confirma el cambio, **Then** la nueva clave y la nueva región reemplazan a las anteriores en el almacenamiento seguro del dispositivo.
2. **Given** existe una API Key guardada, **When** el usuario ingresa una nueva API Key inválida, **Then** la app muestra un error y la clave anterior permanece sin cambios.
3. **Given** existe una API Key guardada, **When** el usuario cancela el proceso de cambio, **Then** la clave anterior permanece sin cambios.

---

### User Story 4 - Eliminación de API Key (Priority: P4)

Un usuario quiere desconectar la app de su cuenta PostHog (por ejemplo, para cambiar de cuenta o para cerrar sesión). Puede eliminar la API Key guardada, lo que lo devuelve a la pantalla de registro inicial.

**Why this priority**: Permite el control total del usuario sobre sus credenciales almacenadas localmente.

**Independent Test**: Puede probarse eliminando la API Key guardada y verificando que la app regresa a la pantalla inicial de ingreso de clave.

**Acceptance Scenarios**:

1. **Given** existe una API Key guardada, **When** el usuario elige eliminar la API Key y confirma la acción, **Then** la clave es borrada del almacenamiento seguro del dispositivo y el usuario es redirigido a la pantalla de ingreso inicial.
2. **Given** el usuario inicia el proceso de eliminar la API Key, **When** cancela la acción, **Then** la clave permanece guardada y la app no cambia de estado.

---

### Edge Cases

- ¿Qué ocurre si el dispositivo no tiene conectividad al momento de validar la API Key? La app debe mostrar un mensaje de error de red claro y no guardar la clave.
- ¿Qué ocurre si la API Key tiene el formato correcto pero los permisos insuficientes en PostHog? La app debe distinguir entre clave inválida y clave sin permisos suficientes, mostrando el mensaje apropiado.
- ¿Qué ocurre si el almacenamiento seguro del dispositivo no está disponible (dispositivo rooteado / sin protección de pantalla)? La app debe informar al usuario que no puede guardar la clave de forma segura en ese dispositivo.
- ¿Qué ocurre si la API Key tiene espacios en blanco al inicio o al final? La app debe hacer trim automático antes de validar.
- ¿Qué ocurre si se pierde la conexión a mitad de la validación? La petición debe hacer timeout con un mensaje claro al usuario.
- ¿Qué ocurre si el usuario elige US Cloud pero su clave pertenece a EU Cloud, o viceversa? La app debe fallar la validación y mostrar un error claro sin guardar ni la clave ni la región nueva.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La app DEBE presentar una pantalla dedicada para el ingreso de la API Key cuando no exista ninguna guardada en el dispositivo.
- **FR-002**: La app DEBE validar la API Key contra la API de PostHog antes de guardarla.
- **FR-003**: La app DEBE almacenar la API Key exclusivamente en el almacenamiento seguro nativo del dispositivo (nunca en almacenamiento externo, logs, ni transmitirla a servidores propios).
- **FR-004**: La app DEBE mostrar la API Key guardada de forma enmascarada por defecto (ej: `phx_AbCd...rSt`), con opción de alternar la visibilidad para revelar la clave completa.
- **FR-004a**: La app DEBE permitir copiar la API Key completa al portapapeles, independientemente de si la clave se muestra enmascarada u oculta en la UI.
- **FR-004b**: La API Key completa DEBE poder ser recuperada del almacenamiento seguro para visualización y copia, pero NUNCA debe almacenarse en texto plano en el estado de React ni exponerse en logs.
- **FR-005**: El campo de ingreso de API Key DEBE ocultar los caracteres mientras el usuario escribe (comportamiento de campo de contraseña).
- **FR-006**: La app DEBE mostrar mensajes de error diferenciados para: clave vacía, formato inválido, clave inválida en la API, y error de red.
- **FR-007**: La app DEBE permitir al usuario actualizar su API Key, validando la nueva antes de reemplazar la existente.
- **FR-008**: La app DEBE permitir al usuario eliminar la API Key guardada, previa confirmación explícita.
- **FR-009**: Al cambiar o eliminar la API Key, el campo de entrada NO debe pre-rellenarse con la clave actual.
- **FR-010**: La app DEBE eliminar automáticamente espacios en blanco al inicio y fin de la API Key antes de procesarla.
- **FR-011**: La app DEBE permitir al usuario seleccionar la región cloud de PostHog (`US Cloud` o `EU Cloud`) antes de validar la API Key por primera vez.
- **FR-012**: La app DEBE usar el endpoint privado correspondiente a la región seleccionada para validar la API Key y consultar recursos autenticados de PostHog.
- **FR-013**: La app DEBE persistir la región cloud seleccionada junto con la API Key para reutilizarla en sesiones futuras.
- **FR-014**: La app DEBE permitir al usuario cambiar la región cloud al actualizar sus credenciales desde Settings.

### Key Entities

- **API Key**: Credencial de acceso a la cuenta PostHog del usuario. Se identifica por su valor (string), fecha de almacenamiento, y estado de validación. Solo existe una por dispositivo.
- **Cloud Region**: Región cloud de PostHog asociada a la API Key del usuario. Puede ser `US Cloud` o `EU Cloud` y determina el hostname privado usado para todas las llamadas autenticadas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario nuevo puede completar el ingreso y validación de su API Key en menos de 60 segundos desde que abre la app por primera vez.
- **SC-002**: El 100% de los intentos de guardar una API Key pasan por validación contra la API antes de ser almacenados.
- **SC-003**: La API Key completa está oculta por defecto tras ser guardada, pero puede revelarse bajo acción explícita del usuario (toggle de visibilidad) y puede copiarse íntegra al portapapeles.
- **SC-004**: La API Key nunca sale del dispositivo hacia servidores distintos al hostname privado de la región seleccionada (`us.posthog.com` o `eu.posthog.com`) durante el proceso de validación y uso autenticado.
- **SC-005**: Todos los errores posibles (red, clave inválida, permisos, almacenamiento no disponible) presentan un mensaje comprensible al usuario sin exponer detalles técnicos internos.

## Assumptions

- La validación de la API Key se realiza haciendo una petición a la API de PostHog con la clave provista; una respuesta exitosa confirma que es válida.
- Para Personal API Keys, la validación se hace contra el listado autenticado de proyectos (`/api/projects/`) en el cloud seleccionado, porque ese endpoint confirma credencial, región y acceso útil para la app.
- El formato actual de una Personal API Key de PostHog comienza con `phx_`; la app también acepta `phc_` por compatibilidad con claves anteriores.
- La app soporta únicamente PostHog Cloud administrado en dos regiones: US Cloud y EU Cloud.
- Una sola API Key por dispositivo es suficiente para este MVP; multi-cuenta no está en el alcance.
- La pantalla de ingreso de API Key actúa como pantalla de onboarding/splash mientras no exista clave guardada.
