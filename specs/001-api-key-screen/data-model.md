# Data Model: Pantalla de API Key

**Branch**: `001-api-key-screen` | **Phase**: 1 | **Date**: 2026-03-20  
**Revision**: Actualizado tras cambios en spec (US-2 → toggle visibilidad + copia de clave completa).

---

## Entidades

### ApiKey

Credencial de acceso a la cuenta PostHog del usuario. Existe un máximo de una por dispositivo.

```typescript
interface ApiKeyRecord {
  value: string;       // Valor completo de la clave (solo en SecureStore, nunca en estado de React del hook)
  storedAt: string;    // ISO 8601 timestamp del momento en que fue almacenada
  isValidated: boolean; // true = pasó validación contra /api/projects/ exitosamente
}
```

**Notas de seguridad**:
- `value` solo vive en `expo-secure-store` bajo la clave `POSTHOG_API_KEY`.
- En el estado del hook `useAuth`, `value` NUNCA se expone — solo se expone `maskedValue`.
- La UI usa `maskedValue` por defecto para visualización enmascarada.
- La clave completa se recupera bajo demanda de SecureStore mediante `getFullApiKey()` para:
  - Toggle de visibilidad (FR-004): el componente puede almacenar el valor en estado local transitorio mientras el toggle está activo.
  - Copia al portapapeles (FR-004a): se lee de SecureStore y se pasa directamente a `Clipboard.setStringAsync()`.
- El valor completo **nunca** se almacena en el estado del hook ni se expone en logs (FR-004b).

---

### ApiKeyState (estado en React — `useAuth` hook)

```typescript
type PostHogCloud = 'us' | 'eu';

interface ApiKeyState {
  hasApiKey: boolean;       // true si existe una clave almacenada en SecureStore
  maskedValue: string | null; // ej: "phx_AbCd...xYzW" — null si no hay clave
  cloudRegion: PostHogCloud; // región cloud activa: 'us' o 'eu'
  isLoading: boolean;       // true durante operaciones async (load, validate, delete)
  error: ApiKeyError | null; // error del último intento de operación
}
```

**Nota**: El hook NO expone el valor completo en el estado. Para obtener la clave completa, el consumidor usa `getFullApiKey()` que retorna una Promise.

---

### ApiKeyError

```typescript
type ApiKeyErrorCode =
  | 'EMPTY'                  // Campo vacío al intentar guardar
  | 'INVALID_FORMAT'          // No cumple el regex /^ph(?:x|c)_[A-Za-z0-9]{10,}$/
  | 'INVALID_KEY'            // PostHog respondió 401
  | 'INSUFFICIENT_PERMISSIONS' // PostHog respondió 403
  | 'NETWORK_ERROR'          // Sin conectividad o timeout (10s)
  | 'SERVER_ERROR'           // PostHog respondió 5xx
  | 'SECURE_STORE_UNAVAILABLE'; // SecureStore no disponible en el dispositivo

interface ApiKeyError {
  code: ApiKeyErrorCode;
  message: string; // Mensaje legible para el usuario (sin detalles técnicos internos)
}
```

---

## Reglas de Validación

| Regla | Condición | Error generado |
|-------|-----------|----------------|
| No vacía | `key.trim().length === 0` | `EMPTY` |
| Formato correcto | No cumple `/^ph(?:x|c)_[A-Za-z0-9]{10,}$/` | `INVALID_FORMAT` |
| Región cloud válida | Valor distinto de `'us' | 'eu'` | `INVALID_FORMAT` |
| Clave válida en PostHog | HTTP 401 de `/api/projects/` | `INVALID_KEY` |
| Permisos suficientes | HTTP 403 de `/api/projects/` | `INSUFFICIENT_PERMISSIONS` |
| Proyectos accesibles | `200 OK` con `results.length === 0` en `/api/projects/` | `INSUFFICIENT_PERMISSIONS` |
| Red disponible | `TimeoutError` / `NetworkError` de `ky` | `NETWORK_ERROR` |
| Servidor disponible | HTTP 5xx de PostHog | `SERVER_ERROR` |
| SecureStore disponible | Error de `SecureStore.setItemAsync` | `SECURE_STORE_UNAVAILABLE` |

**Orden de validación** (fail-fast):
1. Trim automático (FR-010)
2. Validación `EMPTY`
3. Validación `INVALID_FORMAT`
4. Llamada a red → validación `NETWORK_ERROR` / `INVALID_KEY` / `INSUFFICIENT_PERMISSIONS` / `SERVER_ERROR`
5. Almacenamiento → validación `SECURE_STORE_UNAVAILABLE`

---

## Transiciones de Estado

```
[SIN API KEY]
    │
    ▼ storeAndValidate(key) → éxito
[API KEY ALMACENADA Y VALIDADA]
    │
    ├── updateApiKey(newKey) → éxito ──► [API KEY ALMACENADA Y VALIDADA] (clave nueva)
    │
    └── deleteApiKey() → confirmación ──► [SIN API KEY]
```

**Invariantes**:
- Una clave se almacena en SecureStore SOLO si la validación contra `/api/projects/` fue exitosa.
- Si la validación falla, SecureStore no se modifica (la clave anterior, si existe, permanece intacta).
- Si la eliminación es cancelada por el usuario, el estado no cambia.

---

## Lógica de Enmascarado

```typescript
function maskApiKey(value: string): string {
  if (value.length < 12) return '***'; // Caso imposible dada la regex, pero robusto
  return value.slice(0, 8) + '...' + value.slice(-4);
}
```

**Ejemplo**: `phx_AbCdEfGhIjKlMnOpQrStUvWxYz01234567` → `phx_AbCd...4567`

El `maskedValue` se calcula una sola vez al cargar desde SecureStore y se almacena en el estado del hook. El `value` completo se descarta inmediatamente después de enmascarar en la carga inicial.

### Recuperación de clave completa (FR-004, FR-004a, FR-004b)

```typescript
async function getFullApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORE_KEY);
}
```

- Se invoca bajo demanda desde `settings.tsx` para toggle de visibilidad o copia al portapapeles.
- El valor retornado es efímero — el componente puede almacenarlo en estado local transitorio (`revealedKey`) mientras el toggle de visibilidad está activo, y debe limpiarlo explícitamente al desactivar el toggle (`setRevealedKey(null)`).
- Para copia, el valor se pasa directamente a `Clipboard.setStringAsync()` sin almacenamiento intermedio persistente.
- **Restricción FR-004b**: El valor completo NUNCA se almacena en el estado del hook `useAuth` ni se expone en logs.

---

## Constantes

```typescript
const SECURE_STORE_KEY = 'POSTHOG_API_KEY';
const POSTHOG_CLOUD_KEY = 'POSTHOG_CLOUD';
const DEFAULT_POSTHOG_CLOUD = 'us';
const POSTHOG_CLOUD_HOSTS = {
  us: 'https://us.posthog.com',
  eu: 'https://eu.posthog.com',
} as const;
const API_KEY_REGEX = /^ph(?:x|c)_[A-Za-z0-9]{10,}$/;
const VALIDATION_TIMEOUT_MS = 10_000;
```

---

## Mensajes de Error para el Usuario

| Código | Mensaje (UI) |
|--------|-------------|
| `EMPTY` | "Ingresa tu API Key de PostHog para continuar." |
| `INVALID_FORMAT` | "La API Key debe comenzar con 'phx_' (o 'phc_' si es una clave antigua) y contener solo letras y números." |
| `INVALID_KEY` | "La API Key no es válida. Verifica que sea correcta." |
| `INSUFFICIENT_PERMISSIONS` | "Esta API Key no tiene permisos suficientes. Necesita acceso de lectura." |
| `NETWORK_ERROR` | "Sin conexión. Verifica tu red e intenta de nuevo." |
| `SERVER_ERROR` | "Error en los servidores de PostHog. Intenta más tarde." |
| `SECURE_STORE_UNAVAILABLE` | "No es posible guardar la clave de forma segura en este dispositivo." |
