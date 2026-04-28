# Feature Specification: Soporte Self-Hosted

**Feature Branch**: `017-self-hosted-support`  
**Created**: 2026-03-20  
**Status**: Draft  
**Input**: User description: "Agregar soporte para instancias PostHog self-hosted, donde el usuario ingresa su propia URL/dominio. La API de PostHog es la misma tanto para cloud como para self-hosted, solo cambia la URL base."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conexión a instancia self-hosted (Priority: P1)

Un usuario que tiene PostHog auto-alojado en su propia infraestructura abre la app por primera vez. En el selector de región ve tres opciones: "US Cloud", "EU Cloud" y "Self-Hosted". Selecciona "Self-Hosted" y aparece un campo de texto donde ingresa la URL de su instancia (ej: `https://posthog.miempresa.com`). Luego ingresa su API Key, toca "Guardar", la app valida tanto la URL como la clave contra la instancia self-hosted, y al ser válida, almacena la configuración de forma segura y accede a la app.

**Why this priority**: Es la funcionalidad central de esta feature. Sin esto, los usuarios con instancias self-hosted no pueden usar la app en absoluto.

**Independent Test**: Puede probarse teniendo una instancia PostHog self-hosted accesible por HTTPS, seleccionando "Self-Hosted", ingresando la URL y una API Key válida, y verificando que la app navega correctamente al dashboard.

**Acceptance Scenarios**:

1. **Given** la app no tiene credenciales guardadas, **When** el usuario selecciona "Self-Hosted", ingresa una URL HTTPS válida y accesible, ingresa una API Key válida y toca "Guardar", **Then** la URL y la clave se validan contra la instancia, se almacenan de forma segura y el usuario accede a la pantalla principal.
2. **Given** la app no tiene credenciales guardadas, **When** el usuario selecciona "Self-Hosted" e ingresa una URL que no usa HTTPS (ej: `http://posthog.miempresa.com`), **Then** la app muestra un mensaje de error indicando que se requiere HTTPS antes de intentar cualquier validación.
3. **Given** la app no tiene credenciales guardadas, **When** el usuario selecciona "Self-Hosted" e ingresa una URL HTTPS con formato inválido (ej: `not-a-url`, `https://`), **Then** la app muestra un mensaje de error de formato de URL sin realizar ninguna petición de red.
4. **Given** la app no tiene credenciales guardadas, **When** el usuario selecciona "Self-Hosted" e ingresa una URL HTTPS válida que no responde o no es una instancia PostHog, **Then** la app muestra un mensaje de error claro indicando que no se pudo conectar a la instancia.

---

### User Story 2 - Experiencia cloud sin cambios (Priority: P2)

Un usuario existente que usa US Cloud o EU Cloud abre la app después de la actualización. Su experiencia no cambia: sigue viendo las opciones de cloud, su configuración guardada sigue funcionando y todas las llamadas API siguen operando normalmente.

**Why this priority**: La retrocompatibilidad es crítica. No podemos romper la experiencia de los usuarios existentes al agregar una nueva opción.

**Independent Test**: Puede probarse teniendo una configuración existente con US Cloud o EU Cloud guardada, actualizando la app y verificando que el usuario accede directamente al dashboard sin necesidad de reconfigurar.

**Acceptance Scenarios**:

1. **Given** un usuario tiene credenciales guardadas para US Cloud, **When** abre la app después de la actualización, **Then** la app funciona exactamente como antes, usando `us.posthog.com` para todas las llamadas.
2. **Given** un usuario tiene credenciales guardadas para EU Cloud, **When** abre la app después de la actualización, **Then** la app funciona exactamente como antes, usando `eu.posthog.com` para todas las llamadas.
3. **Given** un usuario nuevo abre la app, **When** ve el selector de región, **Then** las opciones "US Cloud" y "EU Cloud" siguen visibles y funcionando como antes, con la nueva opción "Self-Hosted" como tercera alternativa.

---

### User Story 3 - Cambio de cloud a self-hosted (Priority: P3)

Un usuario que actualmente usa US Cloud o EU Cloud quiere cambiar a una instancia self-hosted. Accede a la configuración, selecciona "Self-Hosted", ingresa la URL de su instancia y una nueva API Key, valida y la app reemplaza la configuración anterior.

**Why this priority**: Permite la migración entre modalidades, necesario para el ciclo de vida completo pero no bloquea el uso inicial.

**Independent Test**: Puede probarse teniendo una configuración de US Cloud guardada, cambiando a "Self-Hosted" desde Settings, ingresando URL y API Key válidas, y verificando que todas las llamadas ahora usan la URL custom.

**Acceptance Scenarios**:

1. **Given** un usuario tiene credenciales de US Cloud guardadas, **When** cambia a "Self-Hosted" desde configuración, ingresa una URL y API Key válidas y confirma, **Then** la nueva configuración reemplaza la anterior y todas las llamadas usan la URL self-hosted.
2. **Given** un usuario tiene credenciales self-hosted guardadas, **When** cambia a "EU Cloud" desde configuración e ingresa una API Key válida, **Then** la URL custom se descarta y todas las llamadas usan `eu.posthog.com`.

---

### User Story 4 - Actualización de URL self-hosted (Priority: P4)

Un usuario con instancia self-hosted configurada necesita cambiar la URL (por migración de dominio, cambio de infraestructura). Accede a configuración, modifica la URL y opcionalmente la API Key, valida y la app actualiza la configuración.

**Why this priority**: Escenario menos frecuente pero necesario para el mantenimiento a largo plazo.

**Independent Test**: Puede probarse cambiando la URL de la instancia en configuración y verificando que las llamadas API usan la nueva URL.

**Acceptance Scenarios**:

1. **Given** un usuario tiene una URL self-hosted guardada, **When** cambia la URL a otra válida y confirma, **Then** la nueva URL reemplaza la anterior y las llamadas API la usan inmediatamente.
2. **Given** un usuario tiene una URL self-hosted guardada, **When** cambia la URL a una inválida, **Then** la app muestra error y la URL anterior permanece sin cambios.

---

### Edge Cases

- ¿Qué ocurre si la URL self-hosted termina en `/` (ej: `https://posthog.miempresa.com/`)? La app debe eliminar la barra final automáticamente antes de guardar.
- ¿Qué ocurre si el usuario ingresa una URL con espacios en blanco al inicio o final? La app debe hacer trim automático.
- ¿Qué ocurre si la URL contiene un path (ej: `https://miempresa.com/posthog`)? La app debe aceptarla como válida ya que algunas instancias usan sub-paths.
- ¿Qué ocurre si la URL incluye un puerto custom (ej: `https://posthog.miempresa.com:8443`)? La app debe aceptarla como válida.
- ¿Qué ocurre si la instancia self-hosted usa un certificado auto-firmado? La app no lo soportará y mostrará un error de conexión.
- ¿Qué ocurre si la instancia self-hosted está caída al momento de validar? La app debe mostrar un error de conexión diferenciado del error de URL inválida.
- ¿Qué ocurre si la instancia responde pero no es PostHog (ej: otro servicio en esa URL)? La validación contra `/api/projects/` fallará y mostrará un error indicando que no se detectó una instancia PostHog válida.
- ¿Qué ocurre si la URL contiene credenciales embebidas (ej: `https://user:pass@host.com`)? La app debe rechazarla por seguridad.
- ¿Qué ocurre si no hay conectividad de red al intentar validar la URL? La app debe mostrar un mensaje de error de red claro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El selector de región DEBE mostrar tres opciones: "US Cloud", "EU Cloud" y "Self-Hosted".
- **FR-002**: Cuando el usuario selecciona "Self-Hosted", la app DEBE mostrar un campo de texto para ingresar la URL de la instancia.
- **FR-003**: La URL self-hosted DEBE usar el protocolo HTTPS. URLs con HTTP u otros protocolos DEBEN ser rechazadas con un mensaje de error claro.
- **FR-004**: La app DEBE validar el formato de la URL antes de intentar cualquier petición de red (protocolo HTTPS, formato URL válido, sin credenciales embebidas).
- **FR-005**: La app DEBE eliminar automáticamente barras finales (`/`) y espacios en blanco al inicio y final de la URL ingresada.
- **FR-006**: La app DEBE validar la combinación URL + API Key contra la instancia self-hosted (usando el mismo endpoint de validación que para cloud: `/api/projects/`) antes de guardar.
- **FR-007**: La app DEBE almacenar la URL self-hosted de forma segura en el dispositivo junto con la API Key y el tipo de conexión.
- **FR-008**: Todas las llamadas API DEBEN usar la URL self-hosted almacenada cuando el usuario tiene configurada una instancia self-hosted.
- **FR-009**: La app DEBE mantener retrocompatibilidad total con configuraciones existentes de US Cloud y EU Cloud. Usuarios existentes NO deben verse afectados.
- **FR-010**: La app DEBE permitir cambiar entre modalidades (cloud ↔ self-hosted) desde la pantalla de configuración, validando la nueva configuración antes de reemplazar la anterior.
- **FR-011**: La app DEBE mostrar mensajes de error diferenciados para: URL sin HTTPS, formato de URL inválido, instancia no accesible, instancia que no es PostHog, API Key inválida, y error de red.
- **FR-012**: Las URLs con credenciales embebidas (esquema `user:password@host`) DEBEN ser rechazadas por seguridad.
- **FR-013**: La app DEBE aceptar URLs con puertos custom (ej: `:8443`) y sub-paths (ej: `/posthog`).
- **FR-014**: Todos los textos de la UI relacionados con self-hosted DEBEN estar disponibles en español e inglés (internacionalización).
- **FR-015**: La interfaz del selector de región y el campo de URL DEBEN soportar tema claro y oscuro.

### Key Entities

- **Tipo de Conexión**: Identifica la modalidad de conexión del usuario. Puede ser "US Cloud", "EU Cloud" o "Self-Hosted". Determina cómo se resuelve la URL base para todas las llamadas API.
- **URL Self-Hosted**: Dirección de la instancia PostHog auto-alojada del usuario. Solo aplica cuando el tipo de conexión es "Self-Hosted". Debe cumplir HTTPS, formato URL válido y responder como instancia PostHog.
- **Configuración de Conexión**: Conjunto de datos que define cómo la app se conecta a PostHog. Incluye el tipo de conexión, la URL base resultante (fija para cloud, custom para self-hosted) y la API Key asociada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario con instancia self-hosted puede completar la configuración (seleccionar Self-Hosted, ingresar URL, ingresar API Key, validar y guardar) en menos de 90 segundos.
- **SC-002**: El 100% de las URLs guardadas como self-hosted pasan validación de formato HTTPS y accesibilidad de la instancia antes de ser almacenadas.
- **SC-003**: Los usuarios existentes de US Cloud y EU Cloud no experimentan ningún cambio en su flujo ni necesitan reconfigurar después de la actualización.
- **SC-004**: Todas las llamadas API para usuarios self-hosted usan exclusivamente la URL custom almacenada, sin enviar tráfico a los servidores cloud de PostHog.
- **SC-005**: El 100% de los errores posibles (formato URL, HTTPS requerido, instancia no accesible, no es PostHog, API Key inválida, error de red) presentan un mensaje comprensible y diferenciado al usuario.
- **SC-006**: La interfaz de selección de región y el campo de URL se muestran correctamente en ambos temas (claro y oscuro) y en ambos idiomas (español e inglés).

## Assumptions

- La API de PostHog es idéntica entre instancias cloud y self-hosted; solo cambia la URL base. No se requieren adaptaciones específicas por tipo de instancia.
- La validación de conexión a una instancia self-hosted se realiza con el mismo endpoint usado para cloud: `GET /api/projects/` con la API Key como autenticación.
- Las instancias self-hosted de PostHog usan certificados SSL válidos emitidos por autoridades certificadoras reconocidas. Certificados auto-firmados no están soportados.
- La URL self-hosted proporcionada por el usuario apunta directamente a la raíz de la instancia PostHog (o a un sub-path si está configurado así), sin necesidad de descubrimiento automático.
- Una sola configuración (cloud o self-hosted) es suficiente por dispositivo; multi-cuenta o multi-instancia no está en alcance.
- El sistema de temas (feature 015) y de internacionalización (feature 012) ya están implementados y disponibles para usar.
