# Feature Specification: Settings Safe Area y Header Alignment

**Feature Branch**: `004-settings-safe-area`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "En la pantalla de settings debemos respetar el safe area superior de los iphone, la pantalla quedo muy arriba, bajala para que el texto configuracion quede al mismo nivel que Dashboard y usa la misma fuente y tamaño que Dashboard"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el header de Settings alineado con Dashboard (Priority: P1)

Como usuario autenticado, al abrir la pestaña de Settings quiero que el título "Configuración" respete el safe area superior del dispositivo y quede visualmente alineado con el título "Dashboard" para que ambas tabs se sientan consistentes en iPhone.

**Why this priority**: El problema es visible en el primer render de la pantalla y afecta directamente la legibilidad y consistencia visual de la navegación principal.

**Independent Test**: Abrir la app en iPhone o simulador con notch, entrar a Settings y comprobar que el título no invade la zona superior y queda a la misma altura visual que Dashboard.

**Acceptance Scenarios**:

1. **Given** un usuario abre la pestaña Settings en un iPhone con notch, **When** la pantalla renderiza, **Then** el contenido respeta el safe area superior.
2. **Given** el usuario alterna entre Dashboard y Settings, **When** compara ambos encabezados, **Then** el título "Configuración" queda alineado con "Dashboard".
3. **Given** el usuario abre Settings, **When** observa el header, **Then** el título usa la misma tipografía y tamaño visual que Dashboard.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla Settings DEBE respetar el safe area superior en iPhone.
- **FR-002**: El título principal de Settings DEBE renderizarse con la misma jerarquía visual que el título principal de Dashboard.
- **FR-003**: El título "Configuración" DEBE usar la misma familia tipográfica y tamaño que "Dashboard".
- **FR-004**: El ajuste visual NO DEBE alterar los flujos existentes de cambio o eliminación de API key.
- **FR-005**: El contenido scrolleable de Settings DEBE seguir funcionando después del ajuste del header.

### Key Entities

- **SettingsHeader**: Bloque superior visual de la pantalla Settings que contiene el título principal y define su espaciado respecto del safe area.
- **SettingsContent**: Contenido scrolleable debajo del header que agrupa la configuración de API key.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El título principal de Settings no queda recortado ni pegado al borde superior en dispositivos iPhone con notch.
- **SC-002**: El título de Settings queda al mismo nivel visual que el de Dashboard dentro de una tolerancia perceptible de 0 a 4 px.
- **SC-003**: No se introducen errores de TypeScript en la pantalla modificada.

## Assumptions

- Settings y Dashboard deben compartir el mismo patrón de encabezado dentro del tab navigator actual.
- El patrón correcto de referencia para espaciado y jerarquía tipográfica es la implementación actual de Dashboard.