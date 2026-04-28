# Tasks: 016 — Dashboard UI Refactor

**Status**: All tasks completed ✅  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 1 — Color Palette & Constants

- [x] **T-01**: Update `tailwind.config.js` — Replace `primary` color from `#F54E00` → `#2DD4BF`, add `trend.up` (#22C55E) and `trend.down` (#EF4444).
  - File: `tailwind.config.js`

- [x] **T-02**: Update `constants/index.ts` — Set `CHART_PRIMARY_COLOR` to `#2DD4BF`, add `CHART_GRADIENT_START` (#3B82F6), `CHART_GRADIENT_END` (#2DD4BF), `TEAL_PRIMARY` (#2DD4BF), update `BREAKDOWN_COLORS` to `['#2DD4BF', '#3B82F6', '#A78BFA', '#F472B6', '#FBBF24']`.
  - File: `src/constants/index.ts`

- [x] **T-03**: Update `(tabs)/_layout.tsx` — Change `tabBarActiveTintColor` from `#F54E00` to `#2DD4BF`.
  - File: `src/app/(tabs)/_layout.tsx`

- [x] **T-04**: Bulk replace remaining `#F54E00` and `#7B61FF` references across all source files to `#2DD4BF`.
  - Files: `AddMetricSheet.tsx`, `_layout.tsx`, `index.tsx`, `chart-detail.tsx`

---

## Phase 2 — Data Model & Types

- [x] **T-05**: Add `displayName?: string` to `DashboardMetric` interface.
  - File: `src/types/dashboard.ts`

- [x] **T-06**: Add `LineChartMode = 'line' | 'cumulative'` type and `lineChartMode?: LineChartMode` to `DashboardMetric`.
  - File: `src/types/dashboard.ts`

- [x] **T-07**: Re-export `LineChartMode` from `types/index.ts`.
  - File: `src/types/index.ts`

- [x] **T-08**: Update `useDashboardConfig.updateMetric` to accept `displayName` in Partial Pick.
  - File: `src/hooks/useDashboardConfig.ts`

---

## Phase 3 — Widget Components

- [x] **T-09**: Refactor `MetricCard.tsx` — Replace Ionicons reorder-three with GripVertical (lucide). Add displayName/caption rendering. Add TrendIndicator component (▲/▼ percentage). Bold 36px numeric. Active card: scale(0.98), elevation 12, enhanced shadow.
  - File: `src/components/MetricCard.tsx`
  - Depends on: T-02, T-05

- [x] **T-10**: Refactor `BarChartWidget.tsx` — GripVertical grip handle. displayName support. `barBorderRadius` 3 → 8. Active card style.
  - File: `src/components/BarChartWidget.tsx`
  - Depends on: T-02, T-05

- [x] **T-11**: Refactor `LineChartWidget.tsx` — GripVertical grip handle. displayName support. Area fill gradient (CHART_GRADIENT_START → CHART_GRADIENT_END, opacity 0.25 → 0.05). Line color to teal.
  - File: `src/components/LineChartWidget.tsx`
  - Depends on: T-02, T-05

- [x] **T-12**: Refactor `FunnelChart.tsx` — GripVertical grip handle. displayName support. `interpolateColor` from Blue (#3B82F6) → Teal (#2DD4BF). Conversion arrow padding improvements.
  - File: `src/components/FunnelChart.tsx`
  - Depends on: T-02, T-05

---

## Phase 4 — Dashboard Drag & Drop / Haptics

- [x] **T-13**: Update `dashboard.tsx` — Import expo-haptics. Remove ScaleDecorator. Add `Haptics.impactAsync(Medium)` on drag start. Add `Haptics.impactAsync(Light)` on drag end. Update color references.
  - File: `src/app/(tabs)/dashboard.tsx`
  - Depends on: T-09, T-10, T-11, T-12

---

## Phase 5 — Edit Chart DisplayName

- [x] **T-14**: Update `edit-chart.tsx` — Add `displayName` state, sync from existingMetric, include in hasChanges, persist on save, render TextInput field.
  - File: `src/app/edit-chart.tsx`
  - Depends on: T-05, T-08

---

## Phase 6 — i18n

- [x] **T-15**: Add `displayNameLabel`, `displayNamePlaceholder`, `displayNameHint` to `editChart` in `i18n/types.ts`.
  - File: `src/i18n/types.ts`

- [x] **T-16**: Add English translations in `locales/en.ts`.
  - File: `src/i18n/locales/en.ts`

- [x] **T-17**: Add Spanish translations in `locales/es.ts`.
  - File: `src/i18n/locales/es.ts`
