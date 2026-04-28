# Tasks: Expo Project Setup

**Feature**: Expo Project Setup  
**Branch**: `002-expo-project-setup`  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)  
**Generated**: 2026-03-18

---

## Phase 1: Setup — Project Root Scaffolding

> Goal: Create all configuration files so the project is bootstrappable. No source-code changes yet.

- [X] T001 Create `app/PostHogMobile/package.json` with all dependencies per contracts/config-files.md §1
- [X] T002 [P] Create `app/PostHogMobile/app.json` with Expo config per contracts/config-files.md §2
- [X] T003 [P] Create `app/PostHogMobile/tsconfig.json` extending `expo/tsconfig.base` with strict mode per contracts/config-files.md §3
- [X] T004 [P] Create `app/PostHogMobile/babel.config.js` with `babel-preset-expo` + `nativewind/babel` plugin per contracts/config-files.md §4
- [X] T005 [P] Create `app/PostHogMobile/metro.config.js` wrapping default config with `withNativeWind` per contracts/config-files.md §5
- [X] T006 [P] Create `app/PostHogMobile/tailwind.config.js` with content paths, NativeWind preset, custom colors and fonts per contracts/config-files.md §6
- [X] T007 [P] Create `app/PostHogMobile/global.css` with `@tailwind base/components/utilities` directives per contracts/config-files.md §7

---

## Phase 2: Foundational — Activate NativeWind (US1 + US2 blocker)

> Goal: Wire `global.css` into the app so NativeWind styles are activated on startup. This is the only modification to existing source code.

- [X] T008 [US1] Add `import '../../global.css';` as the first line of `app/PostHogMobile/src/app/_layout.tsx` per contracts/config-files.md §8 and FR-010

---

## Phase 3: User Story 1 — Developer Runs the App (P1)

> **Story Goal**: A developer can run `npm install` followed by `npx expo start` and see the app launch on a device or emulator.  
> **Independent Test**: Run `npm install` → `npx expo start` → scan QR or press `a`/`i` → API Key screen loads.

- [X] T009 [US1] Install dependencies by running `npm install` inside `app/PostHogMobile/` and verify zero errors
- [X] T010 [US1] Verify Metro bundler starts without errors by running `npx expo start` and confirming QR code appears in terminal

---

## Phase 4: User Story 2 — Developer Sees Correct Styling (P2)

> **Story Goal**: All `className`-based styles render correctly — dark background, PostHog orange CTA, Inter font, rounded inputs.  
> **Independent Test**: Launch app → API Key screen shows dark background, styled input, and orange button. No white-background unstyled views.

- [ ] T011 [P] [US2] Verify `tailwind.config.js` content glob `./src/**/*.{ts,tsx}` resolves all source files by running `npx tailwindcss --dry-run` or checking Metro bundler console for CSS generation warnings
- [ ] T012 [US2] Manually verify on device/emulator that the API Key screen background is `#0D0D0D` (dark), the input border is visible, and the button color is `#F54E00` (PostHog orange)

---

## Phase 5: User Story 3 — TypeScript Type Checking Passes (P3)

> **Story Goal**: `npx tsc --noEmit` reports zero errors against the existing `src/` codebase.  
> **Independent Test**: Run `npm run ts-check` → zero errors reported.

- [ ] T013 [US3] Run `npm run ts-check` inside `app/PostHogMobile/` and confirm zero TypeScript errors (SC-003)

---

## Final Phase: Polish & Verification

- [ ] T014 [P] Verify `app.json` `scheme` field is `"posthogmobile"` — required for Expo Router deep links (FR-002)
- [ ] T015 [P] Verify `newArchEnabled: true` is present in `app.json` — required by constitution §3.5
- [ ] T016 Confirm end-to-end: fresh `npm install` + `npx expo start` + app loads API Key screen with correct styling on at least one platform (iOS or Android) per SC-001 and SC-005

---

## Dependencies

```
T001 (package.json)
  └── T009 (npm install)
        ├── T010 (expo start — US1 complete)
        ├── T011 (tailwind dry-run — US2)
        ├── T012 (visual verify — US2 complete)
        └── T013 (tsc — US3 complete)

T002–T007 (config files) — parallelizable with each other, depend on T001 being created first
T008 (_layout.tsx import) — depends on T007 (global.css must exist)
T014–T015 — parallelizable post-T002
T016 — depends on ALL previous tasks
```

**Story completion order**: US1 (T001→T009→T010) → US2 (T011→T012) → US3 (T013) → Polish (T014–T016)

---

## Parallel Execution Examples

**Phase 1 parallelizable batch** (after T001 is created):
```
T002 app.json  |  T003 tsconfig.json  |  T004 babel.config.js
T005 metro.config.js  |  T006 tailwind.config.js  |  T007 global.css
```

**Phase 5 + Polish** (after T009):
```
T013 tsc --noEmit  |  T014 verify scheme  |  T015 verify newArch
```

---

## Implementation Strategy

**MVP (US1 only — T001–T010)**: Create `package.json` + `app.json` + the five config files → wire `global.css` → `npm install` → `npx expo start`. This alone delivers a runnable app.

**Increment 2 (US2 — T011–T012)**: Confirm styles are applied correctly. If not, fix `tailwind.config.js` content paths or `babel.config.js` plugin order.

**Increment 3 (US3 — T013)**: Fix any TypeScript errors surfaced by `tsc --noEmit`. Likely none since source is pre-typed, but `tsconfig.json` `include` paths may need adjustment.

---

## Format Validation

All tasks follow the required format: `- [ ] [TaskID] [P]? [Story]? Description with file path`

- T001–T007: Setup phase — no Story label ✓
- T008: Foundational phase — US1 label for clarity (it unblocks US2 styling) ✓
- T009–T010: US1 label ✓
- T011–T012: US2 label ✓
- T013: US3 label ✓
- T014–T016: Polish phase — no Story label ✓

**Total tasks**: 16  
**US1**: T001–T010 (10 tasks)  
**US2**: T011–T012 (2 tasks)  
**US3**: T013 (1 task)  
**Polish**: T014–T016 (3 tasks)  
**Parallel opportunities**: T002–T007 (Phase 1), T013+T014+T015 (Phase 5/Polish)  
**Suggested MVP scope**: Phase 1 + Phase 2 + Phase 3 (T001–T010)
