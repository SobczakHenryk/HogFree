# hog Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-28

## Active Technologies
- TypeScript ~5.9.2 + Expo ~54.0.33, React Native 0.81.5, Expo Router ~6.0.23, NativeWind ^4.2.1, Tailwind CSS ^3.4.19 (002-expo-project-setup)
- N/A (this feature creates config files only) (002-expo-project-setup)
- TypeScript ~5.9.2, React 19.1.0 + React Native 0.81.5 (New Architecture), Expo ~54.0.33, Expo Router ~6.0.23, TanStack Query ^5.90.21, NativeWind ^4.2.1, @gorhom/bottom-sheet ^5.2.8, @shopify/flash-list ^2.2.2, ky ^1.14.3, date-fns ^4.1.0, expo-haptics ^15.0.8 (003-metrics-dashboard)
- AsyncStorage (config + TanStack Query cache via PersistQueryClientProvider), SecureStore (API Key — ya existente) (003-metrics-dashboard)
- TypeScript ~5.9.2, React 19.1.0 + React Native 0.81.5 (New Architecture), Expo ~54.0.33, Expo Router ~6.0.23, TanStack Query ^5.90.21, NativeWind ^4.2.1, @gorhom/bottom-sheet ^5.2.8, @shopify/flash-list ^2.2.2, ky ^1.14.3, expo-haptics ^15.0.8 (006-funnel-chart-widget)
- AsyncStorage (config de métricas — funnelEvents persiste como parte de DashboardMetric), SecureStore (API Key — ya existente) (006-funnel-chart-widget)
- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (006-funnel-chart-widget)
- [if applicable, e.g., PostgreSQL, CoreData, files or N/A] (006-funnel-chart-widget)
- TypeScript ~5.9.2, React 19.1.0, React Native 0.81.5 + `react-native-gifted-charts` ^1.4.74, `react-native-svg` ^15.15.3, `@tanstack/react-query` ^5.90.21, `ky` ^1.14.3, `date-fns` ^4.1.0 (005-chart-widgets)
- AsyncStorage (config + TanStack Query cache), expo-secure-store (API Key) (005-chart-widgets)
- TypeScript ~5.9.2, React 19.1.0, React Native 0.81.5 + Expo ~54.0.33, Expo Router ~6.0.23, NativeWind ^4.2.1, TanStack Query ^5.91.0, expo-localization (nueva) (012-i18n-language-support)
- AsyncStorage para preferencia de locale; expo-secure-store para API Key (existente, no se modifica) (012-i18n-language-support)
- TypeScript ~5.9.2 on React Native 0.81.5 / Expo ~54.0.33 + `expo-linking` (URL opening), `expo-haptics` (haptic feedback), `react-native` Pressable + Image (UI), NativeWind (styles) (013-donation-button)
- N/A — no data persistence needed, URL is a static constant (013-donation-button)
- TypeScript ~5.9.2, React 19.1.0, React Native 0.81.5 + NativeWind 4.2.1 (con `useColorScheme`), Expo ~54.0.33, Expo Router ~6.0.23, AsyncStorage (015-dark-light-theme)
- AsyncStorage (clave `APP_THEME_PREFERENCE`) para persistencia de preferencia (015-dark-light-theme)
- TypeScript ~5.9.2, React 19.1.0 + Expo ~54, NativeWind ^4.2.1, TanStack Query ^5.90, ky ^1.14, expo-secure-store ^15.0.8 (017-self-hosted-support)
- expo-secure-store (API Key + cloud region + self-hosted URL), AsyncStorage (query cache + project info) (017-self-hosted-support)
- TypeScript ~5.9.2 + React Native 0.81.5 + Expo ~54.0.33 + react-native-gifted-charts ^1.4.74 + TanStack Query ^5.90.21 (019-fix-linechart-breakdown-support)
- AsyncStorage (caché React Query), expo-secure-store (API key) (019-fix-linechart-breakdown-support)

- TypeScript ~5.9.2 / React Native 0.81.5 / Expo ~54.0.33 + Expo Router ~6.0.23, NativeWind ^4.2.1, TanStack Query ^5.90.21, `expo-secure-store` ^15.0.8, `ky` ^1.14.3, `expo-haptics` ^15.0.8 (001-api-key-screen)

## Project Structure

```text
src/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript ~5.9.2 / React Native 0.81.5 / Expo ~54.0.33: Follow standard conventions

## Recent Changes
- 019-fix-linechart-breakdown-support: Added TypeScript ~5.9.2 + React Native 0.81.5 + Expo ~54.0.33 + react-native-gifted-charts ^1.4.74 + TanStack Query ^5.90.21
- 019-fix-linechart-breakdown-support: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]
- 017-self-hosted-support: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
