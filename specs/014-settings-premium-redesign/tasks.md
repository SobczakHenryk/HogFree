# Tasks: Settings Premium Redesign (Apple-Style)

**Spec**: `specs/014-settings-premium-redesign/spec.md`  
**Plan**: `specs/014-settings-premium-redesign/plan.md`  
**Status**: All tasks completed (retrospective)

---

## Phase 1 — Dependencies & Config

- [x] **T-001**: Install `lucide-react-native` and `expo-clipboard` via npm
  - File: `package.json`
  - AC: Both packages appear in `dependencies`

- [x] **T-002**: Add `unstable_conditionNames` to Metro resolver for CJS resolution
  - File: `metro.config.js`
  - AC: `config.resolver.unstable_conditionNames = ['require', 'react-native', 'browser', 'import']`

- [x] **T-003**: Add `accent.blue` and `accent.teal` colour tokens
  - File: `tailwind.config.js`
  - AC: `accent: { blue: '#3B82F6', teal: '#14B8A6' }` present in `extend.colors`

## Phase 2 — Internationalisation

- [x] **T-004**: Add 5 new i18n keys to Spanish catalogue
  - File: `src/i18n/locales/es.ts`
  - AC: `instanceUrl`, `keyCopied`, `supportDeveloper`, `preferencesSection`, `darkMode` present

- [x] **T-005**: Add 5 new i18n keys to English catalogue
  - File: `src/i18n/locales/en.ts`
  - AC: Same 5 keys present with English translations

- [x] **T-006**: Extend `TranslationCatalog.settings` interface with 5 new fields
  - File: `src/i18n/types.ts`
  - AC: Interface includes `instanceUrl`, `keyCopied`, `supportDeveloper`, `preferencesSection`, `darkMode` as `string`

## Phase 3 — Settings Screen Rewrite

- [x] **T-007**: Create `SettingsRow` local component
  - File: `src/app/(tabs)/settings.tsx`
  - AC: Props: `icon`, `label`, `value?`, `onPress?`, `trailing?`, `isLast?`, `destructive?`, `testID?`

- [x] **T-008**: Create `SectionCard` local component
  - File: `src/app/(tabs)/settings.tsx`
  - AC: Wraps children in `rounded-2xl bg-background-secondary border-border`

- [x] **T-009**: Create `SectionHeader` local component
  - File: `src/app/(tabs)/settings.tsx`
  - AC: Renders uppercase, tracking-widest, tertiary text

- [x] **T-010**: Rewrite API Key section with eye toggle + copy
  - File: `src/app/(tabs)/settings.tsx`
  - AC: `showApiKey` state, `handleCopyKey` with 2s teal feedback, Eye/EyeOff/Copy icons

- [x] **T-011**: Rewrite inline edit form with gradient Confirm button
  - File: `src/app/(tabs)/settings.tsx`
  - AC: `LinearGradient` on Confirm, `ActivityIndicator` while loading, Cancel with border style

- [x] **T-012**: Rewrite Preferences section with gradient radio-dot
  - File: `src/app/(tabs)/settings.tsx`
  - AC: Two language rows, `Languages`/`Globe` icons, gradient dot on active locale

- [x] **T-013**: Add Dark Mode cosmetic card
  - File: `src/app/(tabs)/settings.tsx`
  - AC: Non-interactive gradient pill (48×28), white knob, Moon icon

- [x] **T-014**: Add compact Support/Donation card
  - File: `src/app/(tabs)/settings.tsx`
  - AC: Slate gradient background, Heart icon, teal chevron, debounce guard, haptic

- [x] **T-015**: Add version footer
  - File: `src/app/(tabs)/settings.tsx`
  - AC: "PostHog Mobile v0.1.0" centered below all sections

## Phase 4 — Cleanup

- [x] **T-016**: Remove `DonationBanner` import from settings.tsx
  - AC: No import of `DonationBanner` in `settings.tsx`; component file still exists but unused

---

**Total**: 16/16 tasks completed ✅
