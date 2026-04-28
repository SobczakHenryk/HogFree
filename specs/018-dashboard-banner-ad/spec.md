# Feature Specification: Banner Publicitario en Dashboard

**Feature Branch**: `018-dashboard-banner-ad`  
**Created**: 2026-04-27  
**Status**: Draft  
**Input**: User description: "En la pantalla de dashboard quisiera colocar una publicidad similar a la de la imagen. Banner fijo en la parte inferior de la pantalla que muestra anuncios externos (estilo AdMob o similar), con posibilidad de cierre o interacción."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver y interactuar con el banner publicitario (Priority: P1)

Un usuario gratuito abre la pantalla de dashboard y ve, fijo en la parte inferior de la pantalla, un banner publicitario que muestra contenido de terceros (aplicaciones, servicios, etc.). El banner no interfiere con el scroll ni con el contenido principal del dashboard. Al presionar el banner, se abre el destino del anuncio (tienda de apps o página web del anunciante) sin cerrar la app.

**Why this priority**: Es la funcionalidad central de la feature — sin el banner visible y funcional no hay monetización. Entrega valor inmediato al desarrollador a través de ingresos publicitarios y representa la mínima expresión viable del requerimiento.

**Independent Test**: Abrir el dashboard como usuario gratuito, verificar que el banner aparece fijo en la parte inferior con contenido real del anuncio, y al presionarlo confirmar que se abre correctamente el destino externo.

**Acceptance Scenarios**:

1. **Given** el usuario gratuito está en la pantalla de dashboard, **When** el dashboard termina de cargar, **Then** se muestra un banner publicitario fijo en la parte inferior de la pantalla.
2. **Given** el banner publicitario está visible, **When** el usuario hace scroll hacia arriba o hacia abajo en el dashboard, **Then** el banner permanece fijo en su posición inferior y no se desplaza con el contenido.
3. **Given** el banner publicitario está visible con un anuncio cargado, **When** el usuario presiona el banner, **Then** el sistema abre la información del anuncio (tienda de apps o página web del anunciante) sin cerrar la app.
4. **Given** el banner está en proceso de carga, **When** el contenido publicitario todavía no está disponible, **Then** se muestra un placeholder visual del mismo tamaño hasta que el contenido esté listo.

---

### User Story 2 - Usuarios con donación no ven publicidad (Priority: P2)

Un usuario que ha realizado una donación (usuario premium) abre el dashboard y no ve el banner publicitario. El espacio que ocuparía el banner no se reserva, permitiendo que el contenido del dashboard use toda la pantalla disponible.

**Why this priority**: Recompensar a los usuarios que apoyan la app eliminando los anuncios es un incentivo directo para donar y mejora sustancialmente la experiencia de usuarios premium, creando diferenciación de valor entre usuarios gratuitos y premium.

**Independent Test**: Con el estado de donación activo, abrir el dashboard y confirmar que no existe ningún banner ni espacio reservado en la parte inferior; el contenido llega hasta el safe area inferior.

**Acceptance Scenarios**:

1. **Given** el usuario ha realizado una donación (estado premium activo), **When** abre la pantalla de dashboard, **Then** no se muestra ningún banner publicitario ni espacio reservado para él en la parte inferior.
2. **Given** el usuario es premium, **When** navega por cualquier pantalla de la app, **Then** ninguna pantalla muestra banners publicitarios.
3. **Given** un usuario gratuito realiza una donación (pasa a premium), **When** regresa a la pantalla de dashboard, **Then** el banner desaparece sin necesidad de reiniciar la app.

---

### User Story 3 - Solicitud de consentimiento publicitario (Priority: P3)

En el primer inicio de la app (o tras reinstalación), el sistema muestra al usuario una solicitud de consentimiento para mostrar anuncios, cumpliendo con los requisitos legales de privacidad aplicables. El usuario puede aceptar anuncios personalizados, anuncios no personalizados, o rechazar. La decisión se persiste y no se vuelve a solicitar en sesiones posteriores.

**Why this priority**: Es un requisito legal en múltiples jurisdicciones y condición obligatoria para poder distribuir la app con publicidad en las tiendas de aplicaciones. Sin consentimiento válido no se pueden mostrar anuncios personalizados legalmente.

**Independent Test**: En un dispositivo con configuración regional europea, abrir la app por primera vez y verificar que el diálogo de consentimiento aparece antes del primer banner. Cerrar y reabrir la app para confirmar que el diálogo no se muestra de nuevo.

**Acceptance Scenarios**:

1. **Given** el usuario abre la app por primera vez y el estado de consentimiento es "pendiente", **When** el dashboard intenta cargar el primer banner, **Then** el sistema muestra un diálogo de solicitud de consentimiento publicitario antes de inicializar cualquier anuncio.
2. **Given** el usuario acepta los anuncios personalizados en el diálogo, **When** el banner se carga, **Then** se muestran anuncios relevantes al perfil del usuario y la decisión queda registrada.
3. **Given** el usuario rechaza los anuncios personalizados en el diálogo, **When** el banner se carga, **Then** se muestran únicamente anuncios genéricos no personalizados y la decisión queda registrada.
4. **Given** el usuario ya otorgó o rechazó el consentimiento en una sesión anterior, **When** abre la app de nuevo, **Then** el diálogo de consentimiento NO se vuelve a mostrar.

---

### Edge Cases

- ¿Qué pasa si no hay conexión a internet cuando el dashboard carga? → El banner no se muestra y su espacio en el layout desaparece para evitar un área vacía.
- ¿Qué pasa si la red publicitaria no tiene anuncios disponibles para el usuario? → El banner no se muestra y el espacio desaparece (mismo comportamiento que sin conexión).
- ¿Qué pasa si el usuario rota el dispositivo mientras el banner está visible? → El banner se adapta al nuevo ancho de pantalla manteniendo su posición fija en la parte inferior.
- ¿Qué pasa si el dispositivo tiene barra de gestos (home indicator en iPhone X en adelante)? → El banner se posiciona correctamente por encima de la barra de gestos respetando el safe area inferior.
- ¿Qué pasa si el usuario tiene habilitado "Limitar rastreo de anuncios" en su dispositivo? → El sistema respeta la configuración del dispositivo y muestra anuncios no personalizados automáticamente, sin mostrar el diálogo de consentimiento.
- ¿Qué pasa si el usuario pasa de gratuito a premium mientras el dashboard está abierto? → El banner desaparece de forma inmediata sin necesidad de recargar la pantalla.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla de dashboard DEBE mostrar un banner publicitario fijo en la parte inferior de la pantalla para usuarios gratuitos cuando haya anuncios disponibles y conexión a internet.
- **FR-002**: El banner DEBE mantenerse fijo en su posición cuando el usuario hace scroll en el dashboard; no debe desplazarse con el contenido.
- **FR-003**: El banner DEBE respetar el safe area del dispositivo, posicionándose por encima de la barra de gestos o de navegación del sistema operativo.
- **FR-004**: Al presionar el banner, el sistema DEBE abrir el destino del anuncio en el navegador externo o en la tienda de aplicaciones correspondiente, sin cerrar ni interrumpir la sesión activa de la app.
- **FR-005**: El banner DEBE mostrar un placeholder visual del mismo tamaño mientras se carga el contenido publicitario, evitando cambios bruscos de layout.
- **FR-006**: Cuando no hay anuncios disponibles o no hay conexión, el banner NO DEBE mostrar un espacio vacío — el espacio debe liberarse y el contenido del dashboard debe ocupar el área completa.
- **FR-007**: Los usuarios que han realizado una donación (estado premium) NO DEBEN ver el banner publicitario en ninguna pantalla de la app.
- **FR-008**: Cuando un usuario premium regresa al estado gratuito (si aplica) o cuando un usuario gratuito pasa a premium, el banner DEBE aparecer o desaparecer en tiempo real sin requerir reinicio de la app.
- **FR-009**: El sistema DEBE solicitar consentimiento del usuario para mostrar anuncios antes de cargar el primer banner; el diálogo solo se muestra una vez por instalación.
- **FR-010**: La decisión de consentimiento (aceptar/rechazar) DEBE persistirse localmente en el dispositivo y respetarse en todas las sesiones posteriores.
- **FR-011**: El banner DEBE adaptarse correctamente a las orientaciones vertical y horizontal del dispositivo sin romper el layout del dashboard.
- **FR-012**: Los anuncios mostrados DEBEN cumplir con las políticas de contenido de las tiendas de aplicaciones (sin contenido adulto, violento, engañoso o fraudulento).
- **FR-013**: Si el dispositivo tiene activado el modo de restricción de rastreo a nivel de sistema, el sistema DEBE respetar esa configuración y mostrar anuncios no personalizados automáticamente.

### Key Entities

- **Banner Publicitario**: Elemento visual de tamaño estándar fijo en la parte inferior del dashboard que muestra contenido de un anunciante externo. Atributos: estado (pendiente de carga / visible / oculto / sin anuncios disponibles), tipo de contenido (personalizado / no personalizado), URL de destino.
- **Estado de Consentimiento Publicitario**: Registro persistente de la decisión del usuario sobre publicidad personalizada. Atributos: decisión (pendiente / aceptado / rechazado), fecha de registro.
- **Estado Premium del Usuario**: Indicador de si el usuario ha realizado una donación que le da acceso sin publicidad. Atributos: activo / inactivo. Relacionado con la entidad de donación de la spec `013-donation-button`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El banner publicitario se carga y muestra contenido real en menos de 3 segundos desde que el dashboard está visible para el usuario.
- **SC-002**: Cuando no hay anuncios disponibles, el banner no aparece y el layout del dashboard no muestra ningún espacio vacío en la parte inferior.
- **SC-003**: El 100% de los dispositivos iOS respetan el safe area inferior y el banner nunca queda oculto por la barra de inicio ni por la barra de gestos.
- **SC-004**: El 100% de los usuarios con estado premium nunca ven publicidad en ninguna pantalla de la app.
- **SC-005**: El diálogo de consentimiento se muestra exactamente una vez por instalación; en sesiones posteriores no vuelve a aparecer.
- **SC-006**: Al presionar el banner, el destino del anuncio se abre en el navegador o tienda en menos de 2 segundos.
- **SC-007**: La incorporación del banner no incrementa el tiempo de carga inicial del dashboard en más de un 10% con respecto al baseline sin publicidad.
- **SC-008**: El banner se adapta correctamente al cambio de orientación del dispositivo sin producir saltos de layout perceptibles.

## Assumptions

- La app continuará siendo gratuita para todos los usuarios; la publicidad es el mecanismo de monetización complementario a las donaciones voluntarias.
- El estado premium derivado de donaciones (spec `013-donation-button`) ya existe o se implementará en paralelo; esta spec asume que es posible consultar ese estado.
- Se utilizará una red publicitaria de terceros compatible con Expo/React Native para servir los anuncios; la elección específica de la red se determinará en la fase de planificación.
- Los banners son del tipo estándar (tamaño pequeño, ancho completo) similar al mostrado en la imagen de referencia; no se incluyen intersticiales, anuncios de video ni formatos nativos en esta iteración.
- La gestión del consentimiento cumplirá con GDPR (usuarios europeos) y con el framework ATT de Apple (iOS 14+).
- Los ingresos publicitarios son enviados directamente al desarrollador por la red publicitaria; la app no requiere lógica de facturación ni de reportes internos.
- No se requiere mostrar el banner en pantallas distintas al dashboard en esta primera iteración (solo la pantalla principal de métricas).

## TDD — Test-Driven Development

### Proceso TDD para esta Feature

Esta feature DEBE desarrollarse siguiendo el ciclo **Red → Green → Refactor** para cada componente antes de integrarlo en la pantalla de dashboard.

### Casos de Prueba por Componente

#### TC-US1-01: Banner visible para usuario gratuito con anuncios disponibles
- **Given** el estado del usuario es "gratuito" y la red publicitaria tiene anuncios disponibles
- **When** se renderiza el componente Dashboard
- **Then** el componente banner publicitario está presente en el árbol de componentes y es visible

#### TC-US1-02: Banner fijo durante el scroll
- **Given** el dashboard tiene contenido scrolleable y el banner está visible
- **When** el usuario hace scroll hasta el final del contenido
- **Then** el banner permanece en la posición inferior fija y no se desplaza con el contenido

#### TC-US1-03: Presionar el banner abre destino externo
- **Given** el banner está visible y el anuncio tiene una URL de destino válida
- **When** el usuario presiona el banner
- **Then** se invoca el manejador de apertura de URL externa con la URL del anuncio como argumento

#### TC-US1-04: Placeholder visible durante la carga
- **Given** el banner está en estado "cargando" (el contenido aún no está disponible)
- **When** se renderiza el componente banner
- **Then** se muestra un placeholder del tamaño estándar (no un espacio vacío ni el contenido del anuncio)

#### TC-US1-05: Banner oculto cuando no hay anuncios disponibles
- **Given** la red publicitaria reporta que no hay anuncios disponibles
- **When** se renderiza el Dashboard
- **Then** el banner no está en el árbol de componentes y no existe ningún contenedor reservado en la parte inferior

#### TC-US2-01: Sin banner para usuario premium
- **Given** el estado del usuario es "premium" (donación activa)
- **When** se renderiza el componente Dashboard
- **Then** el componente banner publicitario NO está presente en el árbol de componentes

#### TC-US2-02: Sin espacio reservado para usuario premium
- **Given** el estado del usuario es "premium"
- **When** se renderiza el Dashboard
- **Then** no existe ningún contenedor con la altura del banner en la parte inferior del layout

#### TC-US2-03: Banner desaparece al pasar a premium en tiempo real
- **Given** el dashboard está abierto con el banner visible (usuario gratuito)
- **When** el estado del usuario cambia a "premium" en tiempo real
- **Then** el banner desaparece sin necesidad de recargar la pantalla

#### TC-US3-01: Diálogo de consentimiento en primer uso
- **Given** el estado de consentimiento es "pendiente" (primer uso de la app)
- **When** el dashboard intenta inicializar la red publicitaria
- **Then** se muestra el diálogo de consentimiento antes de cargar cualquier anuncio

#### TC-US3-02: Consentimiento previo no vuelve a solicitarse
- **Given** el estado de consentimiento es "aceptado" o "rechazado" (decisión previa registrada)
- **When** el dashboard carga en una sesión posterior
- **Then** el diálogo de consentimiento NO se muestra

#### TC-US3-03: Sin anuncios cuando no hay conexión a internet
- **Given** el dispositivo no tiene conexión a internet
- **When** el dashboard intenta cargar el banner
- **Then** el banner no se muestra y no se reserva espacio en el layout
