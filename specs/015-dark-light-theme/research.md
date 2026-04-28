# Research: Dark / Light / System Theme Selector

**Feature**: 015-dark-light-theme  
**Date**: 2026-03-20

---

## R1: NativeWind v4 Dark Mode Mechanism

**Decision**: Usar `darkMode: "class"` en tailwind.config.js + NativeWind's `useColorScheme()` hook for programmatic control.

**Rationale**:
- NativeWind v4.2.1 (ya instalado) exporta `useColorScheme()` desde `nativewind` con métodos `setColorScheme("light" | "dark" | "system")` y `toggleColorScheme()`.
- Sin `darkMode: "class"` en la config, NativeWind solo soporta el modo `"media"` (read-only, sigue al sistema). Llamar a `setColorScheme()` en modo "media" lanza un error: _"Unable to manually set color scheme without using darkMode: class"_.
- Con `darkMode: "class"`, NativeWind permite control programático completo, y las clases `dark:bg-xxx` se activan según el valor seteado.

**Alternatives Considered**:
- `darkMode: "media"` (default): Soporta solo System mode, no permite selección manual → **Descartado** porque el spec requiere 3 estados.
- Crear un sistema propio de theming con variables CSS: sobreingeniería innecesaria dado que NativeWind ya resuelve esto nativamente → **Descartado**.
- Usar `react-native-css-interop` directamente: NativeWind ya lo envuelve con una API más limpia → **Descartado**.

**Impact**: Cambio en `tailwind.config.js` (añadir `darkMode: "class"`) + todas las clases de color existentes deben convertirse al patrón `bg-light dark:bg-dark`.

---

## R2: Detección del Tema del Sistema

**Decision**: Usar `useColorScheme()` de React Native (re-exportado por NativeWind) + `setColorScheme("system")` de NativeWind para el modo "Sistema".

**Rationale**:
- Cuando NativeWind está en modo `"class"` y se llama `setColorScheme("system")`, internamente escucha los cambios del `Appearance` API de React Native y aplica el tema del dispositivo.
- Esto proporciona reactividad en tiempo real: si el usuario cambia el tema del dispositivo estando la app abierta, el cambio se aplica sin reiniciar (FR-006).
- Requiere que `app.json` use `"userInterfaceStyle": "automatic"` en lugar de `"dark"`, para que React Native reporte correctamente el color scheme del dispositivo.

**Alternatives Considered**:
- `Appearance.getColorScheme()` manual + listener: NativeWind ya hace esto internamente al usar `setColorScheme("system")` → **Descartado** por duplicación.
- Mantener `"userInterfaceStyle": "dark"` en app.json: con este valor el sistema siempre reporta "dark" independientemente del tema real del dispositivo → **Descartado**.

---

## R3: Persistencia de la Preferencia

**Decision**: AsyncStorage con clave `APP_THEME_PREFERENCE`, siguiendo el patrón exacto de `LocaleProvider`.

**Rationale**:
- El proyecto ya usa AsyncStorage para la preferencia de idioma (`APP_LOCALE_PREFERENCE`).
- No contiene datos sensibles (solo "system", "light" o "dark").
- La lectura es asíncrona pero suficientemente rápida para evitar flashes visibles (< 50ms en la mayoría de dispositivos).
- Se valida el valor leído con un guard function (`isSupportedTheme()`) y se usa fallback "system" si es inválido (FR-008).

**Alternatives Considered**:
- MMKV (sincrónico): No está en el stack actual y añadiría una dependencia nueva → **Descartado** por principio de mínima complejidad.
- expo-secure-store: Diseñado para credenciales, no para preferencias UI → **Descartado**.

---

## R4: Prevención de Flash de Tema (FR-009)

**Decision**: Leer la preferencia de AsyncStorage en el ThemeProvider y llamar a `setColorScheme()` de NativeWind antes del primer render significativo. Mientras se carga, mantener un estado `isLoading` que oculta el contenido tras un fondo neutro.

**Rationale**:
- El patrón ya existe en `useAuth` (muestra `ActivityIndicator` mientras carga SecureStore).
- La carga de AsyncStorage es de ~10–50ms, imperceptible en la mayoría de casos.
- NativeWind aplica el color scheme de forma síncrona una vez llamado `setColorScheme()`.
- Como fallback, si la lectura falla, se usa "system" (que aplica el tema del dispositivo → experiencia coherente).

**Alternatives Considered**:
- Splash screen extendido hasta carga de preferencia: Añade complejidad al flujo de `expo-splash-screen` → **Descartado** (la carga es tan rápida que no se justifica).
- Render bloqueante síncrono: No posible con AsyncStorage, y MMKV no está en el stack → **Descartado**.

---

## R5: Paleta de Colores para Modo Claro

**Decision**: Definir colores light como los defaults de Tailwind y envolver los colores dark actuales con el prefijo `dark:`. Los colores light se diseñan con fondos blancos/grises claros, textos oscuros, y bordes sutiles.

**Rationale**:
- NativeWind v4 con `darkMode: "class"` funciona invirtiendo la lógica: los colores base son los del modo light, y los prefijados con `dark:` son los del modo dark.
- La app actual tiene SOLO colores dark definidos como defaults. Se deben mover los colores dark actuales a `dark:` prefixed classes y definir nuevos defaults light.
- Esto aprovecha el modelo CSS estándar de Tailwind (`dark:` variant) y no requiere JavaScript adicional.

**Proposed Light Palette**:

| Token | Dark (actual) | Light (nuevo) | Uso |
|---|---|---|---|
| `background` | `#0D0D0D` | `#FFFFFF` | Fondo base |
| `background.secondary` | `#1A1A1A` | `#F5F5F5` | Cards, modales |
| `background.tertiary` | `#262626` | `#E5E5E5` | Inputs, items |
| `text.primary` | `#FFFFFF` | `#171717` | Texto principal |
| `text.secondary` | `#A3A3A3` | `#525252` | Labels |
| `text.tertiary` | `#737373` | `#737373` | Placeholders (mismo) |
| `border` | `#262626` | `#E5E5E5` | Bordes estándar |
| `border.light` | `#404040` | `#D4D4D4` | Bordes activos |

Los colores de acento (primary, accent.blue, accent.teal, trend) se mantienen iguales en ambos modos.

**Alternatives Considered**:
- CSS custom properties (variables): NativeWind v4 no soporta `var()` de forma nativa en React Native → **Descartado**.
- Paleta completamente nueva: No necesario, solo invertir backgrounds y textos mantiene coherencia → **Descartado**.

---

## R6: Actualización del Selector de UI en Settings

**Decision**: Reemplazar el bloque cosmético de "Dark Mode" (toggle siempre activado) por un selector de tres filas con radio buttons, idéntico en patrón visual al selector de idioma existente.

**Rationale**:
- El selector de idioma ya tiene el UX perfecto: filas con ícono, texto descriptivo, y un indicador radio con gradiente para la opción activa.
- Reutilizar este patrón garantiza consistencia visual y cumple FR-004.
- Cada fila tendrá un ícono distinto: Smartphone (Sistema), Sun (Claro), Moon (Oscuro) de lucide-react-native.

---

## R7: Traducciones i18n

**Decision**: Añadir las siguientes claves a ambos catálogos (es.ts, en.ts) y actualizar el tipo TranslationCatalog.

| Key | es | en |
|---|---|---|
| `settings.themeSection` | `Apariencia` | `Appearance` |
| `settings.themeSystem` | `Sistema` | `System` |
| `settings.themeLight` | `Claro` | `Light` |
| `settings.themeDark` | `Oscuro` | `Dark` |

Se mantiene `settings.darkMode` para backward compatibility (no se usa más en la UI pero no rompe nada).

---

## R8: app.json — userInterfaceStyle

**Decision**: Cambiar `"userInterfaceStyle": "dark"` a `"userInterfaceStyle": "automatic"`.

**Rationale**:
- Con `"dark"`, React Native fuerza el esquema oscuro a nivel de plataforma (status bar, modales nativos, keyboard), y `Appearance.getColorScheme()` siempre devuelve `"dark"`, impidiendo detectar el tema real del sistema.
- Con `"automatic"`, el sistema operativo reporta el color scheme correcto y NativeWind puede reaccionar al cambio en tiempo real.
- La barra de estado, teclado y alertas nativas también se adaptan automáticamente al tema activo.
