# Quickstart: Pantalla de API Key

**Branch**: `001-api-key-screen` | **Phase**: 1 | **Date**: 2026-03-18

Guía de implementación para el desarrollador. Sigue el orden de las secciones para un desarrollo sin bloqueos.

---

## Prerrequisitos

- Proyecto Expo inicializado con la estructura definida en la constitución (`app/PostHogMobile/`).
- `expo-secure-store` ^15.0.8 instalado.
- `ky` ^1.14.3 instalado.
- `expo-haptics` ^15.0.8 instalado.
- NativeWind ^4.2.1 configurado con los tokens de diseño de `theme.ts`.

---

## Paso 1: Constantes y tipos base

**Archivos**: `src/constants/index.ts`, `src/types/index.ts`

```typescript
// src/constants/index.ts (agregar)
export const SECURE_STORE_KEY = 'POSTHOG_API_KEY';
export const POSTHOG_CLOUD_KEY = 'POSTHOG_CLOUD';
export const DEFAULT_POSTHOG_CLOUD = 'us';
export const POSTHOG_CLOUD_HOSTS = {
  us: 'https://us.posthog.com',
  eu: 'https://eu.posthog.com',
} as const;
export const API_KEY_REGEX = /^ph(?:x|c)_[A-Za-z0-9]{10,}$/;
export const VALIDATION_TIMEOUT_MS = 10_000;

export const API_KEY_ERRORS = {
  EMPTY: "Ingresa tu API Key de PostHog para continuar.",
  INVALID_FORMAT: "La API Key debe comenzar con 'phx_' (o 'phc_' si es una clave antigua) y contener solo letras y números.",
  INVALID_KEY: "La API Key no es válida. Verifica que sea correcta.",
  INSUFFICIENT_PERMISSIONS: "Esta API Key no tiene permisos suficientes. Necesita acceso de lectura.",
  NETWORK_ERROR: "Sin conexión. Verifica tu red e intenta de nuevo.",
  SERVER_ERROR: "Error en los servidores de PostHog. Intenta más tarde.",
  SECURE_STORE_UNAVAILABLE: "No es posible guardar la clave de forma segura en este dispositivo.",
} as const;
```

```typescript
// src/types/index.ts (agregar)
export type ApiKeyErrorCode =
  | 'EMPTY'
  | 'INVALID_FORMAT'
  | 'INVALID_KEY'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'SECURE_STORE_UNAVAILABLE';

export interface ApiKeyError {
  code: ApiKeyErrorCode;
  message: string;
}
```

---

## Paso 2: Util de enmascarado

**Archivo**: `src/utils/apiKey.ts` (nuevo)

```typescript
export function maskApiKey(value: string): string {
  if (value.length < 12) return '***';
  return value.slice(0, 8) + '...' + value.slice(-4);
}
```

> **Tests**: Verificar que `phx_AbCdEfGhIjKlMnOpQrSt` → `phx_AbCd...rSt`.

---

## Paso 3: Servicio `posthog.ts` — función `validateApiKey`

**Archivo**: `src/services/posthog.ts` (agregar función)

Ver contrato completo en `contracts/posthog-service.md`. Puntos clave:
- Usa `ky.get('/api/projects/')` con header `Authorization: Bearer <key>`.
- `retry: 0` — sin reintentos automáticos.
- `timeout: VALIDATION_TIMEOUT_MS` (10s).
- Mapea `TimeoutError`, `HTTPError 401/403/5xx` → `ApiKeyError`.

---

## Paso 4: Hook `useAuth`

**Archivo**: `src/hooks/useAuth.ts` (nuevo)

Ver contrato completo en `contracts/useAuth.md`. Skeleton de implementación:

```typescript
export function useAuth() {
  const [state, setState] = useState<ApiKeyState>({
    hasApiKey: false,
    maskedValue: null,
    cloudRegion: 'us',
    isLoading: true, // true en el load inicial
    error: null,
  });

  // Carga inicial desde SecureStore
  useEffect(() => {
    SecureStore.getItemAsync(SECURE_STORE_KEY)
      .then(value => {
        if (value) {
          setState({ hasApiKey: true, maskedValue: maskApiKey(value), isLoading: false, error: null });
        } else {
          setState(s => ({ ...s, hasApiKey: false, isLoading: false }));
        }
      })
      .catch(() => setState(s => ({ ...s, isLoading: false })));
  }, []);

  const validateAndStore = useCallback(async (key: string, cloudRegion: PostHogCloud) => {
    // 1. Trim
    // 2. Validar formato + región
    // 3. Llamar validateApiKey(trimmedKey, cloudRegion)
    // 4. SecureStore.setItemAsync para key y cloud
    // 5. Actualizar estado
  }, []);

  // ... updateApiKey, deleteApiKey, clearError

  return { ...state, validateAndStore, updateApiKey, deleteApiKey, clearError };
}
```

**Exportar desde `src/hooks/index.ts`**.

---

## Paso 5: Componente `ApiKeyField`

**Archivo**: `src/components/ApiKeyField.tsx` (nuevo)

Input de contraseña con:
- `secureTextEntry={true}` — oculta caracteres mientras se escribe (FR-005).
- Toggle opcional para mostrar/ocultar (con ícono de ojo de `@expo/vector-icons`).
- Estilos NativeWind: `bg-background-tertiary rounded-lg px-md py-sm text-base font-inter text-text-primary`.
- `autoCorrect={false}`, `autoCapitalize="none"`, `spellCheck={false}`.
- Prop `value`, `onChangeText`, `placeholder`, `editable`.

## Paso 5.1: Componente `CloudRegionSelector`

**Archivo**: `src/components/CloudRegionSelector.tsx` (nuevo)

Selector segmentado con dos opciones:
- `US Cloud`
- `EU Cloud`

Props:
- `value: PostHogCloud`
- `onChange: (next: PostHogCloud) => void`
- `disabled?: boolean`

---

## Paso 6: Auth Guard en `_layout.tsx` raíz

**Archivo**: `src/app/_layout.tsx`

```typescript
export default function RootLayout() {
  const { hasApiKey, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Esperar carga inicial de SecureStore

    const inOnboarding = segments[0] === '(onboarding)';

    if (!hasApiKey && !inOnboarding) {
      router.replace('/(onboarding)/api-key');
    } else if (hasApiKey && inOnboarding) {
      router.replace('/(tabs)/');
    }
  }, [hasApiKey, isLoading, segments]);

  if (isLoading) return <SplashScreen />;

  return <Stack />;
}
```

> **Nota**: `useAuth()` debe ser llamado desde un Provider o directamente en el layout raíz, no desde un componente hijo del `Stack`.

---

## Paso 7: Pantalla `(onboarding)/api-key.tsx`

**Propósito**: US-1 — Ingreso inicial de API Key.

Elementos de UI:
- Logo de PostHog + título "Conecta tu cuenta PostHog".
- Descripción breve del propósito de la API Key.
- `ApiKeyField` para ingreso.
- `CloudRegionSelector` arriba del campo para elegir `US Cloud` o `EU Cloud`.
- Botón "Guardar" — llama `useAuth().validateAndStore(key)`.
- `ActivityIndicator` mientras `isLoading`.
- Mensaje de error debajo del campo si `error !== null`.

**Comportamiento**:
- Campo vacío por defecto (FR-009: nunca pre-relleno).
- Haptic `Medium` al éxito (confirmación), `Light` al mostrar error.
- Al éxito, el redirect a `/(tabs)/` ocurre automáticamente vía el auth guard del paso 6.

---

## Paso 8: Sección API Key en `(tabs)/settings.tsx`

**Propósito**: US-2/3/4 — Visualización enmascarada con toggle de visibilidad, copia al portapapeles, update y delete.

Elementos de UI:
- Card con `maskedValue` (ej: `phx_AbCd...xYzW`) por defecto — solo texto, no campo editable.
- Botón de visibilidad (ojo): alterna entre `maskedValue` y la clave completa (obtenida de `getFullApiKey()`).
- Botón de copia: copia la clave **completa** (no la enmascarada) al portapapeles usando `expo-clipboard`.
- Texto con la región cloud activa (`US Cloud` o `EU Cloud`).
- Botón "Cambiar API Key" — abre un modal o inline form con `CloudRegionSelector` y `ApiKeyField` vacío; llama `updateApiKey(newKey, cloudRegion)`.
- Botón "Eliminar API Key" (rojo) — muestra diálogo de confirmación con `Alert.alert` nativo; al confirmar llama `deleteApiKey()`.
- Haptic `Heavy` antes de mostrar el diálogo de eliminación.

**Comportamiento de visibilidad (FR-004, FR-004a, FR-004b)**:
- Estado local `showApiKey` (booleano) controla si se muestra la clave completa o enmascarada.
- Estado local `revealedKey` (`string | null`) almacena transitoriamente la clave completa mientras el toggle está activo.
- Al activar toggle: `const fullKey = await getFullApiKey(); setRevealedKey(fullKey); setShowApiKey(true);`
- Al desactivar toggle: `setShowApiKey(false); setRevealedKey(null);` — la clave completa se descarta.
- El botón de copia llama `getFullApiKey()` directamente y pasa el valor a `Clipboard.setStringAsync()`.
- Confirmación visual: cambio de color del ícono de copia + haptic `Light`.

**Comportamiento de seguridad**:
- `revealedKey` es estado local del componente, NO del hook `useAuth` — cumple FR-004b.
- Al desmontar settings.tsx o navegar a otra pantalla, `revealedKey` se descarta automáticamente.
- `selectable={false}` en el texto de la clave visually prevents accidental selection.
- El campo de edición aparece vacío (FR-009: no pre-relleno con clave actual).
- Al eliminar y confirmar, el redirect a `/(onboarding)/api-key` ocurre automáticamente vía auth guard.

---

## Flujo de datos completo

```
Usuario escribe key
    │
    ▼
ApiKeyField (componente)
    │ onChangeText
    ▼
Estado local del screen
    │ onPress "Guardar"
    ▼
useAuth.validateAndStore(key)
    │ trim + validate format
    │ posthog.validateApiKey(key) → GET /api/projects/
    │ SecureStore.setItemAsync(key)
    ▼
Estado: hasApiKey=true, maskedValue="phx_..."
    │
    ▼
_layout.tsx auth guard → router.replace('/(tabs)/')
```

---

## Testing

### Casos de test prioritarios

| Scenario | Tipo | Prioridad |
|----------|------|-----------|
| `maskApiKey` retorna formato correcto | Unit | P0 |
| `validateAndStore` con campo vacío → error `EMPTY` | Unit | P0 |
| `validateAndStore` con formato inválido → error `INVALID_FORMAT` | Unit | P0 |
| `validateAndStore` con 401 de API → error `INVALID_KEY` | Unit (mock ky) | P0 |
| `validateAndStore` con 403 de API → error `INSUFFICIENT_PERMISSIONS` | Unit (mock ky) | P1 |
| `validateAndStore` con timeout → error `NETWORK_ERROR` | Unit (mock ky) | P1 |
| `validateAndStore` exitoso → `hasApiKey = true`, `maskedValue` correcto | Unit | P0 |
| `getFullApiKey` retorna clave completa de SecureStore | Unit | P0 |
| `getFullApiKey` retorna `null` si no hay clave | Unit | P1 |
| `deleteApiKey` → `hasApiKey = false`, `maskedValue = null` | Unit | P1 |
| Toggle visibilidad muestra clave completa | Component test | P1 |
| Copia al portapapeles copia clave completa (no enmascarada) | Component test | P1 |
| Pantalla onboarding renderiza sin pre-relleno | Component test | P1 |
| Auth guard redirige correctamente según `hasApiKey` | Integration | P1 |

### Setup de mocks

```typescript
// __mocks__/expo-secure-store.ts
const store = new Map<string, string>();
export const setItemAsync = jest.fn((key, value) => { store.set(key, value); return Promise.resolve(); });
export const getItemAsync = jest.fn((key) => Promise.resolve(store.get(key) ?? null));
export const deleteItemAsync = jest.fn((key) => { store.delete(key); return Promise.resolve(); });
```

---

## Checklist de implementación

- [x] Constantes y tipos base definidos
- [x] `maskApiKey` util creada y testeada
- [x] `validateApiKey` en `posthog.ts` implementada y testeada
- [x] `useAuth` hook implementado con todos los estados y operaciones
- [x] `ApiKeyField` componente creado con `secureTextEntry`
- [x] Auth guard en `_layout.tsx` raíz funcionando
- [x] Pantalla `(onboarding)/api-key.tsx` completa (US-1)
- [x] Sección de settings con display enmascarado, update y delete (US-2/3/4)
- [x] Mensajes de error diferenciados implementados (FR-006)
- [x] Trim automático antes de validar (FR-010)
- [x] Haptic feedback en acciones clave
- [ ] Tests de `useAuth` con mocks de SecureStore y `ky` *(fuera del alcance de esta implementación — pendiente)*
- [x] Constitution Check re-validado post-implementación (ver `plan.md`)
