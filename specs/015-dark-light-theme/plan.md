# Implementation Plan: Dark / Light / System Theme Selector

**Branch**: `015-dark-light-theme` | **Date**: 2026-03-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/015-dark-light-theme/spec.md`

## Summary

Reemplazar el toggle cosmético de "Dark Mode" en Settings por un selector funcional de tres estados (Sistema / Claro / Oscuro) que aplica el tema en tiempo real a toda la interfaz. Se implementa con NativeWind v4 `useColorScheme` (modo `darkMode: "class"`), un `ThemeProvider` siguiendo el patrón de `LocaleProvider`, persistencia en AsyncStorage, y una paleta de colores claros definida con clases `dark:` de Tailwind.

## Technical Context

**Language/Version**: TypeScript ~5.9.2, React 19.1.0, React Native 0.81.5  
**Primary Dependencies**: NativeWind 4.2.1 (con `useColorScheme`), Expo ~54.0.33, Expo Router ~6.0.23, AsyncStorage  
**Storage**: AsyncStorage (clave `APP_THEME_PREFERENCE`) para persistencia de preferencia  
**Testing**: Manual en dispositivo/emulador (sin framework de test unitario configurado actualmente)  
**Target Platform**: iOS + Android (portrait, New Architecture habilitada)  
**Project Type**: Mobile app (React Native / Expo)  
**Performance Goals**: Cambio de tema < 300 ms, sin parpadeo al abrir la app  
**Constraints**: Offline-capable, carga de preferencia antes del primer render  
**Scale/Scope**: ~6 pantallas afectadas (onboarding, dashboard, settings, chart detail, edit chart, tabs)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla de Constitution | Estado | Notas |
|---|---|---|
| §4.1 "Dark only. No hay modo claro." | ⚠️ **VIOLACIÓN JUSTIFICADA** | El spec solicita explícitamente agregar modo claro. La constitución debe actualizarse post-feature. |
| §8 `userInterfaceStyle: "dark"` forzado | ⚠️ **VIOLACIÓN JUSTIFICADA** | Debe cambiar a `"automatic"` para permitir que el sistema reporte el colorScheme correcto. |
| §2.2 NativeWind como sistema de estilos | ✅ Cumple | Se usa `dark:` variant classes de NativeWind/Tailwind. |
| §3.2 Datos a través de hooks | ✅ Cumple | ThemeProvider expone `useTheme()` hook. |
| §3.4 AsyncStorage para persistencia no sensible | ✅ Cumple | Preferencia de tema en AsyncStorage. |
| §4.6 Pressable + expo-haptics | ✅ Cumple | Selector usa Pressable con haptics Light. |
| §5.2 Componentes funcionales + NativeWind | ✅ Cumple | Todo hooks y className. |
| §5.3 Custom hooks en src/hooks/ | ✅ Cumple | `useTheme` exportado desde hooks/index.ts. |
| §6 No datos sensibles en AsyncStorage | ✅ Cumple | Solo se guarda "system" | "light" | "dark". |

### Constitution Violation Justification

La constitución dice "Dark only. No hay modo claro" (§4.1). Esta feature existe precisamente para cambiar esa política. La violación es intencional y solicitada por el usuario. La constitución se actualizará para reflejar el soporte de tres modos tras completar el feature.

## Project Structure

### Documentation (this feature)

```text
specs/015-dark-light-theme/
├── plan.md              # This file
├── research.md          # Phase 0: investigación de NativeWind dark mode
├── data-model.md        # Phase 1: entidades y tipos
├── quickstart.md        # Phase 1: guía rápida de arranque
├── contracts/
│   └── useTheme.md      # Interface pública del hook useTheme
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
app/PostHogMobile/
├── app.json                          # userInterfaceStyle: "dark" → "automatic"
├── tailwind.config.js                # + darkMode: "class", + paleta light
├── src/
│   ├── app/
│   │   ├── _layout.tsx               # + ThemeProvider en composición de providers
│   │   └── (tabs)/
│   │       └── settings.tsx           # Reemplazar toggle cosmético → selector 3 estados
│   ├── hooks/
│   │   ├── useTheme.tsx              # NUEVO: ThemeProvider + useTheme hook
│   │   └── index.ts                  # + export ThemeProvider, useTheme
│   └── i18n/
│       ├── locales/
│       │   ├── es.ts                  # + traducciones tema (themeSection, themeSystem, etc.)
│       │   └── en.ts                  # + traducciones tema
│       └── types.ts                   # + TranslationKey para theme strings
```

**Structure Decision**: Se sigue la estructura existente. El ThemeProvider se ubica en `hooks/useTheme.tsx` siguiendo el patrón de `useAuth.tsx`. No se crean nuevas carpetas ni capas de abstracción.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution §4.1 "Dark only" | Feature solicitado explícitamente por el usuario | N/A — es el propósito del feature |
| `app.json` userInterfaceStyle change | Necesario para que `useColorScheme` de RN reporte el tema del sistema correctamente | Sin esto, el dispositivo siempre reporta "dark" |
