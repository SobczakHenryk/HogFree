# Contract: Expo Configuration Files

**Branch**: `002-expo-project-setup`
**Date**: 2026-03-18
**Type**: File-System Contract — defines the exact shape of each configuration file this feature must create/modify.

> These files are the "public interface" of this feature. Any downstream task (e.g., adding a new screen, installing a new package) depends on them being correct.

---

## 1. `package.json`

```json
{
  "name": "posthog-mobile",
  "version": "0.1.0",
  "main": "expo-router/entry",
  "private": true,
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "ts-check": "tsc --noEmit"
  },
  "dependencies": {
    "@expo-google-fonts/inter": "^0.4.2",
    "@expo/vector-icons": "^15.0.3",
    "expo": "~54.0.33",
    "expo-haptics": "^15.0.8",
    "expo-linking": "~8.0.11",
    "expo-router": "~6.0.23",
    "expo-secure-store": "^15.0.8",
    "ky": "^1.14.3",
    "nativewind": "^4.2.1",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0"
  },
  "devDependencies": {
    "@types/react": "~19.1.10",
    "tailwindcss": "^3.4.19",
    "typescript": "~5.9.2"
  }
}
```

**Invariants**:
- `main` MUST be `"expo-router/entry"` — removing it breaks Metro entry point resolution.
- `tailwindcss` MUST be a devDependency, not a dependency (NativeWind v4 requirement).
- `react-native-reanimated` MUST be present — it is a NativeWind v4 peer dependency.
- `react-native-safe-area-context` and `react-native-screens` MUST be present — Expo Router peer dependencies.

---

## 2. `app.json`

```json
{
  "expo": {
    "name": "PostHogMobile",
    "slug": "PostHogMobile",
    "version": "0.1.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "scheme": "posthogmobile",
    "newArchEnabled": true,
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0D0D0D"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.posthogmobile.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0D0D0D"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.posthogmobile.app"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**Invariants**:
- `scheme` MUST be `"posthogmobile"` — required for Expo Router deep links.
- `newArchEnabled` MUST be `true`.
- `orientation` MUST be `"portrait"`.
- `userInterfaceStyle` MUST be `"dark"`.
- Asset paths (`icon.png`, `splash.png`, `adaptive-icon.png`) are placeholder paths — actual asset files can be added later; Expo tolerates missing assets during local development.

---

## 3. `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": "."
  },
  "include": [
    "src/**/*",
    "global.d.ts"
  ]
}
```

**Invariants**:
- MUST extend `expo/tsconfig.base` — overrides that conflict with Expo's base may break JSX/module resolution.
- `strict` MUST be `true` (constitution §5.1).

---

## 4. `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: ['nativewind/babel'],
  };
};
```

**Invariants**:
- `nativewind/babel` plugin MUST be present — without it `className` props are passed as strings to React Native views, which ignores them silently.
- `jsxImportSource: 'nativewind'` enables NativeWind's JSX transform for automatic `className` handling.

---

## 5. `metro.config.js`

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

**Invariants**:
- `withNativeWind` MUST wrap the default config — it registers `.css` file resolution and sets up the Tailwind PostCSS pipeline.
- `input` path MUST point to `global.css` at the project root.

---

## 6. `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0D0D0D',
          secondary: '#1A1A1A',
          tertiary: '#262626',
        },
        primary: {
          DEFAULT: '#F54E00',
          light: '#FF6B2D',
          dark: '#CC4100',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A3A3A3',
          tertiary: '#737373',
        },
        border: {
          DEFAULT: '#262626',
          light: '#404040',
        },
      },
      fontFamily: {
        inter: ['Inter_400Regular', 'sans-serif'],
        'inter-medium': ['Inter_500Medium', 'sans-serif'],
        'inter-semibold': ['Inter_600SemiBold', 'sans-serif'],
        'inter-bold': ['Inter_700Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

**Invariants**:
- `content` MUST include `./src/**/*.{ts,tsx}` — without it Tailwind purges all classes and nothing renders.
- `presets: [require('nativewind/preset')]` MUST be present — configures NativeWind-specific utilities.
- Color token names (`background`, `background-tertiary`, `border`, `text-primary`, `primary`) MUST match the names used in source `className` props.

---

## 7. `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Invariants**:
- MUST be located at `app/PostHogMobile/global.css`.
- MUST be imported in `src/app/_layout.tsx` as the first import.

---

## 8. Modification to `src/app/_layout.tsx`

Add as the **first line** of the file:

```ts
import '../../global.css';
```

**Invariants**:
- The import MUST come before any other import to ensure NativeWind initializes before any component renders.
- Path is relative to `src/app/_layout.tsx` → `global.css` lives two directories up at `app/PostHogMobile/global.css`.
