# Quickstart: Dark / Light / System Theme Selector

**Feature**: 015-dark-light-theme  
**Date**: 2026-03-20

---

## Prerequisites

- Node.js, npm, Expo CLI already configured (existing project)
- NativeWind 4.2.1 already installed
- AsyncStorage already installed
- No new dependencies needed

## Quick Verification

```bash
cd app/PostHogMobile
npx expo start --clear
```

After running, verify:
1. Open Settings tab
2. See "Appearance" section with 3 options: System / Light / Dark
3. Tap "Light" → entire app switches to light colors
4. Tap "Dark" → entire app switches to dark colors
5. Tap "System" → app follows device theme
6. Kill & reopen app → preference persists

## Key Files (ordered by implementation)

| # | File | Change |
|---|---|---|
| 1 | `app.json` | `userInterfaceStyle: "dark"` → `"automatic"` |
| 2 | `tailwind.config.js` | Add `darkMode: "class"`, add light palette, wrap dark colors with `dark:` |
| 3 | `src/hooks/useTheme.tsx` | **NEW** — ThemeProvider + useTheme hook |
| 4 | `src/hooks/index.ts` | Export ThemeProvider + useTheme |
| 5 | `src/i18n/locales/es.ts` | Add theme-related translations |
| 6 | `src/i18n/locales/en.ts` | Add theme-related translations |
| 7 | `src/i18n/types.ts` | Add TranslationKey entries for theme strings |
| 8 | `src/app/_layout.tsx` | Wrap with ThemeProvider |
| 9 | `src/app/(tabs)/settings.tsx` | Replace cosmetic toggle with 3-state selector |
| 10 | All screen/component files | Update hardcoded dark colors to `dark:` variant classes |

## Architecture

```
AsyncStorage ←→ ThemeProvider (useTheme.tsx)
                     ↕
                NativeWind setColorScheme()
                     ↕
              dark: variant classes in Tailwind
                     ↕
                All UI components
```
