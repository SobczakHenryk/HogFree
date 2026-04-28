# Feature Specification: Donation Button in Settings

**Feature Branch**: `013-donation-button`  
**Created**: 2026-03-20  
**Status**: Draft  
**Input**: User description: "Quiero agregar una imagen que sea botón en la página de settings para que los usuarios puedan realizar donaciones, ya que la aplicación quiero que sea totalmente gratis pero si alguien me quiere ayudar que pueda realizar la donación."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver y usar el botón de donación (Priority: P1)

Un usuario abre la pantalla de Settings y ve, debajo de las secciones existentes (API Key e Idioma), una nueva sección de "Apoyar la app" con una imagen/banner atractivo que invita a realizar una donación voluntaria. Al presionar la imagen, el sistema abre el navegador externo del dispositivo con la página de donaciones del desarrollador.

**Why this priority**: Es la funcionalidad central de esta feature — sin el botón visible y funcional no hay forma de recibir donaciones. Entrega valor inmediato al desarrollador y a los usuarios generosos.

**Independent Test**: Se puede verificar completamente abriendo Settings, scrolleando hasta la sección de donaciones, presionando la imagen y confirmando que el navegador externo se abre con la URL de donaciones correcta.

**Acceptance Scenarios**:

1. **Given** el usuario está en la pantalla de Settings, **When** hace scroll hacia abajo, **Then** ve una sección "Apoyar la app" con una imagen/banner de donación debajo de la sección de idioma.
2. **Given** el usuario ve la imagen de donación, **When** la presiona, **Then** el navegador externo del dispositivo se abre con la URL de la plataforma de donaciones.
3. **Given** el usuario presiona el botón de donación, **When** el navegador se abre, **Then** el usuario puede completar la donación en la plataforma externa sin interrupciones.
4. **Given** el usuario no tiene conexión a internet, **When** presiona la imagen de donación, **Then** el sistema intenta abrir la URL y el navegador muestra su propio mensaje de sin conexión (comportamiento nativo del OS).

---

### User Story 2 - Feedback visual al interactuar (Priority: P2)

Cuando el usuario presiona la imagen de donación, recibe retroalimentación visual (la imagen se oscurece/reduce opacidad brevemente) y háptica para confirmar que la interacción fue reconocida, manteniendo consistencia con el resto de la app.

**Why this priority**: Mejora la experiencia del usuario y mantiene la coherencia de diseño de la app, pero la funcionalidad de donación ya existe sin esto.

**Independent Test**: Presionar la imagen y verificar que hay feedback visual (cambio de opacidad) y retroalimentación háptica al toque.

**Acceptance Scenarios**:

1. **Given** el usuario ve la imagen de donación, **When** la mantiene presionada, **Then** la imagen muestra un efecto visual de presionado (reducción de opacidad).
2. **Given** el usuario presiona la imagen de donación, **When** se registra el toque, **Then** se dispara una vibración háptica ligera.

---

### User Story 3 - Soporte multiidioma (Priority: P3)

Los textos asociados a la sección de donación (título de la sección, texto de apoyo) se muestran en el idioma seleccionado por el usuario (español o inglés), manteniendo consistencia con el sistema i18n existente.

**Why this priority**: La app ya soporta español e inglés. Mantener consistencia es importante pero no bloquea la funcionalidad.

**Independent Test**: Cambiar el idioma en Settings y verificar que los textos de la sección de donación se actualizan correctamente.

**Acceptance Scenarios**:

1. **Given** el idioma está configurado en español, **When** el usuario ve la sección de donación, **Then** el título y texto se muestran en español.
2. **Given** el idioma está configurado en inglés, **When** el usuario ve la sección de donación, **Then** el título y texto se muestran en inglés.

---

### Edge Cases

- ¿Qué pasa si la imagen de donación no se puede cargar? → Se muestra un botón de texto alternativo ("Apoyar con una donación") para que la funcionalidad no se pierda.
- ¿Qué pasa si el dispositivo no puede abrir URLs externas? → El sistema degrada silenciosamente; no se muestra error ya que es una funcionalidad opcional.
- ¿Qué pasa si el usuario presiona el botón múltiples veces rápidamente? → Solo se abre una instancia del navegador (la primera), las pulsaciones adicionales se ignoran hasta que la acción se completa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla de Settings DEBE mostrar una nueva sección "Apoyar la app" debajo de la sección de idioma.
- **FR-002**: La sección DEBE contener una imagen/banner visual que funcione como botón presionable.
- **FR-003**: Al presionar la imagen, el sistema DEBE abrir la URL de donaciones en el navegador externo del dispositivo.
- **FR-004**: La imagen DEBE tener un efecto visual de feedback al ser presionada (reducción de opacidad).
- **FR-005**: Al presionar la imagen, el sistema DEBE proporcionar retroalimentación háptica ligera, consistente con el patrón usado en el resto de la app.
- **FR-006**: Todos los textos de la sección (título, descripción) DEBEN estar internacionalizados en español e inglés.
- **FR-007**: La sección de donación DEBE seguir el mismo estilo visual (colores, bordes, tipografía) que las otras secciones de Settings.
- **FR-008**: Si la imagen no puede cargarse, DEBE mostrarse un botón de texto como fallback.
- **FR-009**: El sistema DEBE usar **Ko-fi** como plataforma de donaciones. Ko-fi cobra 0% de comisión de plataforma (solo comisión estándar de PayPal/Stripe ~2.9%), soporta donaciones únicas y tiene interfaz limpia orientada a creadores. La URL de donación apuntará a la página Ko-fi del desarrollador: `https://ko-fi.com/ingsobczak`.

### Key Entities

- **Donation Link**: URL externa hacia la página Ko-fi del desarrollador (`https://ko-fi.com/ingsobczak`). Es un valor estático configurado en la app. Atributos: URL, nombre de la plataforma (Ko-fi).
- **Donation Banner**: Imagen visual que actúa como botón. Atributos: imagen (asset local o remota), texto alternativo, estado de carga.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los usuarios pueden ver la sección de donación al hacer scroll en Settings sin necesidad de instrucciones adicionales.
- **SC-002**: Al presionar el botón, el navegador externo se abre en menos de 2 segundos.
- **SC-003**: La sección de donación se renderiza correctamente en ambos idiomas (español e inglés).
- **SC-004**: El botón de donación funciona en iOS y Android sin diferencias de comportamiento.
- **SC-005**: En caso de fallo de carga de imagen, el fallback de texto se muestra y sigue siendo funcional.

## Assumptions

- La donación se procesa completamente fuera de la app, en la plataforma externa. La app no maneja pagos internamente.
- No se requiere tracking de donaciones dentro de la app (no se guarda historial ni estado de donación).
- La imagen del banner será un asset local incluido en el bundle de la app (no se descarga remotamente) para garantizar disponibilidad offline.
- Las políticas de App Store y Play Store permiten links externos a plataformas de donación para apps gratuitas sin ánimo de lucro.
- No se implementan In-App Purchases — la donación es una redirección externa voluntaria.
