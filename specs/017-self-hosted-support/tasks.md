# Tasks: Self-Hosted Support

**Input**: Design documents from `/specs/017-self-hosted-support/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/auth-storage.md ✅, quickstart.md ✅

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Mobile app**: `app/PostHogMobile/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Types, utilities, constants, and i18n keys that all user stories depend on

- [X] T001 [P] Expand `PostHogCloud` type to `'us' | 'eu' | 'self-hosted'` and add `selfHostedUrl: string | null` to `ApiKeyState`, add new `ApiKeyErrorCode` values (`INVALID_URL`, `INSTANCE_UNREACHABLE`, `NOT_POSTHOG_INSTANCE`) in `app/PostHogMobile/src/types/index.ts`
- [X] T002 [P] Create URL validation/sanitization module with `validateSelfHostedUrl()` returning `UrlValidationResult` (trim, trailing slash, HTTPS check, no embedded credentials, `new URL()` parsing) in `app/PostHogMobile/src/utils/url.ts`
- [X] T003 Add `SELF_HOSTED_URL_KEY` constant, add `'self-hosted'` to `POSTHOG_CLOUD_LABELS`, update `isPostHogCloud()` to accept `'self-hosted'`, update `getPostHogApiHost()` signature to `(cloud, selfHostedUrl?)`, add `INVALID_URL`/`INSTANCE_UNREACHABLE`/`NOT_POSTHOG_INSTANCE` to `API_KEY_ERRORS` in `app/PostHogMobile/src/constants/index.ts`
- [X] T004 [P] Add `selfHosted.*` i18n keys (label, placeholder, error messages for emptyUrl, invalidFormat, httpsRequired, credentialsNotAllowed, instanceUnreachable, notPosthogInstance) in English in `app/PostHogMobile/src/i18n/locales/en.ts`
- [X] T005 [P] Add `selfHosted.*` i18n keys (label, placeholder, error messages) in Spanish in `app/PostHogMobile/src/i18n/locales/es.ts`

**Checkpoint**: Types, URL utils, constants, and i18n foundation ready. No behavioral changes yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Service layer and hook changes that MUST be complete before ANY user story UI can work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Add `selfHostedUrl?: string` parameter to all exported functions (`getProjects`, `getEventDefinitions`, `getPropertyDefinitions`, `queryMetricValue`, `queryMetricSeries`, `queryBreakdownSeries`, `queryFunnelInsight`) and pass it to `getPostHogApiHost(cloudRegion, selfHostedUrl)` in `app/PostHogMobile/src/services/posthog-api.ts`
- [X] T007 Update `validateApiKey()` and `fetchAndSaveProjectInfo()` to accept and forward `selfHostedUrl?: string` parameter to `getProjects()`, add error mapping for self-hosted-specific failures (`INSTANCE_UNREACHABLE` for connection errors to non-cloud hosts, `NOT_POSTHOG_INSTANCE` for unexpected responses) in `app/PostHogMobile/src/services/posthog.ts`
- [X] T008 Update `useAuth` hook: add `selfHostedUrl` to state, load `POSTHOG_SELF_HOSTED_URL` from SecureStore on boot, update `validateAndStore` and `updateApiKey` signatures to accept `selfHostedUrl?: string`, persist/clear `POSTHOG_SELF_HOSTED_URL` in SecureStore, validate URL via `validateSelfHostedUrl()` before network call when `cloudRegion === 'self-hosted'` in `app/PostHogMobile/src/hooks/useAuth.tsx`
- [X] T009 Update all hooks that call API service functions (`useDashboard`, `useInsights`, or similar) to pass `selfHostedUrl` from auth context alongside `cloudRegion` — grep for `getProjects|getEventDefinitions|getPropertyDefinitions|queryMetricValue|queryMetricSeries|queryBreakdownSeries|queryFunnelInsight` usage in `app/PostHogMobile/src/hooks/`

**Checkpoint**: Foundation ready — all API calls resolve the correct host for cloud and self-hosted. User story UI implementation can begin.

---

## Phase 3: User Story 1 — Conexión a instancia self-hosted (Priority: P1) 🎯 MVP

**Goal**: A user with a self-hosted PostHog instance can select "Self-Hosted", enter their URL and API Key, validate, and access the app.

**Independent Test**: Select "Self-Hosted" in region selector, enter a valid HTTPS self-hosted URL, enter a valid API Key, tap Save, verify navigation to dashboard. Also verify error states: HTTP URL rejected, invalid format rejected, unreachable instance shows differentiated error.

### Implementation for User Story 1

- [X] T010 [P] [US1] Create `SelfHostedUrlInput` component with `TextInput` for URL, inline validation feedback (format errors shown on blur), HTTPS-only enforcement, dark/light theme support via NativeWind classes in `app/PostHogMobile/src/components/SelfHostedUrlInput.tsx`
- [X] T011 [US1] Update `CloudRegionSelector` to add `'self-hosted'` to `CLOUD_OPTIONS` array, render `SelfHostedUrlInput` below the selector when `'self-hosted'` is selected, pass URL value and onChange handler via new props (`selfHostedUrl`, `onSelfHostedUrlChange`) in `app/PostHogMobile/src/components/CloudRegionSelector.tsx`
- [X] T012 [US1] Update `ApiKeyScreen` (or the screen that uses `CloudRegionSelector` + save button) to pass `selfHostedUrl` to `validateAndStore()` when cloud region is `'self-hosted'`, display self-hosted-specific errors from `useAuth` in `app/PostHogMobile/src/app/` (locate the API key screen file)

**Checkpoint**: User Story 1 complete — self-hosted users can configure and connect. Cloud users see the new option but their flow is unchanged.

---

## Phase 4: User Story 2 — Experiencia cloud sin cambios (Priority: P2)

**Goal**: Existing US Cloud and EU Cloud users experience zero changes after the update. Their saved configuration loads correctly and all API calls continue working.

**Independent Test**: With an existing US Cloud or EU Cloud config saved in SecureStore, open the app and verify it navigates directly to the dashboard without re-configuration. Verify all API calls use the correct cloud host.

### Implementation for User Story 2

- [X] T013 [US2] Verify retrocompatibility: ensure `isPostHogCloud()` still returns `true` for `'us'` and `'eu'`, `getPostHogApiHost('us', undefined)` returns `'https://us.posthog.com'`, `getPostHogApiHost('eu', undefined)` returns `'https://eu.posthog.com'`, and `useAuth` boot flow handles missing `POSTHOG_SELF_HOSTED_URL` key gracefully (sets `selfHostedUrl: null`) — manual verification against code in `app/PostHogMobile/src/constants/index.ts` and `app/PostHogMobile/src/hooks/useAuth.tsx`

**Checkpoint**: User Story 2 verified — existing cloud users unaffected.

---

## Phase 5: User Story 3 — Cambio de cloud a self-hosted (Priority: P3)

**Goal**: A user currently using US/EU Cloud can switch to self-hosted (and vice versa) from the Settings screen.

**Independent Test**: With a US Cloud config saved, go to Settings, change to "Self-Hosted", enter URL and API Key, confirm — verify all API calls now use the self-hosted URL. Then switch back to EU Cloud and verify calls use `eu.posthog.com`.

### Implementation for User Story 3

- [X] T014 [US3] Update Settings screen to use the expanded `CloudRegionSelector` (with `selfHostedUrl` props) and call `updateApiKey` with `selfHostedUrl` when switching to self-hosted — locate and modify the settings screen in `app/PostHogMobile/src/app/` that renders `CloudRegionSelector`
- [X] T015 [US3] Ensure `updateApiKey` in `useAuth` properly clears `POSTHOG_SELF_HOSTED_URL` from SecureStore when switching from self-hosted to cloud, and sets it when switching from cloud to self-hosted in `app/PostHogMobile/src/hooks/useAuth.tsx`

**Checkpoint**: User Story 3 complete — users can switch freely between cloud and self-hosted.

---

## Phase 6: User Story 4 — Actualización de URL self-hosted (Priority: P4)

**Goal**: A user with self-hosted configured can update the URL (e.g., domain migration) and optionally the API Key.

**Independent Test**: With a self-hosted config saved, go to Settings, change the URL to a different valid URL, confirm — verify all API calls use the new URL. Change to an invalid URL and verify the old URL is preserved.

### Implementation for User Story 4

- [X] T016 [US4] Ensure `SelfHostedUrlInput` pre-fills the current `selfHostedUrl` when editing an existing self-hosted configuration in `app/PostHogMobile/src/components/SelfHostedUrlInput.tsx`
- [X] T017 [US4] Ensure the Settings screen pre-fills the current `selfHostedUrl` from auth state when the user already has a self-hosted config, and that validation failure preserves the previous URL in SecureStore (no partial update) in `app/PostHogMobile/src/app/` (settings screen file)

**Checkpoint**: User Story 4 complete — self-hosted URL updates work correctly.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, visual polish, and final validation

- [X] T018 [P] Verify edge cases in `validateSelfHostedUrl()`: trailing slashes, leading/trailing whitespace, ports (`:8443`), sub-paths (`/posthog`), embedded credentials rejection, empty string — review and adjust if needed in `app/PostHogMobile/src/utils/url.ts`
- [X] T019 [P] Verify dark/light theme rendering for `SelfHostedUrlInput` and the expanded `CloudRegionSelector` (3 pills) — check NativeWind `dark:` class variants in `app/PostHogMobile/src/components/SelfHostedUrlInput.tsx` and `app/PostHogMobile/src/components/CloudRegionSelector.tsx`
- [X] T020 [P] Verify i18n: switch between English and Spanish, confirm all `selfHosted.*` keys render correctly in both the ApiKeyScreen and Settings screen
- [X] T021 Run quickstart.md verification scenarios: fresh self-hosted install, cloud user unchanged, cloud→self-hosted switch, error differentiation, theme toggle, i18n switch

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (types, utils, constants) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion — can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Phase 3 (US1 UI components exist)
- **User Story 4 (Phase 6)**: Depends on Phase 5 (switching flow works)
- **Polish (Phase 7)**: Depends on all user story phases being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no other story dependencies
- **US2 (P2)**: Can start after Foundational — no other story dependencies (verification only)
- **US3 (P3)**: Depends on US1 components (`SelfHostedUrlInput`, expanded `CloudRegionSelector`)
- **US4 (P4)**: Depends on US3 (switching flow must exist for URL update to make sense)

### Within Each User Story

- Components before screen integration
- URL input before region selector integration
- Hook updates before UI consumption

### Parallel Opportunities

- T001 ∥ T002 ∥ T004 ∥ T005 (Phase 1: types, utils, i18n — different files)
- T010 can run in parallel with any other Phase 3 task (new file)
- T013 (US2 verification) can run in parallel with US1 implementation
- T018 ∥ T019 ∥ T020 (Phase 7: different concerns, different files)

---

## Parallel Example: Phase 1

```bash
# All Phase 1 tasks touch different files — run in parallel:
Task T001: "Expand PostHogCloud type in src/types/index.ts"
Task T002: "Create URL validation module in src/utils/url.ts"
Task T004: "Add i18n keys in src/i18n/locales/en.ts"
Task T005: "Add i18n keys in src/i18n/locales/es.ts"

# Then T003 (constants) can proceed — depends on T001 for the updated PostHogCloud type
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types, utils, constants, i18n)
2. Complete Phase 2: Foundational (services, hook, API plumbing)
3. Complete Phase 3: User Story 1 (UI components, screen integration)
4. **STOP and VALIDATE**: Test self-hosted connection end-to-end
5. Deploy/demo if ready — cloud users unaffected (US2 is inherent)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Self-hosted users can connect → Deploy/Demo (MVP!)
3. Verify US2 → Confirm cloud users unaffected
4. Add US3 → Cloud↔self-hosted switching works → Deploy/Demo
5. Add US4 → URL updates work → Deploy/Demo
6. Polish → Edge cases, theme, i18n verified

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (UI components + screen)
   - Developer B: User Story 2 (verification) — quick, can then help with US3
3. After US1 complete: US3 → US4 sequentially (dependency chain)
