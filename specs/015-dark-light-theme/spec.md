# Feature Specification: Dark / Light / System Theme Selector

**Feature Branch**: `015-dark-light-theme`  
**Created**: 2026-03-20  
**Status**: Draft  
**Input**: User description: "Permitir al usuario seleccionar entre modo oscuro, modo claro o seguir el tema del sistema. La tarjeta actual de dark mode en settings debe convertirse en un selector de tres estados: Sistema, Claro, Oscuro. Por defecto debe usar el tema del sistema."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Seguir el tema del sistema por defecto (Priority: P1)

Como usuario, al abrir la aplicación por primera vez quiero que la apariencia (modo oscuro o claro) coincida automáticamente con la configuración de mi dispositivo, sin necesidad de ajustar nada manualmente.

**Why this priority**: Es el comportamiento predeterminado esperado por la mayoría de usuarios en aplicaciones móviles modernas. Sin esto, el resto de opciones de tema carecen de contexto.

**Independent Test**: Instalar la app en un dispositivo configurado en modo claro y verificar que la interfaz se muestra en modo claro. Repetir con modo oscuro del dispositivo y verificar que la interfaz se muestra en modo oscuro.

**Acceptance Scenarios**:

1. **Given** la app se instala por primera vez, **When** el dispositivo está en modo oscuro, **Then** la app se muestra con colores oscuros.
2. **Given** la app se instala por primera vez, **When** el dispositivo está en modo claro, **Then** la app se muestra con colores claros.
3. **Given** la preferencia de tema es "Sistema" y la app está abierta, **When** el usuario cambia el tema del dispositivo de claro a oscuro (o viceversa), **Then** la app refleja el cambio en tiempo real sin necesidad de reiniciar.

---

### User Story 2 — Selector de tres estados en Settings (Priority: P1)

Como usuario, quiero poder elegir entre "Sistema", "Claro" y "Oscuro" en la pantalla de ajustes para controlar manualmente el aspecto visual de la aplicación.

**Why this priority**: Es la funcionalidad central solicitada; reemplaza el toggle cosmético actual por un control funcional.

**Independent Test**: Abrir Settings, verificar que aparece el selector de tres opciones. Pulsar cada opción y confirmar que la interfaz cambia de tema inmediatamente.

**Acceptance Scenarios**:

1. **Given** el usuario está en la pantalla de Settings, **When** visualiza la sección de apariencia, **Then** ve tres opciones: "Sistema", "Claro" y "Oscuro" con la opción activa destacada visualmente.
2. **Given** la opción activa es "Sistema", **When** el usuario selecciona "Oscuro", **Then** toda la interfaz cambia a colores oscuros inmediatamente y la selección queda marcada.
3. **Given** la opción activa es "Oscuro", **When** el usuario selecciona "Claro", **Then** toda la interfaz cambia a colores claros inmediatamente y la selección queda marcada.
4. **Given** la opción activa es "Claro", **When** el usuario selecciona "Sistema", **Then** la interfaz adopta el tema actual del dispositivo.

---

### User Story 3 — Persistencia de la preferencia de tema (Priority: P2)

Como usuario, quiero que mi elección de tema persista entre sesiones para no tener que volver a configurarla cada vez que abro la app.

**Why this priority**: Sin persistencia la experiencia se degrada (el usuario tendría que elegir el tema en cada apertura).

**Independent Test**: Elegir "Claro", forzar el cierre de la app, volver a abrirla y verificar que el tema sigue siendo claro.

**Acceptance Scenarios**:

1. **Given** el usuario selecciona "Oscuro" y cierra la app, **When** vuelve a abrir la app, **Then** el tema aplicado es oscuro.
2. **Given** el usuario selecciona "Sistema" y cierra la app, **When** vuelve a abrir la app, **Then** el tema sigue al del dispositivo.

---

### User Story 4 — Paleta de colores claros coherente (Priority: P2)

Como usuario en modo claro, quiero que todos los textos, fondos, bordes e íconos sean legibles y estéticamente agradables, con colores adaptados al modo claro.

**Why this priority**: Sin una paleta clara definida, activar el modo claro generaría una interfaz ilegible o visualmente rota.

**Independent Test**: Recorrer todas las pantallas (dashboard, settings, chart detail, edit chart, onboarding) en modo claro y verificar que no hay texto invisible, contraste insuficiente o elementos rotos.

**Acceptance Scenarios**:

1. **Given** el tema activo es "Claro", **When** el usuario navega por el dashboard, **Then** textos, gráficos, tarjetas y bordes tienen contraste suficiente y son legibles en fondo claro.
2. **Given** el tema activo es "Claro", **When** el usuario abre la pantalla de settings, **Then** todas las secciones (API, Preferencias, Donación) se ven correctamente en modo claro.
3. **Given** el tema activo es "Claro", **When** el usuario visualiza un gráfico (línea, barra, funnel), **Then** las series, ejes, etiquetas y tooltips son legibles sobre fondo claro.
4. **Given** el tema activo es "Claro", **When** el usuario ve la tarjeta de donación "Apoyar al desarrollador", **Then** la tarjeta usa un gradiente teal claro (`#F0FDFA`→`#E0F7F3`) con borde `#99F6E4`, legible y coherente con el modo claro.

---

### Edge Cases

- ¿Qué pasa si el dispositivo no reporta un esquema de color (emuladores antiguos o dispositivos sin soporte)? → La app usa modo oscuro como fallback seguro.
- ¿Qué pasa si el usuario cambia el tema del sistema mientras la app está en segundo plano? → Al volver al primer plano, la app refleja el nuevo tema del dispositivo (solo si la preferencia guardada es "Sistema").
- ¿Qué pasa si la preferencia almacenada es un valor corrupto o desconocido? → La app ignora el valor corrupto y usa "Sistema" como fallback.
- ¿Existe un flash de tema incorrecto al abrir la app? → La preferencia debe cargarse antes de renderizar la primera pantalla, evitando parpadeos de cambio de tema.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La app DEBE ofrecer tres opciones de apariencia: **Sistema**, **Claro** y **Oscuro**.
- **FR-002**: La opción predeterminada DEBE ser "Sistema", lo que significa que la app sigue el esquema de color configurado en el dispositivo.
- **FR-003**: El cambio de tema DEBE aplicarse inmediatamente a toda la interfaz al seleccionar una opción, sin necesidad de reiniciar la app.
- **FR-004**: La tarjeta cosmética actual de "Dark Mode" (toggle siempre activado) en Settings DEBE ser reemplazada por un selector de tres estados (Sistema / Claro / Oscuro) con indicador visual del estado activo.
- **FR-005**: La preferencia de tema seleccionada DEBE persistir en almacenamiento local del dispositivo y cargarse al iniciar la app.
- **FR-006**: Cuando la preferencia es "Sistema", la app DEBE reaccionar en tiempo real a cambios del tema del dispositivo (sin reiniciar la app).
- **FR-007**: La app DEBE definir una paleta de colores para modo claro que cubra fondos, textos, bordes, íconos y elementos de acento, manteniendo legibilidad y coherencia visual.
- **FR-008**: Si la preferencia almacenada es inválida o no existe, la app DEBE usar "Sistema" como fallback.
- **FR-009**: La preferencia DEBE cargarse antes del primer render para evitar parpadeos de cambio de tema.
- **FR-010**: Cada opción del selector DEBE proporcionar retroalimentación háptica al ser pulsada, siguiendo el patrón existente en el selector de idioma.
- **FR-011**: Las traducciones de los textos del selector ("Sistema", "Claro", "Oscuro") DEBEN estar disponibles en todos los idiomas soportados (español e inglés).

### Key Entities

- **Theme Preference**: Preferencia de apariencia del usuario. Valores posibles: "system", "light", "dark". Se almacena localmente y se carga al inicio.
- **Resolved Theme**: Tema efectivo que la app aplica en un momento dado. Si la preferencia es "system", se resuelve según el esquema del dispositivo; de lo contrario, es el valor literal de la preferencia.

## Assumptions

- La paleta de colores del modo oscuro existente no cambia; solo se agrega la paleta de modo claro.
- El selector de tres estados sigue el mismo patrón visual que el selector de idioma existente (fila por opción con indicador de selección tipo radio con gradiente).
- La retroalimentación háptica usa el mismo estilo (`ImpactFeedbackStyle.Light`) que el selector de idioma existente.
- El almacenamiento de la preferencia sigue el mismo patrón que la preferencia de idioma (almacenamiento asíncrono local).
- La barra de estado del sistema (status bar) se adapta al tema activo (texto claro sobre fondo oscuro, texto oscuro sobre fondo claro).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El usuario puede cambiar entre los tres modos de tema en menos de 2 toques desde la pantalla de Settings.
- **SC-002**: El cambio de tema se refleja visualmente en menos de 300 ms tras la selección.
- **SC-003**: La preferencia de tema persiste correctamente en el 100% de los cierres y reaperturas de la app.
- **SC-004**: En modo "Sistema", los cambios del tema del dispositivo se reflejan en la app sin reinicio.
- **SC-005**: Todas las pantallas de la app (onboarding, dashboard, settings, chart detail, edit chart) son legibles y visualmente coherentes tanto en modo claro como en modo oscuro.
- **SC-006**: No se produce ningún parpadeo visible de tema incorrecto al abrir la app.
