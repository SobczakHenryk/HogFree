---
description: "Task list for 003-metrics-dashboard feature"
---

# Tasks: Metrics Dashboard

**Input**: `specs/003-metrics-dashboard/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not requested. No test tasks included.

**Organization**: Tasks grouped by user story to enable independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User story this task belongs to (US1–US5)
- All paths relative to `app/PostHogMobile/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm no new package installations are needed before implementing.

- [X] T001 Verify all required packages exist in app/PostHogMobile/package.json — @gorhom/bottom-sheet, @shopify/flash-list, date-fns, expo-haptics, react-native-gesture-handler, ky, @tanstack/react-query, @react-native-async-storage/async-storage, react-native-safe-area-context

**Checkpoint**: All dependencies confirmed present — no `npm install` required

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, constants, base services, and the project-info hook that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Add `DASHBOARD_METRICS_CONFIG_KEY = 'DASHBOARD_METRICS_CONFIG'` and `POSTHOG_PROJECT_INFO_KEY = 'POSTHOG_PROJECT_INFO'` to `src/constants/index.ts`
- [X] T003 [P] Create `src/types/dashboard.ts` with all interfaces: `TimeFilter`, `ChartType`, `DashboardMetric`, `PostHogEvent`, `MetricValue`, `PostHogProjectInfo`, `DashboardConfig`
- [X] T004 Update `src/types/index.ts` to re-export all types from `src/types/dashboard.ts`
- [X] T005 [P] Create `src/services/posthog-api.ts` with three functions: `getProjects(apiKey)`, `getEventDefinitions(apiKey, projectId)`, `queryMetricValue(apiKey, projectId, eventName, dateRange)`
- [X] T006 Extend `src/services/posthog.ts` to call `getProjects()` after successful API key validation and persist the first `PostHogProjectInfo` result to AsyncStorage under `POSTHOG_PROJECT_INFO_KEY`
- [X] T007 [P] Create `src/hooks/useProjectInfo.ts` that reads `PostHogProjectInfo` from AsyncStorage using `POSTHOG_PROJECT_INFO_KEY`

**Checkpoint**: Foundation ready — all user stories can now begin

---

## Phase 3: User Stories 1 & 2 — Ver métricas / Filtrar por período (Priority: P1) 🎯 MVP

**US1 Goal**: User sees a list of MetricCards on the dashboard tab, each showing a large number (event count) and a label.
**US2 Goal**: User can tap a time filter chip to change the period shown on all MetricCards simultaneously.

**Independent Test**: Run the app, navigate to the Dashboard tab, see MetricCards (or empty state). Change time filter and confirm card labels update their displayed period. All data comes from local TanStack Query cache — no real network required for initial render if cache is populated.

### Implementation for US1 & US2

- [X] T008 [P] [US1] Create `src/hooks/useDashboardConfig.ts` with `useMetrics()` (read), `addMetric(metric)`, and `removeMetric(id)` backed by AsyncStorage `DASHBOARD_METRICS_CONFIG_KEY`
- [X] T009 [P] [US1] Create `src/hooks/useMetricValue.ts` using `useQuery` with `queryKey: ['metric', metricId, timeFilter]`, `staleTime: Infinity`, `gcTime: 24 * 60 * 60 * 1000`, calling `posthogApi.queryMetricValue()`
- [X] T010 [P] [US2] Create `src/components/TimeFilterBar.tsx` with 8 horizontally-scrollable chips: Hoy / Ayer / 7d / 15d / 30d / 90d / 180d / Histórico
- [X] T011 [P] [US1] Create `src/components/MetricCard.tsx` displaying BoldNumber (count), event label, and last-refreshed timestamp; handle isLoading (skeleton), isError (error badge), and success states
- [X] T012 [P] [US1] Create `src/components/DashboardEmptyState.tsx` with descriptive text and a call-to-action prompt to add the first metric
- [X] T013 [US1] Create `src/app/(tabs)/dashboard.tsx` orchestrating: `TimeFilterBar` (top), `FlashList` of `MetricCard` items from `useDashboardConfig`, `DashboardEmptyState` when list is empty, and a `RefreshControl` stub (no logic yet)
- [X] T014 [US1] Add Dashboard tab to `src/app/(tabs)/_layout.tsx` with `grid-2x2` (or `layout-grid`) icon from `@expo/vector-icons`

**Checkpoint**: Dashboard tab is visible with MetricCards, empty state, and time filter — fully functional with cached data

---

## Phase 4: User Story 3 — Añadir nueva métrica al dashboard (Priority: P2)

**US3 Goal**: User taps the "+" FAB button, browses a searchable list of PostHog events, selects one, confirms the MetricCard chart type, and the new card appears on the dashboard. The bottom sheet respects the device's top safe area (FR-019).

**Independent Test**: Tap "+", see event list load from cache or network, select an event, confirm selection, close sheet — new MetricCard appears on dashboard and persists after app reload. On devices with notch/Dynamic Island, the expanded sheet must not exceed the top safe area inset.

### Implementation for US3

- [X] T015 [P] [US3] Create `src/hooks/useEventDefinitions.ts` using `useQuery` with `queryKey: ['event_definitions', projectId]`, `staleTime: 5 * 60 * 1000`, `gcTime: 30 * 60 * 1000`, calling `posthogApi.getEventDefinitions()`
- [X] T016 [US3] Create `src/components/AddMetricSheet.tsx` as a two-step `@gorhom/bottom-sheet`: Step 1 — `FlashList` of `PostHogEvent` items from `useEventDefinitions`; Step 2 — chart type confirmation (MetricCard only for now) with an "Añadir" confirm button
- [X] T017 [US3] Implement FR-019 safe area in `src/components/AddMetricSheet.tsx`: import `useSafeAreaInsets` from `react-native-safe-area-context`, read `top` inset, and pass `topInset={top}` prop to the `<BottomSheet>` component so the expanded sheet does not overlap the notch / Dynamic Island
- [X] T018 [US3] Add FAB "+" button to `src/app/(tabs)/dashboard.tsx` that opens `AddMetricSheet`; on confirmation call `useDashboardConfig.addMetric()` and mount a new `useMetricValue` query for the added metric

**Checkpoint**: Full add-metric flow works end-to-end, persists across app restarts, and respects safe area on all devices

---

## Phase 5: User Story 5 — Eliminar métricas del dashboard (Priority: P2)

**US5 Goal**: User long-presses a MetricCard, receives haptic feedback, confirms deletion in an Alert dialog, and the card is removed permanently from the dashboard.

**Independent Test**: Long-press a MetricCard → feel haptic → see Alert with "Eliminar" and "Cancelar" → tap "Eliminar" → card disappears and is gone after app reload. Tap "Cancelar" → nothing changes.

### Implementation for US5

- [X] T019 [US5] Add `onLongPress` prop to `src/components/MetricCard.tsx` that calls `expo-haptics.impactAsync(ImpactFeedbackStyle.Medium)` then shows `Alert.alert()` with "Eliminar métrica" title, "Cancelar" and "Eliminar" buttons
- [X] T020 [US5] Implement `removeMetric(id)` in `src/hooks/useDashboardConfig.ts`: filter metric from list, recalculate `position` values, persist updated array to AsyncStorage, and call `queryClient.removeQueries({ queryKey: ['metric', id] })`
- [X] T021 [US5] Wire deletion in `src/app/(tabs)/dashboard.tsx`: pass `onDelete` callback to each `MetricCard` that calls `useDashboardConfig.removeMetric(id)`

**Checkpoint**: Long-press deletion works, cache is cleared, and metrics do not reappear after deletion

---

## Phase 6: User Story 4 — Actualizar datos vía pull-to-refresh (Priority: P2)

**US4 Goal**: User pulls down on the dashboard to trigger a fresh API call for all visible MetricCards. Errors during refresh are surfaced without losing cached data.

**Independent Test**: Disconnect from network → pull to refresh → see spinner → reconnect → pull to refresh → see updated values. While offline, existing cached values remain visible.

### Implementation for US4

- [X] T022 [US4] Implement `handleRefresh()` in `src/app/(tabs)/dashboard.tsx`: set `refreshing: true`, call `queryClient.invalidateQueries({ queryKey: ['metric'] })`, await refetch, set `refreshing: false`; wire to `RefreshControl` `onRefresh` and `refreshing` props on the `FlashList`
- [X] T023 [US4] Add error feedback in `src/app/(tabs)/dashboard.tsx` for refresh failures: catch errors from `handleRefresh`, display an inline error banner (or `Alert.alert`) informing the user that the refresh failed; cached values remain visible

**Checkpoint**: Pull-to-refresh triggers re-fetch of all metrics, respects offline state, and surfaces errors gracefully

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Export wiring, refined UI states, and edge-case coverage.

- [X] T024 [P] Export `MetricCard`, `TimeFilterBar`, `AddMetricSheet`, `DashboardEmptyState` from `src/components/index.ts`
- [X] T025 [P] Export `useDashboardConfig`, `useMetricValue`, `useEventDefinitions`, `useProjectInfo` from `src/hooks/index.ts`
- [X] T026 [P] Refine skeleton loading state in `src/components/MetricCard.tsx` — show animated placeholder when `isLoading: true` and no cached data is present (first-ever load)
- [X] T027 [P] Refine isolated error state in `src/components/MetricCard.tsx` — show error icon + short message when `isError: true` and cache is empty (no stale data to display)
- [ ] T028 Verify `DashboardEmptyState` renders in `src/app/(tabs)/dashboard.tsx` when the metrics array is empty after all cards have been deleted

**Checkpoint**: All UI states covered, exports consistent, edge cases handled

---

## Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational)
        ├── Phase 3 (US1 & US2 — P1) ← MVP deliverable
        │     └── Phase 4 (US3 — add metric + FR-019 safe area)
        │           └── Phase 5 (US5 — delete metric)
        │                 └── Phase 6 (US4 — pull-to-refresh)
        │                       └── Phase 7 (Polish)
        └── Phase 3 also unblocks Phase 4, 5, 6 in parallel once US1 is done
```

**User Story completion order**: US1+US2 → US3 → US5 → US4

**[P] tasks within a phase** (parallel-safe grouped by phase):

```
Phase 2 parallel group:  T003, T005, T007 (all different files, no intra-group deps)
Phase 3 parallel group:  T008, T009, T010, T011, T012 (all different files)
Phase 4 parallel group:  T015 (independent of T016, T017, T018)
Phase 7 parallel group:  T024, T025, T026, T027
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 + US2
4. **STOP and VALIDATE**: Open the Dashboard tab, confirm MetricCards render with cached data, confirm time filters update state
5. Demo to stakeholders if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 → Dashboard tab functional with cached metrics → **MVP Demo**
3. US3 → Add metric flow complete (including FR-019 safe area) → Demo: full add flow
4. US5 → Deletion flow complete → Demo: add + delete
5. US4 → Pull-to-refresh complete → Demo: full feature
6. Polish → Production-ready

### Parallel Execution (Phase 3 example)

```bash
# All of these can run simultaneously (different files, no dependencies):
T008 → useDashboardConfig.ts
T009 → useMetricValue.ts
T010 → TimeFilterBar.tsx
T011 → MetricCard.tsx
T012 → DashboardEmptyState.tsx

# These depend on all 5 above being complete:
T013 → dashboard.tsx (orchestrates everything above)
T014 → _layout.tsx (adds tab once dashboard.tsx exists)
```

---

## Notes

- `[P]` tasks = different files, no intra-phase dependencies — safe to run in parallel
- `staleTime: Infinity` on `['metric', ...]` queries is a justified exception to the constitution's 1h default (required by FR-011: data must only update on explicit pull-to-refresh)
- MetricCard uses `BoldNumber` display pattern from PostHog's own Query API `results[0][0]` response
- `project_id` is discovered automatically the first time the user saves their API key — stored via `useProjectInfo`
- `AddMetricSheet` uses `@gorhom/bottom-sheet` v5 API (not v4) with `topInset` prop for FR-019 safe area compliance
- FR-019: `AddMetricSheet` must pass `topInset={useSafeAreaInsets().top}` to `<BottomSheet>` to prevent the expanded sheet from overlapping the notch / Dynamic Island on iPhone; on devices without a notch, `top` resolves to `0` and behavior is unchanged
- All new components follow NativeWind v4 / Tailwind CSS class-based styling (no StyleSheet)
- Dark theme only: `bg-background` (#0D0D0D), `bg-background-secondary` (#1A1A1A), primary `#F54E00`
