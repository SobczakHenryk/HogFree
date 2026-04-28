# Tasks: Donation Button in Settings

**Input**: Design documents from `/specs/013-donation-button/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/donation-section.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- All paths relative to `app/PostHogMobile/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the Ko-fi URL constant and the donation banner image asset

- [X] T001 [P] Add `KOFI_URL` constant to `src/constants/index.ts` — static Ko-fi donation URL (`https://ko-fi.com/YOUR_USERNAME`), developer replaces handle before release (see research.md R1)
- [X] T002 [P] Create placeholder donation banner image at `src/assets/donation-banner.png` — dark-themed PNG, 1080×540 (2:1 aspect ratio), under 200KB, compatible with `#0D0D0D` background (see research.md R3)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add i18n keys and update TypeScript types — MUST complete before UI work

**⚠️ CRITICAL**: Settings screen and component will not compile without these keys and types

- [X] T003 [P] Add 4 donation translation keys to Spanish locale in `src/i18n/locales/es.ts` — keys: `donationSection`, `donationDescription`, `donationLabel`, `donationFallback` under `settings` namespace (see contracts/donation-section.md § i18n Contract)
- [X] T004 [P] Add 4 donation translation keys to English locale in `src/i18n/locales/en.ts` — same keys as T003 with English translations (see contracts/donation-section.md § i18n Contract)
- [X] T005 Add 4 donation keys to `TranslationCatalog` type in `src/i18n/types.ts` — add `donationSection`, `donationDescription`, `donationLabel`, `donationFallback` as `string` fields inside existing `settings` interface

**Checkpoint**: i18n infrastructure ready — component and screen work can begin

---

## Phase 3: User Story 1 — Ver y usar el botón de donación (Priority: P1) 🎯 MVP

**Goal**: Display a donation banner in Settings that opens Ko-fi page in external browser when pressed

**Independent Test**: Open Settings → scroll to bottom → see "Apoyar la app" section with banner image → tap banner → external browser opens Ko-fi page

### Implementation for User Story 1

- [X] T006 [US1] Create `DonationBanner` component in `src/components/DonationBanner.tsx` — Pressable wrapping a local Image with `require('../../assets/donation-banner.png')`, `onPress` callback prop, `accessibilityRole="link"`, `fallbackText` prop, card styling (`bg-background-secondary border border-border rounded-2xl overflow-hidden`), image error state that shows text button fallback (see contracts/donation-section.md § Component)
- [X] T007 [US1] Export `DonationBanner` from `src/components/index.ts` — add named export to barrel file
- [X] T008 [US1] Integrate donation section into Settings screen in `src/app/(tabs)/settings.tsx` — import `DonationBanner`, `KOFI_URL`, `expo-linking`; add `handleDonation` function that calls `Linking.openURL(KOFI_URL)`; render section title (`t('settings.donationSection')`), description text (`t('settings.donationDescription')`), and `DonationBanner` component after the language section (see contracts/donation-section.md § Integration)

**Checkpoint**: User Story 1 functional — banner visible and opens Ko-fi in external browser

---

## Phase 4: User Story 2 — Feedback visual al interactuar (Priority: P2)

**Goal**: Add visual and haptic feedback when the donation banner is pressed

**Independent Test**: Tap the banner → see opacity reduction on press + feel haptic vibration

### Implementation for User Story 2

- [X] T009 [US2] Add `active:opacity-70` press feedback to `DonationBanner` Pressable in `src/components/DonationBanner.tsx` — NativeWind class on Pressable for visual pressed state (FR-004)
- [X] T010 [US2] Add haptic feedback to `handleDonation` in `src/app/(tabs)/settings.tsx` — call `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` before `Linking.openURL` (FR-005, consistent with constitution §4.6)
- [X] T011 [US2] Add press debounce to `handleDonation` in `src/app/(tabs)/settings.tsx` — use `useRef` boolean flag to prevent multiple rapid presses from opening browser multiple times (edge case from spec)

**Checkpoint**: User Story 2 functional — visual + haptic feedback on press, no double-open

---

## Phase 5: User Story 3 — Soporte multiidioma (Priority: P3)

**Goal**: Donation section texts display in the user's selected language (Spanish/English)

**Independent Test**: Switch language in Settings → verify donation section title and description update to selected language

### Implementation for User Story 3

> **Note**: i18n keys were already added in Phase 2 (T003–T005). This phase validates that all texts in the donation section use the `t()` function with the correct keys.

- [X] T012 [US3] Verify all donation section texts in `src/app/(tabs)/settings.tsx` use `t()` function — section title uses `t('settings.donationSection')`, description uses `t('settings.donationDescription')`, banner `accessibilityLabel` uses `t('settings.donationLabel')`, fallback uses `t('settings.donationFallback')` (FR-006)

**Checkpoint**: All 3 user stories complete — donation section fully localized

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories

- [X] T013 Run quickstart.md verification steps — open Settings, verify banner visible, tap to open Ko-fi, switch language, test offline (local asset still renders)
- [X] T014 [P] Verify TypeScript compiles cleanly — run `npx tsc --noEmit` from `app/PostHogMobile/` to confirm no type errors from new i18n keys

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: No dependency on Phase 1 (different files), but BLOCKS Phase 3+ (types must exist)
- **User Story 1 (Phase 3)**: Depends on Phase 1 (needs image asset + constant) AND Phase 2 (needs i18n keys + types)
- **User Story 2 (Phase 4)**: Depends on Phase 3 (needs DonationBanner component and handleDonation to exist)
- **User Story 3 (Phase 5)**: Depends on Phase 2 (i18n keys) AND Phase 3 (UI must exist to verify)
- **Polish (Phase 6)**: Depends on all stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable after Phase 2 completion — this IS the MVP
- **User Story 2 (P2)**: Enhances US1 — requires DonationBanner and handleDonation to exist
- **User Story 3 (P3)**: Validation story — keys added in Phase 2, just verifies correct usage

### Parallel Opportunities

- T001 and T002 can run in parallel (different files: constants vs assets)
- T003, T004 can run in parallel (different locale files: es.ts vs en.ts)
- T013 and T014 can run in parallel (manual verification vs TypeScript check)
- Phase 1 and Phase 2 can run in parallel (no dependencies between them)

---

## Parallel Example: Setup + Foundational

```bash
# These can all run in parallel (different files, no dependencies):
T001: Add KOFI_URL to src/constants/index.ts
T002: Create donation-banner.png in src/assets/
T003: Add Spanish i18n keys to src/i18n/locales/es.ts
T004: Add English i18n keys to src/i18n/locales/en.ts
T005: Add types to src/i18n/types.ts  # depends on knowing key names, but not on T003/T004 files
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002) — constants + image asset
2. Complete Phase 2: Foundational (T003–T005) — i18n keys + types
3. Complete Phase 3: User Story 1 (T006–T008) — component + integration
4. **STOP and VALIDATE**: Banner visible in Settings, tapping opens Ko-fi
5. Proceed to Phase 4–5 for polish (haptics, debounce, i18n verification)
6. Final validation with Phase 6
