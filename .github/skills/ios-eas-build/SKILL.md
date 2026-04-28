---
name: ios-eas-build
description: "Guía operativa completa para compilar la app iOS de PostHogMobile con EAS Build y enviarla a TestFlight. Incluye credenciales de cuenta Apple, diagnóstico de errores conocidos y pasos de submit. Usar cuando el usuario pida generar el IPA, hacer build iOS, subir a TestFlight, o publicar en App Store."
---

# PostHogMobile — iOS Build con EAS + TestFlight

## Cuándo usar esta skill

- Generar un nuevo build de iOS (IPA) para producción
- Subir una versión a TestFlight
- Diagnosticar fallos del build en EAS
- Incrementar el build number para una nueva release

## No usar cuando

- El build es solo para simulador (usar perfil `development`)
- La tarea es solo desarrollo local con Expo Go

---

## Datos de cuenta Apple (PostHogMobile)

| Campo | Valor |
|-------|-------|
| Apple ID | `sobczak.vnzla@gmail.com` |
| Team ID | `Y68354S5WA` |
| Team Name | Henryk Sobczak (Individual) |
| Bundle ID | `com.posthogmobile.app` |
| ASC App ID | `PENDIENTE — crear app en App Store Connect` |
| Provisioning Profile | `PENDIENTE — se genera automáticamente vía EAS` |
| Distribution Certificate Serial | `PENDIENTE — se genera automáticamente vía EAS` |
| EAS user | `veneshooter` |
| EAS Project ID | `PENDIENTE — obtener con \`eas init\`` |
| App Store Connect | `PENDIENTE — disponible al crear la app en ASC` |

> **Primer uso**: antes de lanzar el primer build, ejecutar `eas init` desde el directorio del proyecto para vincular con EAS y obtener el Project ID. Luego añadirlo en `app.json` bajo `expo.extra.eas.projectId`.

---

## Directorio de trabajo

Todos los comandos EAS deben ejecutarse desde:
```
C:\hog\app\PostHogMobile
```

```powershell
cd C:\hog\app\PostHogMobile
```

> **Sin monorepo**: este proyecto es standalone (no hay workspace raíz). Los servidores EAS ejecutan `npm ci` directamente desde la raíz del proyecto.

---

## Flujo completo: Build + TestFlight

### Paso 0 — Primer setup (solo una vez)

Si es la primera vez que se configura EAS para este proyecto:

```powershell
cd C:\hog\app\PostHogMobile
eas init
# Vincula el proyecto con EAS y genera el Project ID
```

Luego actualizar `app.json` con el Project ID generado:
```json
"extra": {
  "eas": {
    "projectId": "<ID_GENERADO_POR_EAS_INIT>"
  }
}
```

---

### Paso 1 — Preflight manual (OBLIGATORIO)

Antes de lanzar el build, verificar manualmente:

```powershell
cd C:\hog\app\PostHogMobile

# 1. Verificar autenticación EAS
eas whoami
# Debe mostrar: veneshooter

# 2. Verificar que la rama está al día
git status
git log --oneline -3

# 3. Verificar que no hay conflictos en package.json
cat package.json | Select-String "overrides"

# 4. Correr expo-doctor para detectar problemas conocidos
npx expo-doctor
```

Si cualquier check falla, **NO lances `eas build`** — cada intento fallido desperdicia ~3 horas de cola.

---

### Paso 2 — Verificar autenticación EAS

```powershell
eas whoami
# Debe mostrar: veneshooter
```

Si no está autenticado:
```powershell
eas login
# Email: sobczak.vnzla@gmail.com
```

---

### Paso 3 — Lanzar build en EAS (producción)

> EAS clona la **rama actual** (`git branch --show-current`). Verificar que está en la rama correcta y actualizada con `origin` antes de buildear.

```powershell
eas build --platform ios --profile production --non-interactive 2>&1
```

EAS hace automáticamente:
- Incrementa el `buildNumber` (configurado con `autoIncrement: true`)
- Usa el `Distribution Certificate` y `Provisioning Profile` almacenados en servidores EAS
- Comprime y sube el proyecto (~126 MB)
- Compila en servidores Apple Silicon de Expo

Al finalizar muestra:
```
✔ Build finished
🍏 iOS app: https://expo.dev/artifacts/eas/...ipa
```

> El build tarda ~15-30 min en cola free tier. Para builds prioritarios: https://expo.dev/accounts/veneshooter/settings/billing

---

### Paso 4 — Enviar a TestFlight

Con el **Build ID** del paso anterior (formato UUID):

```powershell
eas submit --platform ios --profile production --id <BUILD_ID> --non-interactive 2>&1
```

Al finalizar muestra:
```
✔ Submitted your app to Apple App Store Connect!
Your binary has been successfully uploaded to App Store Connect!
```

Apple procesa el binario en ~5-10 minutos y envía email a `sobczak.vnzla@gmail.com`.

---

### Paso 5 — Verificar en TestFlight

`PENDIENTE — disponible una vez creada la app en App Store Connect`

---

## Atajo: Build + Submit en un solo comando

Si se quiere hacer build y submit automáticamente en una sola operación:

```powershell
eas build --platform ios --profile production --auto-submit --non-interactive 2>&1
```

Esto dispara el build y al terminar lo envía directamente a TestFlight sin necesidad del Paso 4.

---

## Configuración en eas.json (referencia)

```json
"build": {
  "development": {
    "developmentClient": true,
    "distribution": "internal"
  },
  "preview": {
    "distribution": "internal",
    "ios": {
      "resourceClass": "m-medium"
    }
  },
  "production": {
    "ios": {
      "resourceClass": "m-medium",
      "autoIncrement": true
    }
  }
},
"submit": {
  "production": {
    "ios": {
      "appleId": "sobczak.vnzla@gmail.com",
      "ascAppId": "PENDIENTE",
      "appleTeamId": "Y68354S5WA"
    }
  }
}
```

> Actualizar `ascAppId` una vez creada la app en App Store Connect.

---

## ⚠️ REGLA OBLIGATORIA: Variables de entorno en builds EAS

> **Aplica SIEMPRE que se agregue una secret key usada en código nativo (React Native / Expo).**

### Por qué existe esta regla

Metro bundler inlinea `process.env.EXPO_PUBLIC_*` **en tiempo de compilación**. EAS Build corre en la nube y **solo carga automáticamente** los archivos `.env`, `.env.local`, `.env.production`, `.env.production.local`. Cualquier otro nombre **es ignorado** → la variable queda como string vacío `''` → la key no funciona en el IPA generado.

---

### Protocolo cuando se agrega una nueva secret key nativa

#### Paso 1 — Registrar la secret en EAS (una sola vez por key)

> ⚠️ `eas secret:create` está **deprecado**. Usar el nuevo comando:

```powershell
cd C:\hog\app\PostHogMobile
eas env:create --scope project --name NOMBRE_DE_LA_VARIABLE --value "el_valor_real" --type secret
```

Verificar que quedó registrada:
```powershell
eas env:list
```

#### Paso 2 — Referenciarla en `eas.json` bajo los perfiles que la necesiten

```json
"preview": {
  "env": {
    "NOMBRE_DE_LA_VARIABLE": "SECRET:NOMBRE_DE_LA_VARIABLE"
  }
},
"production": {
  "env": {
    "NOMBRE_DE_LA_VARIABLE": "SECRET:NOMBRE_DE_LA_VARIABLE"
  }
}
```

> La sintaxis `"SECRET:NOMBRE"` le dice a EAS que resuelva el valor desde las secrets del proyecto, no desde el repositorio.

#### Paso 3 — Verificar en código que se usa `process.env.EXPO_PUBLIC_*`

- El prefijo `EXPO_PUBLIC_` es obligatorio para que Metro lo inline en el bundle nativo.
- Variables sin ese prefijo solo están disponibles en Node/servidores, nunca en el cliente RN.

#### Keys actualmente registradas como EAS Secrets

| Variable | Usado en | Registrado |
|---|---|---|
| _(ninguna aún)_ | — | — |

> Actualizar esta tabla cada vez que se agrega una nueva secret.

---

## Errores conocidos y soluciones

### Error: build falla en fase "Bundle JavaScript" sin mensaje claro

1. Ir a los logs del build en el dashboard de EAS
2. Buscar la fase "Bundle JavaScript" y expandir el output
3. El error real estará ahí (Metro suele ocultar detalles en el output truncado del CLI)

---

### Error: `npm ci` falla en EAS — `engines` node version incompatible

**Síntoma:** Falla en fase "Install dependencies" sin mensaje claro.

**Causa:** Correr `npm install` localmente puede actualizar `package-lock.json` agregando paquetes con restricciones de engine que los servidores EAS no cumplen.

**Solución:** Revertir el `package-lock.json` al último commit funcional antes de lanzar el build:
```powershell
git checkout HEAD -- package-lock.json
```

---

### Error: `npm error code EOVERRIDE` — overrides vs direct dependency

**Síntoma:**
```
npm error code EOVERRIDE
npm error Override for <package> conflicts with direct dependency
```

**Causa:** npm 10 rechaza un `overrides` cuyo target está también en `dependencies`/`devDependencies` del mismo `package.json`.

**Solución:** Eliminar del `dependencies` (no del `overrides`) el paquete duplicado. La versión correcta queda pinned por el override.

---

### Error: plugin de Expo sin `app.plugin.js`

**Síntoma:**
```
PluginError: Unable to resolve a valid config plugin for <package>.
No "app.plugin.js" file found in <package>
```

**Solución:** Eliminar `"<package>"` del array `plugins` en `app.json`. Si la funcionalidad se configura vía `infoPlist` u otras claves de `app.json`, el plugin no es necesario.

---

### Build en cola muy larga (free tier)

El free tier puede tardar hasta 45 min en cola. Alternativas:
- Esperar (recomendado para producción)
- Actualizar a paid plan: https://expo.dev/accounts/veneshooter/settings/billing

---

## Seguimiento de builds

| Recurso | URL |
|---------|-----|
| Dashboard de builds | https://expo.dev/accounts/veneshooter/projects/posthog-mobile/builds |
| Dashboard de submissions | https://expo.dev/accounts/veneshooter/projects/posthog-mobile/submissions |
| TestFlight | `PENDIENTE — disponible al crear la app en ASC` |

---

## Historial de builds conocidos

| Build ID | Build # | Resultado | Notas |
|----------|---------|-----------|-------|
| _(ninguno aún)_ | — | — | — |

> Actualizar esta tabla después de cada build.
