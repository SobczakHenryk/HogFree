# Implementation Plan: Donation Button in Settings

**Branch**: `013-donation-button` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-donation-button/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add a "Support the App" section to the Settings screen with a visually appealing donation banner/image that opens the developer's Ko-fi page in the device's external browser. The feature uses `expo-linking` (already installed) for external URL opening, `expo-haptics` for tactile feedback, a local image asset bundled in the app, and the existing i18n system for Spanish/English support. No new dependencies required.

## Technical Context

**Language/Version**: TypeScript ~5.9.2 on React Native 0.81.5 / Expo ~54.0.33  
**Primary Dependencies**: `expo-linking` (URL opening), `expo-haptics` (haptic feedback), `react-native` Pressable + Image (UI), NativeWind (styles)  
**Storage**: N/A — no data persistence needed, URL is a static constant  
**Testing**: Manual testing on iOS/Android simulators  
**Target Platform**: iOS and Android via Expo  
**Project Type**: Mobile app (React Native / Expo)  
**Performance Goals**: Banner press → browser open < 2 seconds (SC-002)  
**Constraints**: Offline-capable image (local asset), dark-only theme, portrait orientation  
**Scale/Scope**: Single new section in existing Settings screen, ~1 new component, ~6 new i18n keys

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Mobile-first | PASS | Feature is mobile-native (Pressable, haptics, external browser) |
| Performance over features | PASS | No API calls, no state management, just a local image + URL open |
| Offline-capable | PASS | Image is local asset; URL open handled by OS natively |
| Security by default | PASS | No sensitive data involved; URL is a public static constant |
| Dark-only theme | PASS | Uses existing Tailwind tokens (bg-background-secondary, border-border, etc.) |
| NativeWind styles | PASS | All styling via className Tailwind classes |
| Pressable (not TouchableOpacity) | PASS | Using Pressable with active:opacity-70 pattern |
| Haptics pattern | PASS | Using Haptics.ImpactFeedbackStyle.Light for light action (link open) |
| Inter typography | PASS | Existing font-inter-* classes |
| 8-point spacing | PASS | Consistent with existing Settings sections (px-4, py-4, mt-6, mb-3) |
| expo-linking for deep links | PASS | Already installed ~8.0.11, used for external URL opening |
| Components never call API directly | PASS | No API calls in this feature |
| No class components | PASS | Functional component pattern |
| i18n with useLocale | PASS | New keys added to existing es.ts/en.ts locale files |

**All gates PASS — no violations.**

## Project Structure

### Documentation (this feature)

```text
specs/013-donation-button/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── donation-section.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/PostHogMobile/
├── src/
│   ├── app/
│   │   └── (tabs)/
│   │       └── settings.tsx        # Modified: add donation section
│   ├── components/
│   │   ├── DonationBanner.tsx      # New: donation banner pressable image component
│   │   └── index.ts                # Modified: export DonationBanner
│   ├── constants/
│   │   └── index.ts                # Modified: add KOFI_URL constant
│   ├── i18n/
│   │   └── locales/
│   │       ├── es.ts               # Modified: add donation section keys
│   │       └── en.ts               # Modified: add donation section keys
│   └── assets/
│       └── donation-banner.png     # New: local donation banner image
```

**Structure Decision**: This feature adds a small section to an existing screen. A single new component (`DonationBanner`) encapsulates the image + press behavior. The Ko-fi URL is stored as a constant. No new hooks, services, or screens needed.

## Complexity Tracking

> No violations detected — section intentionally empty.
