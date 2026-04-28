# Feature Specification: Settings Premium Redesign (Apple-Style)

**Feature Branch**: `014-settings-premium-redesign`  
**Created**: 2025-03-20  
**Status**: Implemented  
**Input**: Refactor the Settings screen (Configuración) to follow a modern, premium Apple-style list layout with Lucide icons, Blue-to-Teal gradient accents, grouped cards, API Key eye toggle + copy to clipboard, Dark Mode gradient indicator, and compact donation row with gradient background.

---

## User Scenarios & Testing

### User Story 1 — Premium grouped layout (Priority: P1)

As a user I want the Settings screen to display information in clearly separated, rounded-corner card sections so that the interface feels modern, organised, and easy to scan.

**Why this priority**: The grouped card layout is the structural foundation for every other visual improvement. All other stories depend on having `SectionCard` and `SectionHeader` in place.

**Independent Test**: Open Settings tab after onboarding → verify that API Key, Preferences, Dark Mode, and Support sections render as separate rounded cards with `#1A1A1A` background and `#262626` border on a `#0D0D0D` base.

**Acceptance Scenarios**:

1. **Given** the user has an API key configured, **When** they navigate to Settings, **Then** they see four distinct card sections: API Key, Preferences (language), Dark Mode, and Support.
2. **Given** no API key is configured, **When** the user navigates to Settings, **Then** the API Key section is hidden and the remaining three sections display correctly.
3. **Given** any section, **When** inspected visually, **Then** each card has 16 px border-radius, consistent internal padding, and a subtle border separating it from the background.

---

### User Story 2 — API Key eye toggle & copy (Priority: P1)

As a user I want to reveal or hide my API key value and copy it to the clipboard so that I can manage my credentials securely without leaving the app.

**Why this priority**: Credential management is a core utility of the Settings screen.

**Independent Test**: With a stored API key → tap the eye icon → key characters become visible → tap copy icon → paste elsewhere → value matches.

**Acceptance Scenarios**:

1. **Given** the API key is stored, **When** the user taps the eye icon, **Then** the masked bullets (`•••`) replace letters/digits and toggle back to the actual masked value on a second tap.
2. **Given** the API key is visible, **When** the user taps the copy icon, **Then** the key value is copied to the clipboard, the copy icon turns teal (`#14B8A6`), and it reverts to grey after 2 seconds.
3. **Given** the API key is stored, **When** the user taps eye or copy, **Then** a light haptic feedback (`ImpactFeedbackStyle.Light`) fires.

---

### User Story 3 — Language selector with gradient indicator (Priority: P2)

As a user I want to switch the app language between Spanish and English with a visually distinct active indicator so that it's immediately clear which language is selected.

**Why this priority**: Internationalisation is important but is already functional; this story adds the premium visual treatment.

**Independent Test**: Open Preferences card → observe that the active language has a Blue-to-Teal gradient radio dot → tap the other language → gradient dot moves.

**Acceptance Scenarios**:

1. **Given** the current locale is `es`, **When** the user views the Preferences card, **Then** "Español" shows a gradient radio-dot indicator and "English" is dimmed.
2. **Given** the user taps a non-active language, **When** the selection changes, **Then** light haptic feedback fires and the gradient indicator moves to the newly selected language.

---

### User Story 4 — Dark Mode gradient indicator (Priority: P3)

As a user I want to see a persistent Dark Mode toggle indicator styled with the Blue-to-Teal gradient so that the always-on dark theme feels intentional and polished.

**Why this priority**: Cosmetic enhancement; the app is dark-only so this is an informational indicator, not a functional toggle.

**Independent Test**: Open Settings → Dark Mode card shows a 48×28 pill with Blue-to-Teal gradient and white circle positioned right (always-on).

**Acceptance Scenarios**:

1. **Given** the app is rendered, **When** the user views the Dark Mode card, **Then** a non-interactive gradient toggle pill is displayed in the "on" position.

---

### User Story 5 — Compact support / donation row (Priority: P2)

As a user I want a visually appealing donation prompt within Settings so that I can quickly support the developer without a large banner disrupting the layout.

**Why this priority**: Monetisation row should be visible but not intrusive; the compact card strikes the right balance.

**Independent Test**: Scroll to Support section → tap card → Ko-fi URL opens in external browser.

**Acceptance Scenarios**:

1. **Given** the Support section is visible, **When** the user taps the card, **Then** the Ko-fi URL opens in the system browser with light haptic feedback.
2. **Given** a rapid double-tap, **When** the debounce guard fires, **Then** only one external open is triggered.

---

### Edge Cases

- **Very long API key**: The masked value should truncate with ellipsis and the eye/copy icons remain accessible.
- **Clipboard failure**: If `Clipboard.setStringAsync` rejects, no crash occurs; the copied state simply doesn't activate.
- **Offline state**: Donation link tap when offline may fail to open the browser; no in-app error is shown (OS-level behaviour).
- **Rapid language switching**: Consecutive locale changes do not produce race conditions; only the last selection persists.

---

## Requirements

### Functional Requirements

- **FR-001**: Settings screen MUST use a `SectionCard` wrapper (rounded-2xl, `bg-background-secondary`, `border-border`) for every logical group.
- **FR-002**: Settings screen MUST render a `SectionHeader` label above each major card (uppercase, tracking-widest, `text-text-tertiary`).
- **FR-003**: Each row inside a card MUST follow the `SettingsRow` pattern: 32×32 icon container, label, optional value, optional trailing element, and a chevron when tappable.
- **FR-004**: API Key section MUST display eye toggle (`Eye`/`EyeOff` icons) and copy button (`Copy` icon) beside the masked key value.
- **FR-005**: Copy action MUST write the masked key to clipboard via `expo-clipboard` and change the copy icon color to `#14B8A6` for 2 seconds.
- **FR-006**: Eye toggle MUST swap between bullet-masked (`•`) representation and the stored masked value. MUST trigger light haptic.
- **FR-007**: Instance URL row MUST show the cloud region label from `POSTHOG_CLOUD_LABELS`.
- **FR-008**: Inline edit form for API Key MUST render inside the same `SectionCard`, showing `CloudRegionSelector`, `ApiKeyField`, error text, Cancel button, and a Confirm button with Blue-to-Teal `LinearGradient`.
- **FR-009**: Confirm button inside the edit form MUST show an `ActivityIndicator` while `isLoading` is true and disable interaction.
- **FR-010**: Change and Delete action buttons MUST render below the API Key card as two equal-width rounded buttons; Delete MUST show red text and red border.
- **FR-011**: Language selector MUST render two language rows inside one Preferences card, each with a Lucide icon (`Languages`, `Globe`), and the active locale indicated by a Blue-to-Teal gradient radio dot.
- **FR-012**: Selecting a language MUST fire light haptic and persist the locale via `setLocale`.
- **FR-013**: Dark Mode card MUST display a non-interactive gradient toggle pill (48×28) with a white knob in the "on" position.
- **FR-014**: Support section MUST render a full-width `Pressable` card with a theme-aware gradient background (dark: `#1E293B`→`#0F172A` with `#1E3A5F` border; light: `#F0FDFA`→`#E0F7F3` with `#99F6E4` border), Heart icon in a teal-tinted container, title, subtitle (not truncated — full text visible), and a teal chevron.
- **FR-015**: Donation tap MUST open `KOFI_URL` via `Linking.openURL` with light haptic and debounce guard to prevent double-opens.
- **FR-016**: Version footer MUST render centered below all sections as `PostHog Mobile v0.1.0`.

### Key Entities

- **SectionCard**: Rounded container (`rounded-2xl`, `bg-background-secondary`, `border-border`) that groups related rows.
- **SectionHeader**: Uppercase micro-label displayed above a `SectionCard`.
- **SettingsRow**: Reusable row with icon, label, optional value, optional trailing component, and separator logic (`isLast` prop).
- **Gradient Accent**: Blue-to-Teal `LinearGradient` (`#3B82F6`→`#14B8A6`) used on the confirm button, language radio-dot, and dark-mode toggle.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: All four sections (API Key, Preferences, Dark Mode, Support) render without layout errors on iOS 16+ and Android 13+ devices.
- **SC-002**: Eye toggle correctly hides/reveals the API Key value with no stale state after toggling rapidly.
- **SC-003**: Copy-to-clipboard action writes the correct value and provides visual feedback (teal icon) that auto-reverts after 2 seconds.
- **SC-004**: Language switch persists across app restarts and the gradient indicator updates immediately.
- **SC-005**: Dark Mode pill renders the gradient without visual artefacts and is non-interactive.
- **SC-006**: Donation card tap opens external browser once per tap (debounce) with haptic feedback.
- **SC-007**: iOS bundle rebuilds successfully with no TypeScript errors related to Settings (pre-existing unrelated errors in chart widgets are excluded).

---

## Assumptions

1. The app supports **dark and light themes** via feature `015-dark-light-theme`. Dark Mode card replaced by three-state theme selector.
2. `lucide-react-native` requires CJS resolution via `metro.config.js` `unstable_conditionNames` — already configured.
3. `expo-clipboard` is available and linked via Expo managed workflow.
4. `KOFI_URL` and `POSTHOG_CLOUD_LABELS` are exported from `constants/index.ts`.
5. `useAuth` exposes `maskedValue`, `cloudRegion`, `isLoading`, `error`, `updateApiKey`, `deleteApiKey`, `clearError`.
6. `useLocale` exposes `locale`, `setLocale`, and `t`.

## Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| `lucide-react-native` | latest | Premium line icons (Key, Eye, EyeOff, Copy, Pencil, Trash2, Languages, Globe, Moon, Heart, Server, ChevronRight) |
| `expo-clipboard` | ~7.0 | Copy API key to system clipboard |
| `expo-haptics` | ~14.0 | Haptic feedback on interactions |
| `expo-linking` | ~7.0 | Open Ko-fi URL in external browser |
| `expo-linear-gradient` | ~14.0 | Blue-to-Teal gradient accents |

## Relation to Other Specs

| Spec | Impact |
|---|---|
| `004-settings-safe-area` | **Superseded visually** — layout restructured but `SafeAreaView edges={['top']}` rule preserved. |
| `013-donation-button` | **Superseded** — `DonationBanner` component replaced by inline compact gradient card. |
| `001-api-key-screen` | **Extended** — eye toggle and copy-to-clipboard are additive; existing API key CRUD logic unchanged. |
| `012-i18n-language-support` | **Maintained** — language switching logic unchanged; visual treatment updated. |

## New Internationalisation Keys

| Key | es | en |
|---|---|---|
| `settings.instanceUrl` | Instancia PostHog | PostHog Instance |
| `settings.keyCopied` | API Key copiada | API Key copied |
| `settings.supportDeveloper` | Apoyar al desarrollador | Support the developer |
| `settings.preferencesSection` | Preferencias | Preferences |
| `settings.darkMode` | Modo oscuro | Dark mode |

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `accent.blue` | `#3B82F6` | Gradient start |
| `accent.teal` | `#14B8A6` | Gradient end, copy-active tint |
| `background` | `#0D0D0D` | Screen base |
| `background-secondary` | `#1A1A1A` | Card fill |
| `border` | `#262626` | Card & row separators |
| `text-tertiary` | `#737373` | Chevron, section labels |
