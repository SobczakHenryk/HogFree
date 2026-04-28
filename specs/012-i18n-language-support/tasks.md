# Tasks: i18n — Soporte Multilenguaje (Español / Inglés)

**Input**: Design documents from `/specs/012-i18n-language-support/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/useLocale.md ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All paths relative to `app/PostHogMobile/`

---

## Phase 1: Setup

**Purpose**: Install dependency and create i18n module skeleton

- [x] T001 Install expo-localization via `npx expo install expo-localization` in app/PostHogMobile/
- [x] T002 Create i18n types file with Locale, TranslationCatalog, TranslationKey, and LocaleContextValue types in src/i18n/types.ts
- [x] T003 Create Spanish translation catalog with all ~200 strings extracted from existing codebase in src/i18n/locales/es.ts
- [x] T004 Create English translation catalog satisfying TranslationCatalog type in src/i18n/locales/en.ts
- [x] T005 Create i18n barrel export file in src/i18n/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: LocaleProvider and useLocale hook — MUST be complete before any user story migration

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Implement LocaleProvider context and useLocale hook with AsyncStorage persistence and expo-localization auto-detection in src/i18n/LocaleProvider.tsx
- [x] T007 Add APP_LOCALE_PREFERENCE constant to src/constants/index.ts
- [x] T008 Re-export LocaleProvider and useLocale from src/hooks/index.ts
- [x] T009 Wrap navigation Stack with LocaleProvider inside AuthProvider in src/app/_layout.tsx
- [x] T010 Transform API_KEY_ERRORS values from Spanish strings to translation keys (e.g. 'errors.emptyApiKey') in src/constants/index.ts
- [x] T011 Remove TIME_FILTER_LABELS export from src/types/dashboard.ts (labels moved to translation catalogs)

**Checkpoint**: Foundation ready — `useLocale()` hook works, `t()` resolves translations, auto-detection and persistence functional. User story migration can begin.

---

## Phase 3: User Story 1 — Cambiar el idioma de la app a inglés (Priority: P1) 🎯 MVP

**Goal**: All static strings across the app use `t()` so switching locale from 'es' to 'en' updates all visible text immediately.

**Independent Test**: Open Settings, select "English", verify all visible text in Dashboard, Settings, Onboarding, Chart Detail, Edit Chart and shared components shows in English.

### Implementation for User Story 1

- [X] T012 [P] [US1] Migrate hardcoded strings to t() calls in src/app/(tabs)/dashboard.tsx — header title, cache error message, accessibility labels
- [X] T013 [P] [US1] Migrate hardcoded strings to t() calls in src/app/(onboarding)/api-key.tsx — title, subtitle, placeholder, button, help text
- [X] T014 [P] [US1] Migrate hardcoded strings to t() calls in src/app/chart-detail.tsx — error/empty states, navigation labels, accessibility labels
- [X] T015 [P] [US1] Migrate hardcoded strings to t() calls in src/app/edit-chart.tsx — header, section labels, aggregation options, Alert messages, not-found state
- [X] T016 [P] [US1] Migrate hardcoded strings to t() calls in src/components/AddMetricSheet.tsx — step titles, descriptions, chart type labels, search placeholders, buttons, funnel labels
- [X] T017 [P] [US1] Migrate hardcoded strings to t() calls in src/components/ApiKeyField.tsx — accessibility labels for show/hide toggle
- [X] T018 [P] [US1] Migrate hardcoded strings to t() calls in src/components/CloudRegionSelector.tsx — region label, accessibility labels
- [X] T019 [P] [US1] Migrate hardcoded strings to t() calls in src/components/DashboardEmptyState.tsx — title and description
- [X] T020 [P] [US1] Migrate hardcoded strings to t() calls in src/components/MetricCard.tsx — error text
- [X] T021 [P] [US1] Migrate hardcoded strings to t() calls in src/components/BarChartWidget.tsx — error and empty state messages
- [X] T022 [P] [US1] Migrate hardcoded strings to t() calls in src/components/LineChartWidget.tsx — error and empty state messages
- [X] T023 [P] [US1] Migrate hardcoded strings to t() calls in src/components/FunnelChart.tsx — description, error/empty states, conversion labels
- [X] T024 [P] [US1] Migrate hardcoded strings to t() calls in src/components/TimeFilterBar.tsx — replace TIME_FILTER_LABELS import with t() calls for each filter option
- [X] T025 [US1] Migrate tab labels to use t() calls in src/app/(tabs)/_layout.tsx — "Dashboard" and "Settings" tab titles
- [X] T026 [US1] Update useAuth hook to store translation keys instead of Spanish error strings in src/hooks/useAuth.tsx
- [X] T027 [US1] Migrate error display in Settings to render errors via t() in src/app/(tabs)/settings.tsx — API key error messages, Alert title/message, button labels, accessibility labels
- [X] T028 [US1] Verify TypeScript compilation passes with zero errors across all modified files

**Checkpoint**: All static UI strings use `t()`. Switching locale between 'es' and 'en' updates every screen. App in Spanish is visually identical to previous version (SC-004).

---

## Phase 4: User Story 2 — Auto-detección del idioma del dispositivo (Priority: P1)

**Goal**: On first launch (no stored preference), the app reads the device language via expo-localization and displays in that language if supported, otherwise falls back to Spanish.

**Independent Test**: Set simulator to English, fresh install (no preference stored), verify app displays in English. Repeat with Spanish → shows Spanish. Repeat with French → shows Spanish (fallback).

### Implementation for User Story 2

> **Note**: The auto-detection logic is already implemented in T006 (LocaleProvider). This phase validates the behavior and handles edge cases.

- [X] T029 [US2] Verify LocaleProvider correctly reads getLocales()[0].languageCode on mount when no AsyncStorage preference exists — validate in src/i18n/LocaleProvider.tsx
- [X] T030 [US2] Verify fallback to 'es' when device language is unsupported (not 'es' or 'en') — validate in src/i18n/LocaleProvider.tsx
- [X] T031 [US2] Verify that when AsyncStorage read fails (corrupted data), the provider falls back to device language detection then to 'es' — validate in src/i18n/LocaleProvider.tsx

**Checkpoint**: First-time users see the app in their device language (if supported) without manual configuration.

---

## Phase 5: User Story 3 — Selector de idioma en Settings (Priority: P1)

**Goal**: Settings screen has a visible language section where the user can toggle between Español and English. Selection persists and overrides auto-detection.

**Independent Test**: Open Settings, locate language section, toggle between Español and English, verify immediate UI update and persistence across app restart.

### Implementation for User Story 3

- [X] T032 [US3] Add language selector section UI to settings screen with two Pressable options (Español/English) showing active state indicator in src/app/(tabs)/settings.tsx
- [X] T033 [US3] Wire language selector to setLocale() from useLocale hook with haptic feedback on selection in src/app/(tabs)/settings.tsx
- [X] T034 [US3] Verify that manual language change persists in AsyncStorage and overrides device auto-detection on subsequent app launches

**Checkpoint**: Language selector is visible in Settings, toggles work immediately, and manual preference persists across restarts overriding device language.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [X] T035 [P] Verify all accessibility labels (accessibilityLabel) across all screens use t() calls — spot check src/app/(tabs)/dashboard.tsx, src/app/(tabs)/settings.tsx, src/app/edit-chart.tsx, src/app/chart-detail.tsx
- [X] T036 [P] Verify Alert.alert() calls in src/app/(tabs)/settings.tsx and src/app/edit-chart.tsx use t() for title, message, and button labels
- [X] T037 Verify that dynamic values (event names, metric labels, project names from API) are NOT translated — they pass through as-is from PostHog API
- [X] T038 Verify technical terms (API Key, PostHog, Dashboard, Breakdown, Funnel, Stacked, Normal) remain in English in both language catalogs
- [X] T039 Run quickstart.md validation — complete the 7-step verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — all migration tasks [P] can run in parallel
- **US2 (Phase 4)**: Core logic done in Phase 2 (T006) — Phase 4 is validation only, can run after Phase 2
- **US3 (Phase 5)**: Depends on Phase 2 + Phase 3 T027 (settings.tsx migration) — adds selector UI on top of migrated settings
- **Polish (Phase 6)**: Depends on Phase 3, 4, 5 completion

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational phase only. All T012–T024 can run in parallel (different files). T025–T027 are sequential (shared files or dependencies).
- **User Story 2 (P1)**: Auto-detection logic implemented in T006. Phase 4 tasks are validation/edge-case hardening.
- **User Story 3 (P1)**: Depends on T027 (settings.tsx already migrated to t()). Adds language selector UI on top.

### Parallel Opportunities

Within **Phase 3 (US1)**: T012 through T024 are **all parallelizable** — each migrates strings in a different file with no cross-dependencies.

---

## Parallel Example: User Story 1

```bash
# All string migration tasks can launch in parallel (13 different files):
T012: dashboard.tsx
T013: api-key.tsx
T014: chart-detail.tsx
T015: edit-chart.tsx
T016: AddMetricSheet.tsx
T017: ApiKeyField.tsx
T018: CloudRegionSelector.tsx
T019: DashboardEmptyState.tsx
T020: MetricCard.tsx
T021: BarChartWidget.tsx
T022: LineChartWidget.tsx
T023: FunnelChart.tsx
T024: TimeFilterBar.tsx

# Then sequential tasks:
T025: (tabs)/_layout.tsx (depends on useLocale available)
T026: useAuth.tsx (depends on T010 API_KEY_ERRORS transformation)
T027: settings.tsx (depends on T026 for translated errors)
T028: TypeScript validation (depends on all above)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Install expo-localization + create i18n module skeleton (T001–T005)
2. Complete Phase 2: LocaleProvider + hook + foundational changes (T006–T011)
3. Complete Phase 3: Migrate all strings to t() (T012–T028)
4. **STOP and VALIDATE**: Switch locale programmatically, verify all text updates
5. App is functional in both languages at this point

### Incremental Delivery

1. Setup + Foundational → i18n infrastructure ready
2. User Story 1 → All strings use t(), both languages work → **MVP**
3. User Story 2 → Auto-detection validated → First-time UX complete
4. User Story 3 → Settings selector added → Feature complete
5. Polish → Accessibility, alerts, edge cases verified → Production ready
