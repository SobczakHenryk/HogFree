# Implementation Plan: Pantalla de API Key

**Branch**: `001-api-key-screen` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-api-key-screen/spec.md`  
**Revision**: Regenerado tras actualización de spec (US-2 → visualización con toggle + copia; FR-004/FR-004a/FR-004b; SC-003).

## Summary

Implementar el flujo completo de gestión de API Key de PostHog en la app móvil: pantalla de ingreso como onboarding guard (Expo Router), selector de región cloud (`US Cloud` / `EU Cloud`), validación contra `GET /api/projects/` del hostname privado correcto de PostHog, almacenamiento seguro exclusivo con `expo-secure-store` (iOS Keychain / Android Keystore) tanto para la API Key como para la región, **visualización enmascarada por defecto con toggle de visibilidad para revelar la clave completa y botón de copia al portapapeles de la clave íntegra** (FR-004, FR-004a, FR-004b), y soporte para actualización y eliminación con confirmación explícita. La clave completa se recupera bajo demanda de SecureStore para mostrar/copiar, pero **nunca se almacena en el estado de React ni se expone en logs** (FR-004b). `useAuth` opera fuera de TanStack Query; las credenciales no atraviesan el cache.

## Technical Context

**Language/Version**: TypeScript ~5.9.2 / React Native 0.81.5 / Expo ~54.0.33  
**Primary Dependencies**: Expo Router ~6.0.23, NativeWind ^4.2.1, TanStack Query ^5.90.21, `expo-secure-store` ^15.0.8, `ky` ^1.14.3, `expo-haptics` ^15.0.8, `expo-clipboard` (para copia al portapapeles)  
**Storage**: `expo-secure-store` ÚNICAMENTE — iOS Keychain / Android Keystore. Nunca AsyncStorage para credenciales.  
**Testing**: Jest + `jest-expo` preset + `@testing-library/react-native` (estándar Expo; confirmado en research.md)  
**Target Platform**: iOS 15+ / Android — ambos principales. New Architecture habilitada (`newArchEnabled: true`).  
**Project Type**: Mobile app (React Native / Expo)  
**Performance Goals**: Flujo de ingreso + validación completable en < 60s (SC-001). Timeout de red: 10s con mensaje de error claro al usuario.  
**Constraints**: Solo librerías compatibles con New Architecture (Fabric / JSI). Offline = mostrar error, nunca guardar sin validación exitosa. SecureStore-only para credenciales. Hostnames privados soportados: `https://us.posthog.com` y `https://eu.posthog.com`.  
**Scale/Scope**: 1 pantalla de onboarding + sección de settings. 1 API Key máximo por dispositivo. 1 región cloud activa por dispositivo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Regla (Constitución §6) | Diseño de la Feature | Estado |
|------|-------------------------|----------------------|--------|
| **SEC-1** | API Key almacenada ÚNICAMENTE en `expo-secure-store` | SecureStore es el único mecanismo de persistencia. La clave no atraviesa TanStack Query cache ni AsyncStorage. | ✅ PASS |
| **SEC-2** | API Key NUNCA visible en UI ni logs después de guardada (Constitución §3.3) | **DESVIACIÓN JUSTIFICADA** — ver detalle abajo. | ⚠️ JUSTIFIED DEVIATION |
| **SEC-3** | HTTPS only — peticiones exclusivamente al cloud seleccionado | Cliente `ky` apunta a `https://us.posthog.com` o `https://eu.posthog.com` según la selección del usuario. Sin fallback HTTP. | ✅ PASS |
| **SEC-4** | No guardar credenciales en cache de TanStack Query (AsyncStorage persister) | `useAuth` opera fuera de TanStack Query. Solo se cachea data de negocio (insights, events). | ✅ PASS |
| **ARCH-1** | New Architecture habilitada — solo librerías Fabric / JSI compatibles | `expo-secure-store` ≥ v14 y `ky` son plenamente compatibles con New Architecture. | ✅ PASS |
| **UX-1** | Validar inputs antes de enviar a la API (trim + longitud mínima) | FR-010 (trim automático) + FR-006 (errores diferenciados) + selector explícito de región + pre-validación de formato `phx_` con compatibilidad retro `phc_`. | ✅ PASS |

### Desviación justificada: SEC-2

**Regla constitucional (§3.3)**: *"Nunca mostrar la API Key en la UI ni en logs."*

**Requisito del spec (FR-004, FR-004a, FR-004b, US-2)**:
- La clave se muestra enmascarada por defecto (primeros 8 + últimos 4 chars).
- El usuario puede alternar visibilidad para ver la clave **completa** (sin truncar).
- El usuario puede copiar la clave **completa** al portapapeles.
- La clave completa DEBE poder ser recuperada de SecureStore para estos fines.

**Justificación**: El spec actualizado (US-2, FR-004/FR-004a/FR-004b) modifica explícitamente el comportamiento original de la constitución para esta pantalla. La clave completa es accesible SOLO bajo acción explícita del usuario (toggle de visibilidad) y se copia íntegra al portapapeles bajo acción explícita.

**Mitigaciones de seguridad**:
1. La clave completa se lee bajo demanda de SecureStore mediante `getFullApiKey()` — **nunca** se almacena en `useState` ni en el estado del hook.
2. El valor completo se pasa directamente a la UI o al portapapeles de forma efímera; no persiste en el árbol de React.
3. Al desmontar el componente o cambiar de pantalla, la referencia al valor completo se descarta.
4. `logger.ts` sigue redactando credenciales — la clave no se expone en logs bajo ninguna circunstancia.
5. `selectable={false}` en el texto del campo previene selección/copiado accidental del texto visible.
6. Al iniciar edición (cambio de clave), el campo aparece vacío (FR-009).

**Resultado**: SEC-2 recibe status de **JUSTIFIED DEVIATION** — no es un PASS limpio, pero la desviación es explícita, acotada y mitigada conforme a FR-004b.

## Project Structure

### Documentation (this feature)

```text
specs/001-api-key-screen/
├── plan.md                    # Este archivo
├── research.md                # Phase 0 — decisiones y resolución de incógnitas
├── data-model.md              # Phase 1 — entidades, validaciones, transiciones de estado
├── quickstart.md              # Phase 1 — guía de implementación para el desarrollador
├── contracts/
│   ├── useAuth.md             # Contrato del hook de autenticación
│   └── posthog-service.md     # Contrato del servicio PostHog (validateApiKey)
└── tasks.md                   # Phase 2 — generado por /speckit.tasks (no creado aquí)
```

### Source Code (repository root)

```text
app/PostHogMobile/
└── src/
    ├── app/
    │   ├── _layout.tsx                  # Root layout con auth guard (redirige según presencia de API Key)
    │   ├── (onboarding)/
    │   │   ├── _layout.tsx              # Layout sin tabs para onboarding
    │   │   └── api-key.tsx              # US-1: Pantalla de ingreso inicial de API Key + selección US/EU Cloud
    │   └── (tabs)/
    │       └── settings.tsx             # US-2/3/4: Visualización enmascarada + toggle visibilidad + copia + update + delete
    ├── components/
    │   ├── index.ts
    │   ├── ApiKeyField.tsx              # Input tipo password con toggle de visibilidad
    │   └── CloudRegionSelector.tsx      # Selector segmentado para US Cloud / EU Cloud
    ├── hooks/
    │   ├── index.ts
    │   └── useAuth.tsx                  # Estado + operaciones de API Key (store, validate, update, delete, mask, getFullApiKey)
    └── services/
        ├── api.ts                       # Cliente ky genérico con interceptors
        ├── posthog.ts                   # validateApiKey(key, region) → GET /api/projects/
        └── posthog-api.ts               # Recursos autenticados usando el hostname de la región persistida
```

**Structure Decision**: Patrón de autenticación estándar de Expo Router — Dos grupos separados: `(onboarding)` (sin tabs, para usuarios sin API Key) y `(tabs)` (app principal, protegida). El guard en `_layout.tsx` raíz verifica `useAuth().hasApiKey` y redirige al grupo correspondiente. Sigue la arquitectura definida en la constitución §3.

## Key Design Decisions (spec v2 — US-2 changes)

### 1. Recuperación bajo demanda de la API Key completa

**Problema**: FR-004b exige que la clave completa pueda ser recuperada para visualización y copia, pero prohíbe almacenarla en texto plano en el estado de React.

**Decisión**: Agregar `getFullApiKey(): Promise<string | null>` al hook `useAuth`. Esta función lee directamente de `SecureStore.getItemAsync(SECURE_STORE_KEY)` cada vez que se invoca. El valor retornado es efímero — el consumidor (settings.tsx) lo usa y descarta.

**Justificación**:
- Cada lectura va a SecureStore, no a memoria de React → cumple FR-004b.
- El componente settings.tsx usa el valor transitoriamente para (a) mostrarlo en la UI mientras el toggle está activo, o (b) copiarlo al portapapeles con `expo-clipboard`.
- Al desmontar o al desactivar el toggle, la variable local se descarta (garbage collected).

### 2. Toggle de visibilidad en settings.tsx

**Estado actual**: `showApiKey` booleano local. Cuando `true`, se muestra la clave completa (obtenida de `getFullApiKey()`). Cuando `false`, se muestra `maskedValue`.

**Flujo**:
1. Usuario toca ojo → `setShowApiKey(true)`.
2. El componente llama `getFullApiKey()` para obtener el valor completo.
3. El valor completo se almacena en una variable local (no en useState del hook) y se renderiza.
4. Usuario toca ojo de nuevo → `setShowApiKey(false)` → se renderiza `maskedValue`.

**Nota de seguridad**: El valor completo puede almacenarse temporalmente en un `useState` local del componente settings.tsx para el render, pero SOLO mientras el toggle está activo. Al desactivar el toggle, el estado local se limpia explícitamente (`setRevealedKey(null)`).

### 3. Copia al portapapeles

**Flujo**: El botón de copia siempre copia la clave **completa** (no la enmascarada), independientemente del estado visual.
1. Se llama `getFullApiKey()` para obtener el valor completo.
2. Se copia con `Clipboard.setStringAsync(fullKey)`.
3. Se muestra confirmación visual (cambio de color del ícono + haptic feedback).

## Complexity Tracking

| Gate | Desviación | Mitigación | Riesgo residual |
|------|-----------|------------|-----------------|
| SEC-2 | Clave completa visible en UI bajo toggle explícito del usuario | Lectura bajo demanda de SecureStore, sin persistencia en estado de React del hook, limpieza al desactivar toggle, `selectable={false}`, sin logs | Bajo — el usuario que revela su propia clave lo hace intencionalmente; el riesgo es equivalente a cualquier app que muestre un secret con toggle (1Password, etc.) |
