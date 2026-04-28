# Data Model: Expo Project Setup

**Branch**: `002-expo-project-setup`
**Date**: 2026-03-18

> This feature creates configuration files and installs dependencies — it introduces no application data entities. There are no database tables, GraphQL types, or persistent data models to define.

---

## Configuration Artifacts

This section documents the structure and constraints of each configuration file, which serve as the "data model" for this scaffolding feature.

---

### 1. `package.json`

**File path**: `app/PostHogMobile/package.json`

| Field | Value / Constraint |
|-------|--------------------|
| `name` | `"posthog-mobile"` |
| `version` | `"0.1.0"` |
| `main` | `"expo-router/entry"` ← required by Expo Router |
| `private` | `true` |
| `scripts.start` | `"expo start"` |
| `scripts.android` | `"expo start --android"` |
| `scripts.ios` | `"expo start --ios"` |
| `scripts.ts-check` | `"tsc --noEmit"` |

**Runtime dependencies** (from research R-001 + additions from feature 003):

| Package | Version | Notes |
|---------|---------|-------|
| `expo` | `~54.0.33` | SDK 54 |
| `react` | `19.1.0` | |
| `react-native` | `0.81.5` | |
| `expo-router` | `~6.0.23` | |
| `expo-haptics` | `^15.0.8` | |
| `expo-secure-store` | `^15.0.8` | |
| `expo-linking` | `~8.0.11` | |
| `@expo/vector-icons` | `^15.0.3` | |
| `@expo-google-fonts/inter` | `^0.4.2` | |
| `ky` | `^1.14.3` | HTTP client |
| `nativewind` | `^4.2.1` | |
| `react-native-reanimated` | `~4.1.1` | |
| `react-native-safe-area-context` | `~5.6.0` | |
| `react-native-screens` | `~4.16.0` | |
| `react-native-gesture-handler` | `~2.28.0` | Required by @gorhom/bottom-sheet |
| `react-native-worklets` | `0.5.1` | **Pinned** — Expo SDK 54 native binary requires exactly this version (0.7.x causes JS/native mismatch error) |
| `@gorhom/bottom-sheet` | `^5.2.8` | Added for feature 003 |
| `@shopify/flash-list` | `2.0.2` | Added for feature 003 |
| `@tanstack/react-query` | `^5.91.0` | Added for feature 003 |
| `@tanstack/react-query-persist-client` | `^5.90.25` | Added for feature 003 |
| `@tanstack/query-async-storage-persister` | `^5.90.25` | Added for feature 003 |
| `@react-native-async-storage/async-storage` | `2.2.0` | Added for feature 003 |
| `date-fns` | `^4.1.0` | Added for feature 003 |

**Dev dependencies**:

| Package | Version |
|---------|---------|
| `babel-preset-expo` | `~54.0.10` |
| `@types/react` | `~19.1.10` |
| `tailwindcss` | `^3.4.19` |
| `typescript` | `~5.9.2` |

---

### 2. `app.json`

**File path**: `app/PostHogMobile/app.json`

| Field | Value | Source |
|-------|-------|--------|
| `expo.name` | `"PostHogMobile"` | Product name |
| `expo.slug` | `"PostHogMobile"` | Expo project identifier |
| `expo.version` | `"0.1.0"` | Initial version |
| `expo.scheme` | `"posthogmobile"` | Constitution §5.5 |
| `expo.orientation` | `"portrait"` | Constitution §4.1 |
| `expo.userInterfaceStyle` | `"dark"` | Constitution §4.1 |
| `expo.newArchEnabled` | `true` | Constitution §3.5 |
| `expo.ios.supportsTablet` | `true` | Constitution §8 |
| `expo.android.edgeToEdgeEnabled` | `true` | Constitution §8 |
| `expo.android.adaptiveIcon.backgroundColor` | `"#0D0D0D"` | Brand token `background` |
| `expo.plugins` | `["expo-router", "expo-secure-store"]` | Required by router + secure store |

---

### 3. `tsconfig.json`

**File path**: `app/PostHogMobile/tsconfig.json`

| Field | Value |
|-------|-------|
| `extends` | `"expo/tsconfig.base"` |
| `compilerOptions.strict` | `true` |
| `compilerOptions.baseUrl` | `"."` |
| `include` | `["src/**/*", "global.d.ts"]` |

---

### 4. `babel.config.js`

**File path**: `app/PostHogMobile/babel.config.js`

| Setting | Value |
|---------|-------|
| Preset | `babel-preset-expo` |
| Plugin | `nativewind/babel` |

---

### 5. `metro.config.js`

**File path**: `app/PostHogMobile/metro.config.js`

| Setting | Value |
|---------|-------|
| Base config | `getDefaultConfig(__dirname)` from `expo/metro-config` |
| NativeWind wrapper | `withNativeWind(config, { input: './global.css' })` |

---

### 6. `tailwind.config.js`

**File path**: `app/PostHogMobile/tailwind.config.js`

| Setting | Value |
|---------|-------|
| `content` | `["./src/**/*.{ts,tsx}"]` |
| Custom color `background` | `#0D0D0D` |
| Custom color `background-tertiary` | `#262626` |
| Custom color `border` | `#262626` |
| Custom color `text-primary` | `#FFFFFF` |
| Custom color `primary` | `#F54E00` |
| Custom fontFamily `inter` | `["Inter_400Regular", "sans-serif"]` |

---

### 7. `global.css`

**File path**: `app/PostHogMobile/global.css`

Minimal NativeWind v4 entry point:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### Modification to Existing File

**File**: `app/PostHogMobile/src/app/_layout.tsx`

The root layout must import `global.css` (FR-010). One line is prepended to the existing source:

```ts
import '../../../global.css';
```

> Note: The relative path depth depends on where `global.css` ends in the final structure. With `global.css` at `app/PostHogMobile/global.css` and `_layout.tsx` at `app/PostHogMobile/src/app/_layout.tsx`, the correct relative path is `../../global.css`.
