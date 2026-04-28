# Tasks: Dark / Light / System Theme Selector

**Input**: Design documents from `/specs/015-dark-light-theme/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/useTheme.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configuration changes that enable NativeWind dark mode support

- [x] T001 Change `userInterfaceStyle` from `"dark"` to `"automatic"` in `app/PostHogMobile/app.json`
- [x] T002 Add `darkMode: "class"` to Tailwind config and restructure color tokens (light defaults + dark overrides) in `app/PostHogMobile/tailwind.config.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: ThemeProvider hook and i18n entries that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create `ThemeProvider` and `useTheme` hook following LocaleProvider pattern in `app/PostHogMobile/src/hooks/useTheme.tsx`
- [x] T004 Export `ThemeProvider` and `useTheme` from `app/PostHogMobile/src/hooks/index.ts`
- [x] T005 [P] Add theme-related translation keys (`themeSection`, `themeSystem`, `themeLight`, `themeDark`) to Spanish catalog in `app/PostHogMobile/src/i18n/locales/es.ts`
- [x] T006 [P] Add theme-related translation keys to English catalog in `app/PostHogMobile/src/i18n/locales/en.ts`
- [x] T007 Add theme translation keys to `TranslationCatalog` type in `app/PostHogMobile/src/i18n/types.ts`
- [x] T008 Wrap app tree with `ThemeProvider` in root layout in `app/PostHogMobile/src/app/_layout.tsx`

**Checkpoint**: Foundation ready — ThemeProvider active, NativeWind responds to `setColorScheme()`, translations available

---

## Phase 3: User Story 1 — Seguir el tema del sistema por defecto (Priority: P1) 🎯 MVP

**Goal**: App follows device theme automatically on first launch (default "system" preference)

**Independent Test**: Install app fresh, set device to light mode → app shows light. Set device to dark → app shows dark. Change device theme while app is open → app reflects change in real time.

### Implementation for User Story 1

- [x] T009 [US1] Add `dark:` variant classes to root layout and loading screen in `app/PostHogMobile/src/app/_layout.tsx`
- [x] T010 [US1] Add `dark:` variant classes to index redirect screen in `app/PostHogMobile/src/app/index.tsx`
- [x] T011 [US1] Add `dark:` variant classes and update hardcoded tab bar colors to theme-aware colors in `app/PostHogMobile/src/app/(tabs)/_layout.tsx`
- [x] T012 [P] [US1] Add `dark:` variant classes to onboarding layout in `app/PostHogMobile/src/app/(onboarding)/_layout.tsx`
- [x] T013 [P] [US1] Add `dark:` variant classes and update hardcoded colors in onboarding API key screen in `app/PostHogMobile/src/app/(onboarding)/api-key.tsx`
- [x] T014 [P] [US1] Add `dark:` variant classes to dashboard screen in `app/PostHogMobile/src/app/(tabs)/dashboard.tsx`
- [x] T015 [P] [US1] Add `dark:` variant classes and update hardcoded inline colors in settings screen in `app/PostHogMobile/src/app/(tabs)/settings.tsx`
- [x] T016 [P] [US1] Add `dark:` variant classes and update hardcoded inline colors in edit-chart screen in `app/PostHogMobile/src/app/edit-chart.tsx`
- [x] T017 [P] [US1] Add `dark:` variant classes and update hardcoded inline colors in chart-detail screen in `app/PostHogMobile/src/app/chart-detail.tsx`

**Checkpoint**: All screens render correctly in both light and dark mode following the device system preference

---

## Phase 4: User Story 2 — Selector de tres estados en Settings (Priority: P1)

**Goal**: User can switch between System / Light / Dark via a 3-option selector in the settings screen

**Independent Test**: Open Settings, see 3 options in Appearance section. Tap each option → theme changes immediately. Active option shows gradient radio indicator.

### Implementation for User Story 2

- [x] T018 [US2] Replace cosmetic dark mode toggle with 3-state theme selector (System/Light/Dark) with icons (Smartphone/Sun/Moon), haptic feedback, and gradient radio indicator — following the language selector pattern — in `app/PostHogMobile/src/app/(tabs)/settings.tsx`

**Checkpoint**: User can change theme from Settings; all three options work and the UI updates in real time

---

## Phase 5: User Story 3 — Persistencia de la preferencia (Priority: P2)

**Goal**: Theme preference persists across app restarts

**Independent Test**: Select "Light", force-close app, reopen → app loads in light mode. Select "System", close, reopen → follows device.

### Implementation for User Story 3

> **Note**: Persistence logic is already built into T003 (ThemeProvider reads/writes AsyncStorage on mount and on change). This phase validates end-to-end behavior.

- [x] T019 [US3] Verify ThemeProvider loads stored preference from AsyncStorage before first render and calls `setColorScheme()` immediately — no flash of wrong theme — in `app/PostHogMobile/src/hooks/useTheme.tsx`

**Checkpoint**: Preference survives app kill and relaunch with no visual flash

---

## Phase 6: User Story 4 — Paleta de colores claros coherente (Priority: P2)

**Goal**: All reusable components render legibly and consistently in light mode

**Independent Test**: Set theme to "Light", navigate all screens, verify no invisible text, broken borders, or unreadable charts.

### Implementation for User Story 4

- [x] T020 [P] [US4] Add `dark:` variant classes and update hardcoded inline colors (chart axes, rules, text, tooltips) in `app/PostHogMobile/src/components/MetricCard.tsx`
- [x] T021 [P] [US4] Add `dark:` variant classes and update hardcoded inline chart colors in `app/PostHogMobile/src/components/LineChartWidget.tsx`
- [x] T022 [P] [US4] Add `dark:` variant classes and update hardcoded inline chart colors in `app/PostHogMobile/src/components/BarChartWidget.tsx`
- [x] T023 [P] [US4] Add `dark:` variant classes and update hardcoded inline chart colors in `app/PostHogMobile/src/components/FunnelChart.tsx`
- [x] T024 [P] [US4] Add `dark:` variant classes and update hardcoded inline colors (bottom sheet background, overlay, icons, placeholder) in `app/PostHogMobile/src/components/AddMetricSheet.tsx`
- [x] T025 [P] [US4] Add `dark:` variant classes in `app/PostHogMobile/src/components/TimeFilterBar.tsx`
- [x] T026 [P] [US4] Add `dark:` variant classes in `app/PostHogMobile/src/components/DonationBanner.tsx`
- [x] T027 [P] [US4] Add `dark:` variant classes in `app/PostHogMobile/src/components/ApiKeyField.tsx`
- [x] T028 [P] [US4] Add `dark:` variant classes in `app/PostHogMobile/src/components/CloudRegionSelector.tsx`
- [x] T029 [P] [US4] Add `dark:` variant classes in `app/PostHogMobile/src/components/DashboardEmptyState.tsx`

**Checkpoint**: All components render correctly in both light and dark mode; charts are legible, icons are visible, borders have adequate contrast

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and constitution update

- [x] T030 Run full app walkthrough in light mode across all screens (onboarding, dashboard, chart detail, edit chart, settings) and fix any remaining contrast or color issues
- [x] T031 Run full app walkthrough in dark mode and verify no regressions from the existing dark-only design
- [x] T032 Run quickstart.md verification steps in `specs/015-dark-light-theme/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001, T002) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — screen-level dark: classes
- **US2 (Phase 4)**: Depends on Phase 2 (T003, T005–T008) — Settings selector UI
- **US3 (Phase 5)**: Built into T003, validation only — depends on Phase 2
- **US4 (Phase 6)**: Depends on Phase 1 (T002 tailwind config) — component-level dark: classes. Can run in parallel with US1/US2.
- **Polish (Phase 7)**: Depends on ALL previous phases

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. No dependencies on other stories.
- **US2 (P1)**: Can start after Phase 2. Independent of US1 but best done after US1 so the selector change is visible.
- **US3 (P2)**: Validation-only. Depends on T003 being correctly implemented.
- **US4 (P2)**: Can start after Phase 1 (T002). Can run in parallel with US1 and US2.

### Parallel Opportunities

- **Phase 1**: T001 and T002 are sequential (T002 depends on config context)
- **Phase 2**: T005 + T006 are parallel. T003 → T004 → T008 are sequential. T007 is parallel with T005/T006.
- **Phase 3**: T012–T017 are all parallel (different files). T009–T011 are sequential (layout chain).
- **Phase 4**: Single task (T018).
- **Phase 6**: T020–T029 are ALL parallel (independent component files).
- **Phase 7**: T030–T032 are sequential (full walkthroughs).

---

## Parallel Example: Phase 6 (US4 — Components)

```
Worker A: T020 (MetricCard) → T021 (LineChartWidget) → T022 (BarChartWidget)
Worker B: T023 (FunnelChart) → T024 (AddMetricSheet) → T025 (TimeFilterBar)
Worker C: T026 (DonationBanner) → T027 (ApiKeyField) → T028 (CloudRegionSelector) → T029 (DashboardEmptyState)
```

All workers can start simultaneously after T002 is complete.

---

## Implementation Strategy

### MVP Scope

**User Story 1 + User Story 2** (Phases 1–4): The app follows the device theme by default and the user can manually select System / Light / Dark from Settings.

### Incremental Delivery

1. **Phase 1–2** (Setup + Foundation): Config changes + ThemeProvider + i18n → app now supports theme switching programmatically
2. **Phase 3** (US1): All screens get `dark:` classes → light/dark works visually
3. **Phase 4** (US2): Settings selector → user can control theme manually
4. **Phase 6** (US4): Components get `dark:` classes → charts and reusable UI fully themed
5. **Phase 5** (US3): Validate persistence → no flash on restart
6. **Phase 7** (Polish): Full walkthrough and quality pass
