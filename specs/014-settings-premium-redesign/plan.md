# Implementation Plan: Settings Premium Redesign (Apple-Style)

**Spec**: `specs/014-settings-premium-redesign/spec.md`  
**Status**: Implemented  
**Date**: 2025-03-20

---

## Architecture Overview

The redesign replaces the flat list layout of `settings.tsx` with a grouped-card architecture using three local helper components (`SectionCard`, `SectionHeader`, `SettingsRow`) and introduces two new Expo SDK packages (`lucide-react-native`, `expo-clipboard`).

No new screens, navigation routes, hooks, or services are created. All changes are scoped to the existing Settings tab screen and supporting configuration files.

---

## Phases

### Phase 1 — Dependencies & Config

| Step | Action | File |
|---|---|---|
| 1.1 | Install `lucide-react-native` and `expo-clipboard` | `package.json` |
| 1.2 | Add CJS resolution workaround for lucide-react-native ESM export bug | `metro.config.js` |
| 1.3 | Add `accent.blue` (`#3B82F6`) and `accent.teal` (`#14B8A6`) to Tailwind config | `tailwind.config.js` |

### Phase 2 — Internationalisation Keys

| Step | Action | File |
|---|---|---|
| 2.1 | Add 5 new keys to `settings` section in Spanish catalogue | `src/i18n/locales/es.ts` |
| 2.2 | Add 5 new keys to English catalogue | `src/i18n/locales/en.ts` |
| 2.3 | Extend `TranslationCatalog.settings` interface | `src/i18n/types.ts` |

New keys: `instanceUrl`, `keyCopied`, `supportDeveloper`, `preferencesSection`, `darkMode`.

### Phase 3 — Settings Screen Rewrite

All changes in `src/app/(tabs)/settings.tsx`.

| Step | Action |
|---|---|
| 3.1 | Define `SettingsRow` component — reusable row with 32×32 icon box, label, value, trailing, separator. |
| 3.2 | Define `SectionCard` component — rounded-2xl container with secondary background and border. |
| 3.3 | Define `SectionHeader` component — uppercase tertiary label above cards. |
| 3.4 | Rewrite API Key section: add eye toggle state (`showApiKey`), copy state (`copied`), `handleCopyKey` handler using `expo-clipboard`, eye/copy icons from lucide. |
| 3.5 | Rewrite Instance URL row using `SettingsRow` with `Server` icon. |
| 3.6 | Rewrite inline edit form: Confirm button gets `LinearGradient`, Cancel gets border style. |
| 3.7 | Rewrite Change/Delete action buttons with Pencil/Trash2 icons. |
| 3.8 | Rewrite Preferences section: two language rows with `Languages`/`Globe` icons and gradient radio-dot for active locale. |
| 3.9 | Add Dark Mode card with non-interactive gradient toggle pill. |
| 3.10 | Replace `DonationBanner` import with inline compact card: slate gradient background, Heart icon, teal accent, chevron. |
| 3.11 | Add version footer. |

### Phase 4 — Cleanup

| Step | Action |
|---|---|
| 4.1 | Remove `DonationBanner` import from settings.tsx (already done in rewrite). |
| 4.2 | Optionally mark `DonationBanner.tsx` as deprecated (component still exists but is no longer imported). |

---

## File Impact Summary

| File | Change |
|---|---|
| `package.json` | +`lucide-react-native`, +`expo-clipboard` |
| `metro.config.js` | +`unstable_conditionNames` for CJS resolution |
| `tailwind.config.js` | +`accent.blue`, +`accent.teal` |
| `src/i18n/locales/es.ts` | +5 keys in `settings` |
| `src/i18n/locales/en.ts` | +5 keys in `settings` |
| `src/i18n/types.ts` | +5 fields in `settings` interface |
| `src/app/(tabs)/settings.tsx` | Full rewrite (~520 lines) |

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `lucide-react-native` ESM exports broken at runtime | `unstable_conditionNames` in metro.config.js forces CJS resolution |
| Clipboard permission on Android 13+ | `expo-clipboard` handles permissions transparently |
| Gradient rendering performance on low-end devices | Gradients are small (button, radio-dot, pill); no measurable impact |
