# Contract: useAuth Hook

**Branch**: `001-api-key-screen` | **Phase**: 1 | **Date**: 2026-03-20  
**File**: `app/PostHogMobile/src/hooks/useAuth.tsx`  
**Revision**: Actualizado tras cambios en spec (US-2 → toggle visibilidad + copia; FR-004/FR-004a/FR-004b).

---

## Propósito

Hook central para la gestión del ciclo de vida de la API Key de PostHog. Es el único punto de acceso al almacenamiento seguro de la clave. Los componentes y pantallas **nunca** interactúan directamente con `expo-secure-store` ni con el servicio `posthog.ts` para operaciones de autenticación.

---

## Interfaz Pública

```typescript
interface UseAuthReturn {
  // Estado
  hasApiKey: boolean;           // true si existe una clave almacenada en SecureStore
  maskedValue: string | null;   // Clave enmascarada para display (ej: "phx_AbCd...xYzW")
  cloudRegion: PostHogCloud;    // 'us' o 'eu'
  isLoading: boolean;           // true durante operaciones async (load inicial, validate, delete)
  error: ApiKeyError | null;    // Error del último intento fallido; null si no hay error

  // Operaciones
  validateAndStore: (key: string, cloudRegion: PostHogCloud) => Promise<void>;  // US-1: valida y guarda nueva clave + región
  updateApiKey: (key: string, cloudRegion: PostHogCloud) => Promise<void>;      // US-3: valida y reemplaza clave y región existentes
  deleteApiKey: () => Promise<void>;                 // US-4: elimina la clave (sin confirmación — la confirmación es responsabilidad del componente)
  getFullApiKey: () => Promise<string | null>;       // FR-004/FR-004a: recupera la clave completa de SecureStore bajo demanda
  clearError: () => void;                            // Limpia el error actual
}

function useAuth(): UseAuthReturn
```

---

## Comportamiento por Operación

### `validateAndStore(key: string, cloudRegion: PostHogCloud)`
1. Trim del input.
2. Validación de formato (`EMPTY`, `INVALID_FORMAT`) y de región cloud.
3. Llamada a `posthog.validateApiKey(trimmedKey, cloudRegion)` — puede lanzar `INVALID_KEY`, `INSUFFICIENT_PERMISSIONS`, `NETWORK_ERROR`, `SERVER_ERROR`.
4. En éxito: `SecureStore.setItemAsync(SECURE_STORE_KEY, trimmedKey)` y `SecureStore.setItemAsync(POSTHOG_CLOUD_KEY, cloudRegion)` — puede lanzar `SECURE_STORE_UNAVAILABLE`.
5. En éxito: actualiza estado (`hasApiKey: true`, `maskedValue: maskApiKey(key)`, `cloudRegion`, `error: null`).
6. En error: actualiza `error`, NO modifica SecureStore.

### `updateApiKey(key: string, cloudRegion: PostHogCloud)`
- Comportamiento idéntico a `validateAndStore`.
- Si la validación falla, la clave y la región anteriores permanecen en SecureStore sin cambios.

### `deleteApiKey()`
1. `SecureStore.deleteItemAsync(SECURE_STORE_KEY)`.
2. `SecureStore.deleteItemAsync(POSTHOG_CLOUD_KEY)`.
3. Actualiza estado (`hasApiKey: false`, `maskedValue: null`, `cloudRegion: 'us'`, `error: null`).
4. Si SecureStore falla: setea `error` con código `SECURE_STORE_UNAVAILABLE`.

### `getFullApiKey()` *(nuevo — FR-004/FR-004a/FR-004b)*
1. Lee directamente de `SecureStore.getItemAsync(SECURE_STORE_KEY)`.
2. Retorna el valor completo como `string`, o `null` si no hay clave almacenada.
3. **No modifica el estado del hook** — es una lectura pura y sin side effects.
4. **No almacena el valor leído** en ninguna variable del hook. El consumidor recibe la Promise y gestiona el valor.
5. Si SecureStore falla, retorna `null` (silencioso — no setea error en el hook, ya que no es una operación de escritura).

**Uso esperado en settings.tsx**:
- Toggle de visibilidad: `const fullKey = await getFullApiKey(); setRevealedKey(fullKey);` — al desactivar toggle: `setRevealedKey(null);`
- Copia al portapapeles: `const fullKey = await getFullApiKey(); if (fullKey) await Clipboard.setStringAsync(fullKey);`

### Carga inicial
- Al montar el hook (en el `_layout.tsx` raíz), llama a `SecureStore.getItemAsync(SECURE_STORE_KEY)`.
- Si existe: `hasApiKey: true`, calcula `maskedValue`, descarta el `value` completo.
- Si no existe: `hasApiKey: false`, `maskedValue: null`.

---

## Contratos de Error

- El hook **nunca** lanza excepciones — todas las condiciones de error se exponen a través de `error: ApiKeyError | null`.
- Después de un error, el estado previo (hasApiKey, maskedValue) se preserva intacto.
- Los consumidores deben llamar `clearError()` al remontar el formulario o al iniciar un nuevo intento.

---

## Restricciones de Seguridad

- El `value` completo de la API Key **nunca** se almacena en el estado de React ni se expone fuera de las funciones del hook.
- El `maskedValue` es calculado a partir del valor completo dentro del hook y es el único string derivado de la clave que se expone.
- Las operaciones de SecureStore se realizan en `try/catch`; los errores se mapean a `ApiKeyError` antes de propagarse.
- Se loguea actividad (éxito/fallo) a través de `logger.ts` **sin** incluir el valor de la clave.

---

## Dependencias

```typescript
import * as SecureStore from 'expo-secure-store';
import { validateApiKey } from '../services/posthog';
import { maskApiKey } from '../utils/apiKey'; // o definida internamente
import { SECURE_STORE_KEY, API_KEY_REGEX } from '../constants';
```
