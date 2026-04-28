# Contract: PostHog Service — validateApiKey

**Branch**: `001-api-key-screen` | **Phase**: 1 | **Date**: 2026-03-18  
**File**: `app/PostHogMobile/src/services/posthog.ts` (extensión de la función existente)

---

## Propósito

Función del servicio PostHog responsable de verificar que una API Key es válida y tiene acceso al menos a un proyecto en el cloud seleccionado. Es invocada exclusivamente por `useAuth` durante los flujos de guardado y actualización.

---

## Interfaz

```typescript
interface PostHogProjectInfo {
  id: number;
  name: string;
  cloudRegion: 'us' | 'eu';
}

/**
 * Valida una API Key contra la API de PostHog.
 * @param key - Clave ya trimmed y con formato válido (/^ph(?:x|c)_[A-Za-z0-9]{10,}$/)
 * @returns PostHogProjectInfo del primer proyecto accesible con esa clave
 * @throws ApiKeyError con los códigos definidos en data-model.md
 */
type PostHogCloud = 'us' | 'eu'

async function validateApiKey(key: string, cloud: PostHogCloud): Promise<PostHogProjectInfo>
```

---

## Comportamiento

### Petición

```
GET https://<cloud-host>/api/projects/
Authorization: Bearer <key>
Accept: application/json
```

- `cloud-host = us.posthog.com` cuando `cloud = 'us'`
- `cloud-host = eu.posthog.com` cuando `cloud = 'eu'`

- Timeout: 10 segundos (`VALIDATION_TIMEOUT_MS`).
- Sin retry (la validación es una acción de usuario — no debe reintentar silenciosamente).
- La petición usa el cliente `ky` base de `api.ts` pero con el `key` provisto explícitamente (no desde SecureStore, que aún no está guardado en este punto).

### Mapeo de respuestas a errores

| Condición | Error lanzado |
|-----------|---------------|
| `200 OK` | — (retorna el primer `PostHogProjectInfo` accesible) |
| `401 Unauthorized` | `{ code: 'INVALID_KEY', message: '...' }` |
| `403 Forbidden` | `{ code: 'INSUFFICIENT_PERMISSIONS', message: '...' }` |
| `TimeoutError` (ky) | `{ code: 'NETWORK_ERROR', message: '...' }` |
| `HTTPError` 5xx | `{ code: 'SERVER_ERROR', message: '...' }` |
| `TypeError` / `NetworkError` | `{ code: 'NETWORK_ERROR', message: '...' }` |
| `200 OK` sin proyectos accesibles | `{ code: 'INSUFFICIENT_PERMISSIONS', message: '...' }` |

---

## Restricciones

- La función **no** almacena la clave — eso es responsabilidad de `useAuth`.
- La función **no** loguea el valor de la clave — solo loguea el resultado (`success` / `error_code`).
- No usa el cliente autenticado base (que usa la clave guardada en SecureStore), sino que inyecta el `key` como header temporal para evitar race conditions durante el flujo de onboarding.

---

## Firma de implementación sugerida

```typescript
export async function validateApiKey(key: string): Promise<PostHogProjectInfo> {
  try {
    const data = await ky.get(`${POSTHOG_API_BASE}/api/projects/`, {
      headers: { Authorization: `Bearer ${key}` },
      timeout: VALIDATION_TIMEOUT_MS,
      retry: 0,
    }).json<{ results: Array<{ id: number; name: string }> }>();
    if (!data.results.length) {
      throw { code: 'INSUFFICIENT_PERMISSIONS', message: ERRORS.INSUFFICIENT_PERMISSIONS } satisfies ApiKeyError;
    }
    return { id: data.results[0].id, name: data.results[0].name, cloudRegion: cloud };
  } catch (error) {
    if (error instanceof ky.TimeoutError) {
      throw { code: 'NETWORK_ERROR', message: ERRORS.NETWORK_ERROR } satisfies ApiKeyError;
    }
    if (error instanceof ky.HTTPError) {
      if (error.response.status === 401) throw { code: 'INVALID_KEY', message: ERRORS.INVALID_KEY } satisfies ApiKeyError;
      if (error.response.status === 403) throw { code: 'INSUFFICIENT_PERMISSIONS', message: ERRORS.INSUFFICIENT_PERMISSIONS } satisfies ApiKeyError;
      throw { code: 'SERVER_ERROR', message: ERRORS.SERVER_ERROR } satisfies ApiKeyError;
    }
    throw { code: 'NETWORK_ERROR', message: ERRORS.NETWORK_ERROR } satisfies ApiKeyError;
  }
}
```
