# Feature Specification: i18n — Soporte Multilenguaje (Español / Inglés)

**Feature Branch**: `012-i18n-language-support`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "Quiero que la aplicación tenga soporte para español e inglés, por lo cual debemos agregar i18n en la aplicación y en la sección de settings debe tener un selector del idioma de manera que el usuario pueda seleccionar entre español o inglés."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Cambiar el idioma de la app a inglés (Priority: P1)

Como usuario de habla inglesa, quiero poder cambiar el idioma de la aplicación a inglés desde la pantalla de Settings para que todos los textos, títulos, botones, mensajes de error y placeholders se muestren en mi idioma.

**Why this priority**: Es la funcionalidad central de la feature. Sin un selector de idioma funcional que persista y aplique traducciones, no existe i18n.

**Independent Test**: Abrir Settings, seleccionar "English", verificar que todos los textos visibles en Dashboard, Settings, Onboarding, Chart Detail, Edit Chart y los componentes compartidos se muestran en inglés.

**Acceptance Scenarios**:

1. **Given** la app está en español (idioma por defecto), **When** el usuario abre Settings y selecciona "English" como idioma, **Then** todos los textos de la interfaz cambian a inglés de forma inmediata sin necesidad de reiniciar la app.
2. **Given** el usuario cambió el idioma a inglés, **When** cierra y reabre la app, **Then** la app se carga directamente en inglés.
3. **Given** el idioma está en inglés, **When** el usuario navega a Dashboard, **Then** el título dice "Dashboard", los mensajes de error, labels de accesibilidad y textos vacíos aparecen en inglés.
4. **Given** el idioma está en inglés, **When** el usuario abre el flujo de añadir métrica, **Then** títulos, subtítulos, placeholders, botones y descripciones de tipo de chart se muestran en inglés.
5. **Given** el idioma está en inglés, **When** el usuario abre el detalle de un chart, **Then** labels ("Total", "Error loading data", "No data for this period", etc.) se muestran en inglés.

---

### User Story 2 — Auto-detección del idioma del dispositivo (Priority: P1)

Como usuario que instala la app por primera vez, quiero que la app detecte automáticamente el idioma de mi dispositivo y se muestre en ese idioma (si es soportado) para no tener que cambiarlo manualmente.

**Why this priority**: Garantiza una experiencia inmediata y natural para usuarios de ambos idiomas sin fricción de configuración.

**Independent Test**: Configurar el dispositivo/simulador en inglés, instalar la app fresca (sin preferencia guardada), verificar que se muestra en inglés. Repetir con el dispositivo en español y verificar que se muestra en español.

**Acceptance Scenarios**:

1. **Given** un usuario abre la app por primera vez con el dispositivo configurado en inglés, **When** no existe preferencia de idioma guardada, **Then** la app se muestra en inglés.
2. **Given** un usuario abre la app por primera vez con el dispositivo configurado en español, **When** no existe preferencia de idioma guardada, **Then** la app se muestra en español.
3. **Given** un usuario abre la app por primera vez con el dispositivo configurado en un idioma no soportado (ej. francés), **When** no existe preferencia de idioma guardada, **Then** la app se muestra en español (fallback).
4. **Given** el idioma está en español por auto-detección, **When** el usuario navega por todas las pantallas, **Then** los textos son idénticos a la versión actual de la app.

---

### User Story 3 — Selector de idioma en Settings (Priority: P1)

Como usuario, quiero ver un selector de idioma claramente visible en la pantalla de Settings para poder alternar entre Español e Inglés de forma sencilla.

**Why this priority**: Es el mecanismo de interacción directa para cambiar idioma. Sin este selector no hay forma de activar la feature.

**Independent Test**: Abrir Settings, localizar la sección de idioma, alternar entre Español e Inglés, verificar que cada cambio se refleja inmediatamente y que la selección persiste al reabrir la app.

**Acceptance Scenarios**:

1. **Given** el usuario está en Settings, **When** observa la pantalla, **Then** ve una sección de idioma con las opciones "Español" e "Inglés" (o "Spanish" y "English" si el idioma activo es inglés).
2. **Given** el usuario toca la opción de inglés, **When** la selección se confirma, **Then** la interfaz de Settings se actualiza a inglés inmediatamente, incluyendo el propio selector y los labels de la sección.
3. **Given** el usuario seleccionó inglés, **When** navega a otra tab y regresa a Settings, **Then** el selector sigue mostrando inglés como activo.
4. **Given** el usuario cambió manualmente el idioma a inglés desde Settings, **When** cambia el idioma del dispositivo a español y reabre la app, **Then** la app sigue en inglés porque la preferencia manual prevalece sobre la auto-detección.

---

### Edge Cases

- ¿Qué pasa si el almacenamiento local se corrompe y no se puede leer la preferencia de idioma? La app debe intentar auto-detectar del dispositivo; si eso también falla, cae al idioma fallback (español).
- ¿Qué pasa con strings que contienen valores dinámicos (nombres de eventos, project names, labels personalizados del dashboard)? Estos valores dinámicos NO se traducen; solo se traduce el texto estático de la UI.
- ¿Qué pasa con el texto "PH" del logo en onboarding? Es un logo, no texto localizable; no se traduce.
- ¿Qué pasa con términos técnicos como "API Key", "PostHog", "Dashboard", "Breakdown", "Funnel"? Se mantienen en inglés en ambos idiomas por ser terminología técnica reconocida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La app DEBE soportar dos idiomas: español (es) e inglés (en).
- **FR-002**: Cuando no existe preferencia guardada, la app DEBE detectar el idioma del dispositivo y usarlo si es soportado (es o en); si el idioma del dispositivo no es soportado, DEBE usar español como fallback.
- **FR-002a**: Una vez que el usuario cambia el idioma manualmente desde Settings, esa preferencia DEBE persistirse y prevalecer sobre la auto-detección del dispositivo en todos los lanzamientos futuros.
- **FR-003**: La pantalla de Settings DEBE incluir una sección de selección de idioma con las opciones Español e Inglés.
- **FR-004**: Al cambiar el idioma, todos los textos estáticos de la interfaz DEBEN actualizarse de inmediato sin necesidad de reiniciar la app.
- **FR-005**: La preferencia de idioma del usuario DEBE persistirse en almacenamiento local para que sobreviva al cierre de la app.
- **FR-006**: Todas las pantallas de la app DEBEN utilizar el sistema de traducciones centralizado en lugar de strings hardcodeados.
- **FR-007**: Los valores dinámicos proporcionados por el usuario o la API (nombres de eventos, labels de métricas, nombres de proyecto) NO DEBEN traducirse.
- **FR-008**: Términos técnicos universalmente reconocidos (API Key, PostHog, Dashboard, Breakdown, Funnel, Stacked, Normal) DEBEN mantenerse en inglés en ambos idiomas.
- **FR-009**: Los labels de las tabs de navegación DEBEN traducirse según el idioma seleccionado.
- **FR-010**: Los mensajes de Alert nativos (confirmación de eliminación) DEBEN mostrarse en el idioma seleccionado.
- **FR-011**: Los textos de accesibilidad (accessibilityLabel) DEBEN traducirse al idioma seleccionado.

### Key Entities

- **Locale**: Identificador del idioma activo ('es' | 'en'). Se persiste en almacenamiento local solo cuando el usuario lo cambia manualmente desde Settings. Cuando no hay preferencia guardada, se deriva del idioma del dispositivo.
- **TranslationCatalog**: Conjunto completo de traducciones para un idioma dado. Contiene todas las cadenas estáticas de la interfaz organizadas por contexto (pantalla/componente).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los textos estáticos de la interfaz (títulos, botones, labels, placeholders, mensajes de error, textos vacíos, descripciones) se muestran en el idioma seleccionado.
- **SC-002**: El cambio de idioma surte efecto de forma inmediata sin que el usuario necesite reiniciar la app o navegar a otra pantalla.
- **SC-003**: La preferencia de idioma manual se mantiene correctamente tras cerrar y reabrir la app, prevaleciendo sobre el idioma del dispositivo.
- **SC-003a**: Sin preferencia manual guardada, la app arranca en el idioma del dispositivo (si soportado) o en español (fallback).
- **SC-004**: La app en español se ve y funciona de manera idéntica a la versión actual (sin regresiones visuales ni funcionales).
- **SC-005**: No se introducen errores de TypeScript en ninguna pantalla o componente modificado.

## Assumptions

- La app solo necesita dos idiomas por ahora: español e inglés. El diseño debe permitir agregar más idiomas en el futuro de forma sencilla, pero no se requiere implementar soporte para más de dos.
- El idioma del dispositivo se usa para auto-detectar en el primer lanzamiento (o si no hay preferencia guardada). Una vez que el usuario cambia el idioma manualmente desde Settings, esa selección prevalece sobre la auto-detección del dispositivo. Español es el fallback si el idioma del dispositivo no es soportado.
- Los nombres de eventos y métricas provenientes del API de PostHog son datos dinámicos y no requieren traducción.
- Las opciones "Stacked"/"Normal" para chart modes son terminología técnica que no se traduce.
- Los strings de traducciones se organizan como archivos estáticos dentro del proyecto (no se descargan remotamente).

## Alcance de Textos a Traducir

Las siguientes pantallas y componentes contienen textos estáticos que deben migrarse al sistema de i18n:

1. **Tab Layout** — nombres de tabs: "Dashboard", "Settings"
2. **Dashboard** — header, mensaje de error de cache, labels de accesibilidad
3. **Settings** — header, sección API Key, botones, alerts de confirmación, labels de accesibilidad, nueva sección de idioma
4. **Onboarding (API Key)** — título, descripción, placeholder, botón, texto de ayuda
5. **Chart Detail** — labels de navegación, estados vacíos/error, etiquetas de datos, tooltips
6. **Edit Chart** — header, secciones de configuración, modales de selección, alerts
7. **AddMetricSheet** — títulos por paso, subtítulos, placeholders, botones, descripciones de chart types, labels de funnel
8. **DashboardEmptyState** — título y descripción del estado vacío
9. **MetricCard** — texto de error
