# Implementation Plan: Expo Project Setup

**Branch**: `002-expo-project-setup` | **Date**: 2026-03-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-expo-project-setup/spec.md`

## Summary

Scaffold the `app/PostHogMobile/` project so the existing TypeScript source code in `src/` can be built and run with Expo Go or an emulator. This requires creating `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, and `global.css` with exact versions taken from the project constitution. No application-logic changes are in scope.

## Technical Context

**Language/Version**: TypeScript ~5.9.2  
**Primary Dependencies**: Expo ~54.0.33, React Native 0.81.5, Expo Router ~6.0.23, NativeWind ^4.2.1, Tailwind CSS ^3.4.19  
**Storage**: N/A (this feature creates config files only)  
**Testing**: Manual — `npx expo start` + visual inspection + `npx tsc --noEmit`  
**Target Platform**: iOS + Android (React Native / Expo)  
**Project Type**: mobile-app  
**Performance Goals**: App cold-start under 3 s on mid-range device (Metro bundler concern, not this feature)  
**Constraints**: New Architecture enabled (`newArchEnabled: true`); all libraries must be Fabric/JSI-compatible. Dark-only UI. Portrait-only orientation.  
**Scale/Scope**: Single mobile app, 1 developer per sprint

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| New Architecture (`newArchEnabled: true`) | ✅ PASS | All selected libraries (NativeWind 4, Expo Router 6, expo-haptics, expo-secure-store) are Fabric/JSI-compatible |
| Dark-only UI | ✅ PASS | `tailwind.config.js` will declare dark tokens; `app.json` sets `userInterfaceStyle: "dark"` |
| Security — API Key in SecureStore only | ✅ PASS | No change to auth logic; `expo-secure-store` is a declared dependency |
| HTTPS only | ✅ PASS | `POSTHOG_API_BASE = 'https://app.posthog.com'` already enforced in source |
| Tailwind token names match constitution | ✅ PASS | `background`, `background-tertiary`, `border`, `text-primary`, `primary`, `font-inter` all defined in constitution §4 |
| No class components | ✅ PASS | Source already uses functional components |

**Verdict**: No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-expo-project-setup/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/           ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code

```text
app/PostHogMobile/               ← project root (files to CREATE)
├── package.json                 ← runtime + dev dependencies
├── app.json                     ← Expo config (name, scheme, platforms, newArch)
├── tsconfig.json                ← extends expo/tsconfig.base, strict mode
├── babel.config.js              ← expo preset + NativeWind Babel plugin
├── metro.config.js              ← NativeWind Metro transformer
├── tailwind.config.js           ← content paths, custom colors, fonts
├── global.css                   ← NativeWind entry point (imported in _layout.tsx)
└── src/                         ← EXISTING — no changes to files inside
    ├── app/
    │   ├── _layout.tsx          ← needs `import '../../../global.css';` added (FR-010)
    │   ├── (onboarding)/
    │   └── (tabs)/
    ├── components/
    ├── constants/
    ├── hooks/
    ├── services/
    ├── types/
    └── utils/
```

**Structure Decision**: Single mobile-app project under `app/PostHogMobile/`. All config files live at the project root alongside `src/`.

## Complexity Tracking

No constitution violations to justify.
