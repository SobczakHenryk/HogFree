# Tasks: Pantalla de API Key

**Input**: Design documents from `/specs/001-api-key-screen/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias incompletas)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US1–US4)
- Los paths son relativos a `app/PostHogMobile/`

---

## Phase 1: Setup

**Purpose**: Estructura base de la feature — sin código de negocio, solo andamiaje.

- [X] T001 Crear estructura de directorios: `src/app/(onboarding)/`, `src/utils/` y confirmar existencia de `src/hooks/`, `src/components/`, `src/services/`, `src/constants/`, `src/types/`
- [X] T002 Agregar constantes y tipos base en `src/constants/index.ts` (`SECURE_STORE_KEY`, `POSTHOG_CLOUD_KEY`, `POSTHOG_CLOUD_HOSTS`, `DEFAULT_POSTHOG_CLOUD`, `API_KEY_REGEX`, `VALIDATION_TIMEOUT_MS`, `API_KEY_ERRORS`) y en `src/types/index.ts` (`PostHogCloud`, `ApiKeyErrorCode`, `ApiKeyError`, `ApiKeyState`) siguiendo `specs/001-api-key-screen/data-model.md`

**Checkpoint**: Estructura lista y compilando — sin errores TypeScript.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Núcleo de autenticación y componentes compartidos — DEBE completarse antes de cualquier historia de usuario.

**⚠️ CRÍTICO**: Ninguna pantalla puede implementarse hasta que esta fase esté completa.

- [X] T003 Implementar `maskApiKey(value: string): string` en `src/utils/apiKey.ts` siguiendo la lógica `slice(0,8) + '...' + slice(-4)` de `specs/001-api-key-screen/data-model.md` (§Lógica de Enmascarado)
- [X] T004 Implementar `validateApiKey(key: string, cloud: PostHogCloud): Promise<PostHogProjectInfo>` en `src/services/posthog.ts` siguiendo el contrato de `specs/001-api-key-screen/contracts/posthog-service.md`: `GET /api/projects/` con `Authorization: Bearer`, `retry: 0`, `timeout: `VALIDATION_TIMEOUT_MS`, usando el hostname privado según cloud (`us.posthog.com` o `eu.posthog.com`) y mapeo completo de `HTTPError 401/403/5xx`, `200 OK` sin proyectos y `TimeoutError` a `ApiKeyError`
- [X] T005 Implementar hook `useAuth()` en `src/hooks/useAuth.ts` siguiendo el contrato de `specs/001-api-key-screen/contracts/useAuth.md`: carga inicial de SecureStore, operaciones `validateAndStore`, `updateApiKey`, `deleteApiKey`, `clearError`, estado `{ hasApiKey, maskedValue, cloudRegion, isLoading, error }` y persistencia de `POSTHOG_CLOUD_KEY` — el `value` completo nunca se expone fuera del hook
- [X] T006 [P] Crear componente `ApiKeyField` en `src/components/ApiKeyField.tsx`: `TextInput` con `secureTextEntry`, `autoCorrect={false}`, `autoCapitalize="none"`, toggle de visibilidad con ícono de `@expo/vector-icons`, estilos NativeWind (`bg-background-tertiary rounded-lg px-4 py-3 text-base font-inter text-text-primary`), props `value`, `onChangeText`, `placeholder`, `editable`
- [X] T007 [P] Crear `CloudRegionSelector` en `src/components/CloudRegionSelector.tsx` y actualizar barrels de exportación: agregar `useAuth` en `src/hooks/index.ts`, `ApiKeyField` y `CloudRegionSelector` en `src/components/index.ts`

**Checkpoint**: Foundation lista — `useAuth`, `validateApiKey`, `ApiKeyField` y `maskApiKey` implementados y sin errores TypeScript.

---

## Phase 3: User Story 1 — Registro inicial de API Key (Priority: P1) 🎯 MVP

**Goal**: Un usuario nuevo puede ingresar y validar su API Key de PostHog por primera vez, siendo redirigido a la app principal tras el éxito.

**Independent Test**: Abrir la app desde cero en un dispositivo (o simulador) sin API Key guardada → ingresar una clave válida → verificar que la navegación avanza a `/(tabs)/` correctamente.

### Implementation for User Story 1

- [X] T008 [US1] Configurar auth guard en `src/app/_layout.tsx`: `useAuth()` + `useSegments` + `useRouter` con `useEffect` que hace `router.replace('/(onboarding)/api-key')` cuando `!hasApiKey && !inOnboarding` y `router.replace('/(tabs)/')` cuando `hasApiKey && inOnboarding`; mostrar componente de splash/carga mientras `isLoading` es `true` siguiendo `specs/001-api-key-screen/quickstart.md` (§Paso 6)
- [X] T009 [US1] Crear layout del grupo onboarding en `src/app/(onboarding)/_layout.tsx`: `Stack` sin header visible, orientación portrait, fondo `bg-background` (dark)
- [X] T010 [US1] Implementar pantalla `src/app/(onboarding)/api-key.tsx`: logo PostHog + título + descripción breve, `CloudRegionSelector` para `US Cloud` / `EU Cloud`, `ApiKeyField` con campo vacío (sin pre-relleno, FR-009), botón "Guardar" con `Pressable` que llama `useAuth().validateAndStore(key, cloudRegion)`, `ActivityIndicator` mientras `isLoading`, mensaje de error diferenciado debajo del campo cuando `error !== null` (FR-006), `clearError()` al cambiar el texto del campo o la región

**Checkpoint**: US1 completamente funcional — flujo de onboarding funciona de extremo a extremo en iOS y Android.

---

## Phase 4: User Story 2 — Visualización enmascarada (Priority: P2)

**Goal**: Un usuario con API Key guardada puede ver en Settings que tiene una clave registrada, mostrando solo la versión enmascarada (`phx_AbCd...xYzW`).

**Independent Test**: Navegar a Settings con una API Key ya guardada → verificar que el card muestra solo la versión enmascarada, sin posibilidad de ver la clave completa.

### Implementation for User Story 2

- [X] T011 [US2] Implementar sección "API Key" en `src/app/(tabs)/settings.tsx`: card con `maskedValue` renderizado como texto estático (no `TextInput`), label "API Key activa", borde `border-border rounded-2xl`, fondo `bg-background-secondary`; mostrar el card solo cuando `useAuth().hasApiKey === true` — la clave completa nunca se expone en la UI (FR-004, SC-003)

**Checkpoint**: US2 funcional — la visualización enmascarada funciona correctamente con cualquier API Key guardada.

---

## Phase 5: User Story 3 — Actualización de API Key (Priority: P3)

**Goal**: Un usuario con API Key guardada puede reemplazarla por una nueva clave válida desde Settings.

**Independent Test**: Desde Settings con una API Key guardada, ingresar una nueva clave válida → verificar que la clave se reemplaza y `maskedValue` se actualiza.

### Implementation for User Story 3

- [X] T012 [US3] Agregar flujo de actualización en `src/app/(tabs)/settings.tsx`: mostrar región cloud activa, botón "Cambiar API Key" con `Pressable` que muestra un form inline (o modal) con `CloudRegionSelector` y `ApiKeyField` vacío (FR-009: sin pre-relleno), botón "Confirmar" que llama `useAuth().updateApiKey(newKey, cloudRegion)`, botón "Cancelar" que cierra el form sin modificar nada, `ActivityIndicator` mientras `isLoading`, mensaje de error si `error !== null` — la clave y la región anteriores permanecen sin cambios si la validación falla (UC-2 de spec §US3)

**Checkpoint**: US3 funcional — actualización de clave valida la nueva antes de reemplazar y preserva la anterior ante errores.

---

## Phase 6: User Story 4 — Eliminación de API Key (Priority: P4)

**Goal**: Un usuario puede eliminar su API Key guardada, con confirmación explícita, siendo redirigido al onboarding.

**Independent Test**: Desde Settings, tocar "Eliminar API Key" → confirmar en el diálogo → verificar que la app regresa a la pantalla de ingreso inicial.

### Implementation for User Story 4

- [X] T013 [US4] Agregar flujo de eliminación en `src/app/(tabs)/settings.tsx`: botón "Eliminar API Key" con color destructivo (`text-red-500` / `border-red-500`), `Pressable` que dispara `Haptics.ImpactFeedbackStyle.Heavy` y luego `Alert.alert` con título "Eliminar API Key", mensaje de confirmación claro, botones "Cancelar" y "Eliminar"; al confirmar: llama `useAuth().deleteApiKey()` — el redirect a `/(onboarding)/api-key` ocurre automáticamente vía auth guard; al cancelar: no cambia nada (UC-2 de spec §US4)

**Checkpoint**: US4 funcional — eliminación con confirmación redirige al onboarding; cancelación preserva el estado.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Haptic feedback, edge cases de la spec, y validación final del constitution check.

- [X] T014 [P] Implementar haptic feedback en todas las acciones clave de la feature: `Haptics.ImpactFeedbackStyle.Medium` al guardar/actualizar con éxito, `Haptics.ImpactFeedbackStyle.Light` al mostrar un error de validación, `Haptics.ImpactFeedbackStyle.Heavy` antes del diálogo de eliminación — usando `expo-haptics` según constitución §4.6
- [X] T015 [P] Manejar edge cases explícitos de la spec: (1) trim automático visible en `ApiKeyField` (`onChangeText` aplica `.trim()` — FR-010); (2) mensajes diferenciados para `SECURE_STORE_UNAVAILABLE` cuando el dispositivo no tiene protección de pantalla (especificado en spec §Edge Cases); (3) mensaje de timeout de red diferenciado del error de red genérico (`NETWORK_ERROR` cubre ambos con mensaje claro al usuario); (4) error claro ante selección de cloud incorrecta sin persistir credenciales nuevas
- [X] T016 [P] Actualizar `src/services/posthog-api.ts`, `src/hooks/useEventDefinitions.ts`, `src/hooks/useMetricValue.ts` y cualquier llamada autenticada para usar el hostname privado derivado de la región persistida, evitando requests a la región incorrecta
- [X] T017 Validar el checklist completo de `specs/001-api-key-screen/quickstart.md` (§Checklist de implementación) y re-confirmar los gates del Constitution Check de `specs/001-api-key-screen/plan.md` (§Constitution Check) — verificar especialmente que la API Key nunca atraviesa el cache de TanStack Query, que `maskedValue` es el único string derivado de la clave expuesto en el estado de React y que las requests privadas salen solo a `us.posthog.com` o `eu.posthog.com` según la región persistida

---

## Phase 8: US2 Enhancement — Toggle de visibilidad y copia completa (FR-004/FR-004a/FR-004b)

**Purpose**: Implementar la capacidad de revelar la API Key completa y copiarla íntegra al portapapeles, cumpliendo la spec actualizada.

**Depends on**: Phase 4 (US2 base) ✅, Phase 2 (Foundational) ✅

**Independent Test**: Navegar a Settings → verificar clave enmascarada por defecto → tocar ojo para revelar clave completa → verificar que se muestra íntegra → tocar ojo de nuevo para ocultar → tocar botón copiar → verificar que el portapapeles contiene la clave completa (no enmascarada).

- [ ] T018 [US2] Agregar `getFullApiKey(): Promise<string | null>` al hook `useAuth` en `src/hooks/useAuth.tsx`: lee directamente de `SecureStore.getItemAsync(SECURE_STORE_KEY)`, retorna el valor completo o `null`, sin modificar estado del hook ni almacenar el valor en memoria del hook, retorna `null` silenciosamente si SecureStore falla — siguiendo contrato `specs/001-api-key-screen/contracts/useAuth.md` (§getFullApiKey)
- [ ] T019 [US2] Actualizar `src/app/(tabs)/settings.tsx` para implementar toggle de visibilidad completa: agregar estado local `revealedKey: string | null`, al activar toggle (`showApiKey → true`) llamar `getFullApiKey()` y setear `revealedKey`, mostrar `revealedKey` cuando toggle activo y `maskedValue` con caracteres ocultos cuando inactivo, al desactivar toggle limpiar `setRevealedKey(null)` explícitamente — siguiendo plan.md §Key Design Decisions punto 2
- [ ] T020 [US2] Actualizar `handleCopyKey` en `src/app/(tabs)/settings.tsx` para copiar la clave completa: llamar `getFullApiKey()` en lugar de copiar `maskedValue`, usar `Clipboard.setStringAsync(fullKey)` con el valor íntegro, mantener feedback visual (ícono cambia a teal por 2s), haptic feedback en copia — siguiendo FR-004a y plan.md §Key Design Decisions punto 3

**Checkpoint**: US2 enhancement completo — la clave se muestra enmascarada por defecto, se revela íntegra bajo toggle, y se copia completa al portapapeles. La clave completa nunca persiste en estado de React del hook (FR-004b).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede empezar inmediatamente
- **Foundational (Phase 2)**: Depende de Setup → **BLOQUEA todas las historias de usuario**
- **User Stories (Phases 3–6)**: Todas dependen de Foundational completo; pueden ejecutarse en serie (P1 → P2 → P3 → P4) o en paralelo si hay capacidad de equipo
- **Polish (Phase 7)**: Depende de que todas las historias deseadas estén completas
- **US2 Enhancement (Phase 8)**: Depende de Phase 4 (US2 base) y Phase 2 (Foundational) — puede ejecutarse independientemente de Phases 5, 6 y 7

### User Story Dependencies

| Historia | Depende de | Independiente de |
|----------|-----------|-----------------|
| US1 (P1) | Phase 2 completo | US2, US3, US4 |
| US2 (P2) | Phase 2 + US1 (auth guard) | US3, US4 |
| US2 Enhancement | Phase 4 (US2 base) | US3, US4, Phase 7 |
| US3 (P3) | Phase 2 + US2 (settings screen base) | US4 |
| US4 (P4) | Phase 2 + US2 (settings screen base) | US3 |

> **Nota**: US2, US3 y US4 construyen sobre el mismo archivo `settings.tsx`. US2 crea la base del card, US3 y US4 la extienden. Por eso US3 y US4 dependen de que US2 esté completo, aunque son independientes entre sí.

### Within Each User Story

- Constantes y tipos base → Servicios → Hook → Componentes → Pantallas
- La clave completa se recupera bajo demanda de SecureStore vía `getFullApiKey()` — nunca se almacena en estado del hook
- El redirect post-acción siempre ocurre via auth guard automático, no navegación manual

### Parallel Opportunities

- **Phase 1**: T001 y T002 son secuenciales (T002 necesita las carpetas de T001)
- **Phase 2**: T003, T004 pueden empezar en paralelo → T005 depende de T003 y T004 → T006 y T007 en paralelo con T005
- **Phase 3**: T008, T009 en paralelo → T010 depende de T008 y T009
- **Phases 4–6**: US2 primero (base de settings.tsx) → luego US3 y US4 pueden ejecutarse en paralelo (si se usa una rama por story)
- **Phase 7**: T014 y T015 en paralelo → T016 al final
- **Phase 8**: T018 primero → T019 y T020 pueden ejecutarse en paralelo (ambos dependen de `getFullApiKey()` existiendo en el hook)

---

## Implementation Strategy

### MVP Scope (US1 únicamente — Phases 1, 2, 3)

El MVP mínimo entregable son las Phases 1–3 (T001–T010). Con eso, un usuario nuevo puede:
- Ingresar y validar su API Key de PostHog
- Almacenarla de forma segura en el dispositivo
- Acceder a la app principal

Las Phases 4–6 (US2, US3, US4) añaden la gestión de credenciales en Settings y son incrementos seguros post-MVP.

### Formato de validación

- Todos los tasks siguen: `- [ ] [TID] [P?] [Story?] Descripción con path`
- 17 tasks en total: 2 Setup + 5 Foundational + 3 US1 + 1 US2 + 1 US3 + 1 US4 + 4 Polish
- Tasks [P] en Phase 2: T006, T007 — en Phase 7: T014, T015, T016
- Tasks con [Story]: T008–T013 (todas las pantallas y flujos de usuario)
