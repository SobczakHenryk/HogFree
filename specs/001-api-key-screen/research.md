# Research: Pantalla de API Key

**Branch**: `001-api-key-screen` | **Phase**: 0 | **Date**: 2026-03-18

---

## 1. Endpoint de validación de API Key de PostHog

**Decision**: `GET https://us.posthog.com/api/projects/` o `GET https://eu.posthog.com/api/projects/` según la región cloud seleccionada, con header `Authorization: Bearer <key>`

**Rationale**:
- `GET /api/me/` devuelve `404` para Personal API Keys en los hosts cloud usados por la app, por lo que no sirve como señal de validación.
- `GET /api/projects/` sí responde correctamente con `200` en el cloud correcto y `401` en el cloud incorrecto o con clave inválida.
- La documentación oficial de PostHog indica que los endpoints privados deben llamarse al dominio de la región correcta: `us.posthog.com` para US Cloud y `eu.posthog.com` para EU Cloud.
- Permite validar simultáneamente credencial, región y acceso útil al producto, porque retorna proyectos accesibles.
- El payload es suficientemente pequeño para onboarding y además evita una segunda petición posterior para obtener el proyecto inicial.

**Alternativas consideradas**:
- `GET /api/me/` — descartado tras validación real: responde `404` con Personal API Keys en ambos clouds.
- `GET /api/organizations/` — más amplio que lo necesario para el onboarding.
- Llamada a un insight de prueba — innecesariamente complejo y potencialmente costoso en cuota.

**Mapeo de respuestas a errores de la UI** (FR-006):
| HTTP Status | Causa | Mensaje al usuario |
|-------------|-------|-------------------|
| `200 OK` con proyectos | Clave válida y región correcta | — (navega a pantalla principal) |
| `200 OK` sin proyectos | Clave válida sin acceso útil | "Esta API Key no tiene permisos suficientes. Necesita acceso de lectura." |
| `401 Unauthorized` | Clave inválida o inexistente | "La API Key no es válida. Verifica que sea correcta." |
| `403 Forbidden` | Clave válida pero sin permisos | "Esta API Key no tiene permisos suficientes. Necesita acceso de lectura." |
| Network / Timeout | Sin conectividad o timeout | "Sin conexión. Verifica tu red e intenta de nuevo." |
| `5xx` | Error en servidores PostHog | "Error en los servidores de PostHog. Intenta más tarde." |

---

## 2. Formato de API Key de PostHog

**Decision**: Pre-validación local con regex `/^ph(?:x|c)_[A-Za-z0-9]{10,}$/` antes de llamar a la API.

**Rationale**:
- Las Personal API Keys actuales de PostHog comienzan con el prefijo `phx_`; se mantiene compatibilidad con `phc_` para claves anteriores.
- Longitud mínima razonable: ~44 caracteres en total (prefijo + 40 caracteres base64url).
- Evita peticiones de red innecesarias para entradas claramente incorrectas (FR-006: clave vacía / formato inválido).
- El trim automático (FR-010) se aplica ANTES de la validación de formato.

**Alternativas consideradas**:
- Validar solo longitud mínima — insuficiente, no detecta claves con formato erróneo.
- No pre-validar, dejar todo a la API — mala UX: requiere red para detectar errores locales obvios.

---

## 2.1 Selección de región cloud

**Decision**: El flujo de onboarding y el flujo de actualización en Settings incluyen un selector explícito con dos opciones: `US Cloud` y `EU Cloud`.

**Rationale**:
- PostHog requiere usar el dominio privado correcto para cada región cloud.
- La API Key por sí sola no permite inferir de forma confiable la región antes de intentar la validación.
- Un selector explícito evita heurísticas frágiles y reduce ambigüedad para el usuario.
- La región debe persistirse junto con la API Key para que el dashboard use el mismo hostname en todas las llamadas posteriores.

---

## 3. Formato de máscara para visualización (FR-004) y recuperación de clave completa (FR-004a/FR-004b)

**Decision**: `maskApiKey(key: string): string` → `key.slice(0, 8) + '...' + key.slice(-4)` para display por defecto. Clave completa recuperable bajo demanda de SecureStore mediante `getFullApiKey()`.

**Rationale**:
- La spec (US-2 actualizado) indica que la clave se muestra enmascarada **por defecto** (primeros 8 y últimos 4 caracteres visibles), con toggle para revelar la clave completa.
- `slice(0, 8)` captura `phx_` (prefijo fijo de 4 chars) + los primeros 4 chars del token, coherente con el ejemplo de la spec.
- `slice(-4)` muestra los últimos 4 chars del token como identificador visual.
- El cuerpo central se reemplaza con `...` (no asteriscos), siguiendo el ejemplo de la spec.
- Para la clave completa (FR-004a, FR-004b): se lee directamente de SecureStore vía `getFullApiKey()`. El valor nunca se almacena en el estado del hook — solo transitoriamente en el componente consumidor.
- Para claves < 12 caracteres (imposible por la regex, pero por robustez): retornar `'***'`.

**Alternativas consideradas**:
- Solo `phx_...abcd` (8 chars total visibles) — podría ser ambiguo si el usuario tiene varias claves; 12 chars ofrecen más contexto.
- Usar asteriscos (`*****`) — la spec usa puntos (`...`) en el ejemplo mostrado.
- Almacenar la clave completa en el estado del hook para facilitar toggle/copia — descartado por FR-004b (prohibición explícita de almacenar en estado de React).

---

## 4. Patrón de auth guard con Expo Router (Onboarding vs Tabs)

**Decision**: `useSegments` + `useRouter` en `app/_layout.tsx` raíz, con efecto que redirige según `hasApiKey`.

**Rationale**:
- Patrón oficial documentado por Expo Router para authentication flows.
- `useAuth().hasApiKey` es booleano reactivo que cambia cuando se guarda o elimina la clave.
- El effect en `_layout.tsx` detecta el cambio y redirige inmediatamente (`router.replace`):
  - `false` → `/(onboarding)/api-key`
  - `true` → `/(tabs)/`
- Grupo `(onboarding)` sin header/tabs para pantalla limpia de primer uso.
- `router.replace` (no `push`) para que el usuario no pueda volver atrás con el gesto de back una vez autenticado.

**Alternativas consideradas**:
- Middleware de Expo Router — disponible pero más complejo; el patrón `useSegments` es suficiente para una sola condición de autenticación.
- `expo-router/Stack` condicional — genera parpadeos (flash) en el montaje inicial.

---

## 5. Testing framework

**Decision**: Jest + `jest-expo` preset + `@testing-library/react-native`

**Rationale**:
- Stack de testing estándar y oficial para proyectos Expo. No está explícitamente en la constitución, pero es el default de `create-expo-app` y el recomendado en la documentación de Expo.
- `jest-expo` incluye transformaciones para RN, soporte de módulos nativos con mocks, y configuración de New Architecture.
- `@testing-library/react-native` permite tests centrados en comportamiento del usuario (render + eventos), alineado con los acceptance scenarios del spec.
- `expo-secure-store` debe mockearse en tests unitarios (no disponible en entorno Jest).

**Alternativas consideradas**:
- Detox (E2E) — complementario, no reemplaza tests unitarios. Fuera del alcance de esta feature.
- Vitest — no tiene soporte nativo para React Native transforms todavía.

---

## 6. expo-secure-store y New Architecture

**Decision**: `expo-secure-store` ^15.0.8 es plenamente compatible con New Architecture (Fabric / JSI).

**Rationale**:
- A partir de `expo-secure-store` v14, el módulo fue reescrito para soportar la New Architecture de React Native.
- La versión `^15.0.8` (especificada en la constitución) incluye soporte completo para Fabric y JSI.
- No requiere configuraciones adicionales en `app.json`; funciona con `newArchEnabled: true` out of the box.
- `SecureStore.setItemAsync`, `getItemAsync` y `deleteItemAsync` son las APIs a usar.

**Consideraciones adicionales**:
- `SecureStore` tiene un límite de ~2048 bytes por item en iOS Keychain — las API Keys de PostHog (~44 chars) están muy por debajo del límite.
- En dispositivos sin passcode configurado (iOS) o sin pantalla de bloqueo (Android), `SecureStore` puede fallar con error. Se debe capturar y mostrar el edge case correspondiente (spec §Edge Cases, FR-003).

---

## 7. Manejo del timeout de red

**Decision**: Configurar `timeout: 10000` (10 segundos) en el cliente `ky` para la petición de validación.

**Rationale**:
- La spec menciona: "La petición debe hacer timeout con un mensaje claro al usuario."
- 10 segundos es un valor conservador razonable para una petición de autenticación en móvil.
- `ky` soporta `timeout` nativo — se configura una instancia específica para la validación (o se usa el default del cliente base).
- Al recibir `TimeoutError` de `ky`, se muestra el mensaje de error de red al usuario.

**Alternativas consideradas**:
- 5 segundos — demasiado corto para redes móviles lentas (3G, WiFi débil).
- 30 segundos — demasiado largo; degrada la percepción de la app si hay problemas de red.

---

## Resolución de incógnitas

| Incógnita | Estado | Resolución |
|-----------|--------|------------|
| Testing framework | ✅ Resuelto | Jest + jest-expo + @testing-library/react-native |
| Endpoint de validación PostHog | ✅ Resuelto | `GET /api/projects/` |
| expo-secure-store en New Architecture | ✅ Resuelto | Compatible desde v14, no requiere config extra |
| Formato de máscara | ✅ Resuelto | `slice(0,8) + '...' + slice(-4)` |
| Auth guard con Expo Router | ✅ Resuelto | `useSegments` + `useRouter` en `_layout.tsx` raíz |
| Timeout de red | ✅ Resuelto | 10 segundos con `TimeoutError` de `ky` |
