# Implementation Plan: 016 — Dashboard UI Refactor

**Status**: Implemented  
**Spec**: [spec.md](./spec.md)

---

## Phase 1 — Color Palette & Constants

**Goal**: Replace the entire color foundation of the app from orange/purple to teal/blue-to-teal.

### Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Primary accent | `#2DD4BF` (Teal 400) | Modern SaaS analytics aesthetic; good contrast on dark surfaces |
| Gradient start | `#3B82F6` (Blue 500) | Complementary to teal; creates sophisticated gradient |
| Gradient end | `#2DD4BF` (Teal 400) | Matches primary accent |
| Trend up | `#22C55E` (Green 500) | Standard financial/analytics positive color |
| Trend down | `#EF4444` (Red 500) | Standard financial/analytics negative color |

### Steps

1. Update `tailwind.config.js` — Replace `primary`, add `trend.up`/`trend.down`.
2. Update `constants/index.ts` — `CHART_PRIMARY_COLOR`, add `CHART_GRADIENT_START`, `CHART_GRADIENT_END`, `TEAL_PRIMARY`, update `BREAKDOWN_COLORS`.
3. Update `(tabs)/_layout.tsx` — `tabBarActiveTintColor` to `#2DD4BF`.
4. Bulk replace all remaining `#F54E00` and `#7B61FF` in `/src/`.

---

## Phase 2 — Data Model & Types

**Goal**: Extend `DashboardMetric` for displayName and lineChartMode.

### Steps

1. Add `displayName?: string` to `DashboardMetric` in `types/dashboard.ts`.
2. Add `LineChartMode = 'line' | 'cumulative'` type.
3. Add `lineChartMode?: LineChartMode` to `DashboardMetric`.
4. Re-export `LineChartMode` from `types/index.ts`.
5. Update `useDashboardConfig.updateMetric` Partial Pick to include `displayName`.

---

## Phase 3 — Widget Components

**Goal**: Refactor all four widget types with grip handle, displayName, visual improvements.

### Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Grip icon | `GripVertical` from lucide-react-native | 6-dot pattern, standard drag affordance |
| Grip position | Far right | Consistent with mobile platform conventions |
| Active scale | `0.98` | Subtle shrink on lift, more polished than ScaleDecorator |
| Active elevation | `12` | Strong shadow during drag |
| DisplayName caption | eventName in gray below title | Only shows when displayName is set |

### Steps

1. **MetricCard.tsx** — Replace Ionicons reorder-three with GripVertical. Add displayName/caption rendering. Add TrendIndicator component. Bold 36px numeric. Active card style (scale, elevation, shadow).
2. **BarChartWidget.tsx** — GripVertical grip handle. displayName support. `barBorderRadius` from 3 → 8. Active card style.
3. **LineChartWidget.tsx** — GripVertical grip handle. displayName support. Area fill gradient (blue start → teal end, opacity 0.25 → 0.05). Line color to teal.
4. **FunnelChart.tsx** — GripVertical grip handle. displayName support. `interpolateColor` from blue→teal. Conversion arrow padding improvements.

---

## Phase 4 — Dashboard Drag & Drop / Haptics

**Goal**: Enhance drag-and-drop with haptic feedback and remove ScaleDecorator.

### Steps

1. Import `expo-haptics` in `dashboard.tsx`.
2. Remove `ScaleDecorator` import.
3. Wrap `drag()` callback with `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`.
4. Fire `Haptics.impactAsync(ImpactFeedbackStyle.Light)` in `onDragEnd` before persisting order.

---

## Phase 5 — Edit Chart DisplayName

**Goal**: Add displayName input to the edit-chart screen.

### Steps

1. Add `displayName` state to `edit-chart.tsx`.
2. Sync from `existingMetric.displayName` in effect.
3. Include in `hasChanges` check.
4. Persist `trimmedDisplayName` (or undefined if empty) in save handler.
5. Render TextInput section between Name and Event fields.

---

## Phase 6 — i18n

**Goal**: Add displayName-related translation keys.

### Steps

1. Add `displayNameLabel`, `displayNamePlaceholder`, `displayNameHint` to `editChart` in `i18n/types.ts`.
2. Add English translations in `locales/en.ts`.
3. Add Spanish translations in `locales/es.ts`.

---

## Dependencies Added

| Package | Version | Purpose |
|---|---|---|
| `expo-haptics` | `~15.0.8` | Already installed. Haptic feedback on drag. |
| `lucide-react-native` | `^0.577.0` | Already installed. GripVertical icon. |

No new dependencies were required.
