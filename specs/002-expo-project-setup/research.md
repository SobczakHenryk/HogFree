# Research: Expo Project Setup

**Branch**: `002-expo-project-setup`
**Date**: 2026-03-18
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## R-001: Exact Dependency Versions

**Question**: Which exact versions should be pinned in `package.json`?

**Decision**: Use the versions declared in the project constitution (`.specify/memory/constitution.md` §2).

**Rationale**: The constitution is the single source of truth for the tech stack and was built with mutual compatibility in mind (e.g., NativeWind 4 + Tailwind 3 peer dependency, expo-secure-store matching Expo SDK 54).

| Package | Version | Category |
|---------|---------|----------|
| `expo` | `~54.0.33` | runtime |
| `react` | `19.1.0` | runtime |
| `react-native` | `0.81.5` | runtime |
| `expo-router` | `~6.0.23` | runtime |
| `expo-haptics` | `^15.0.8` | runtime |
| `expo-secure-store` | `^15.0.8` | runtime |
| `expo-linking` | `~8.0.11` | runtime |
| `@expo/vector-icons` | `^15.0.3` | runtime |
| `@expo-google-fonts/inter` | `^0.4.2` | runtime |
| `ky` | `^1.14.3` | runtime |
| `nativewind` | `^4.2.1` | runtime |
| `react-native-reanimated` | `~4.1.1` | runtime (NativeWind peer dep) |
| `react-native-safe-area-context` | required by expo-router | runtime |
| `react-native-screens` | required by expo-router | runtime |
| `tailwindcss` | `^3.4.19` | devDependency |
| `typescript` | `~5.9.2` | devDependency |

**Alternatives considered**: Latest unpinned versions — rejected because they risk breaking changes between Expo SDK 54 and newer React Native versions.

---

## R-002: NativeWind v4 Configuration Pattern

**Question**: How does NativeWind v4 integrate with Expo (Babel plugin, Metro, `global.css`)?

**Decision**: Follow the NativeWind v4 Expo quick-start pattern:
1. `babel.config.js` — add `'nativewind/babel'` to the plugins array inside `babel-preset-expo`.
2. `metro.config.js` — wrap default config with `withNativeWind({ input: './global.css' })`.
3. `global.css` — minimal file with `@tailwind base; @tailwind components; @tailwind utilities;`.
4. Import `global.css` in the root layout to activate styles app-wide.

**Rationale**: NativeWind v4 shifted to a CSS-first approach that requires both a Babel transform (for `className` → `style` conversion) and a Metro plugin (for Tailwind CSS processing). Without both, either the styles compile but don't apply, or the Metro bundler throws an unknown-file error.

**Alternatives considered**:
- NativeWind v2 (StyleSheet approach) — rejected because constitution mandates v4.
- Inline `style` props without NativeWind — rejected because entire source codebase uses `className`.

---

## R-003: Expo Router Requirements

**Question**: What does Expo Router v6 require beyond the basic Expo SDK?

**Decision**: Expo Router requires:
- `scheme` field in `app.json` (for deep links). Value: `posthogmobile` (from constitution §5.5).
- Entry point configured as `expo-router/entry` in `package.json` `main` field.
- `react-native-safe-area-context` and `react-native-screens` as peer dependencies.

**Rationale**: Without `scheme`, the app builds but crashes on deep-link navigation. Without the correct `main` field, Metro doesn't find the router entry point.

**Alternatives considered**: Using `src/app/_layout.tsx` directly as entry — not supported; Expo Router requires its own entry file wrapper.

---

## R-004: TypeScript Configuration

**Question**: What `tsconfig.json` settings are needed for Expo + strict mode?

**Decision**: Extend `expo/tsconfig.base` and add:
- `"strict": true`
- `"paths"` for any workspace aliases (none currently used in source)
- `"baseUrl": "."` to resolve relative imports correctly

**Rationale**: `expo/tsconfig.base` already configures JSX, module resolution, and React Native-specific compiler options. Extending it avoids duplicating dozens of settings and stays in sync with Expo SDK updates.

**Alternatives considered**: Manually writing all compiler options — rejected as fragile and maintenance-heavy.

---

## R-005: `app.json` Required Fields

**Question**: Which `app.json` fields are mandatory for this project?

**Decision**: The following fields are required based on constitution constraints:

| Field | Value | Reason |
|-------|-------|--------|
| `name` | `"PostHogMobile"` | App display name |
| `slug` | `"PostHogMobile"` | Expo project identifier |
| `scheme` | `"posthogmobile"` | Expo Router deep links |
| `orientation` | `"portrait"` | Constitution §4.1 |
| `userInterfaceStyle` | `"dark"` | Constitution §4.1 — dark only |
| `newArchEnabled` | `true` | Constitution §3.5 — New Architecture |
| `ios.supportsTablet` | `true` | Constitution §8 |
| `android.edgeToEdgeEnabled` | `true` | Constitution §8 |
| `android.adaptiveIcon.backgroundColor` | `"#0D0D0D"` | Matches brand background |
| `plugins` | `["expo-router", "expo-secure-store"]` | Required by both plugins |

---

## R-006: Tailwind Custom Tokens

**Question**: What custom tokens must be in `tailwind.config.js`?

**Decision**: Extract all `className` values used in `src/` and map to constitution §4 values.

**Colors used in source**:
| Token | Hex | Source reference |
|-------|-----|-----------------|
| `background` | `#0D0D0D` | `_layout.tsx`, `api-key.tsx`, `settings.tsx` |
| `background-tertiary` | `#262626` | `ApiKeyField.tsx` |
| `border` | `#262626` | `ApiKeyField.tsx` |
| `text-primary` | `#FFFFFF` | `ApiKeyField.tsx` |
| `primary` | `#F54E00` | Button CTAs |

**Font families used in source**:
| Class | Font | Weight |
|-------|------|--------|
| `font-inter` | Inter | 400 |

**Alternatives considered**: Using only the default Tailwind palette — rejected because source code uses custom token names not in the default palette; the app would render with broken styles.

---

## Summary: All Unknowns Resolved

| Unknown | Resolution |
|---------|-----------|
| Exact package versions | Taken from constitution §2 |
| NativeWind v4 config pattern | Babel + Metro + global.css |
| Expo Router requirements | scheme + react-native-screens + react-native-safe-area-context |
| TypeScript config | Extend expo/tsconfig.base + strict |
| app.json required fields | Listed above |
| Tailwind custom tokens | Extracted from source + mapped to constitution |
