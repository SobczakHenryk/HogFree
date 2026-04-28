# Quickstart: Donation Button in Settings

**Feature**: 013-donation-button  
**Date**: 2026-03-20

---

## Prerequisites

- Existing PostHogMobile project running with Expo ~54
- `expo-linking` already installed (~8.0.11)
- `expo-haptics` already installed (^15.0.8)
- Ko-fi account created with a public page URL

## Setup Steps

### 1. Create donation banner image asset

Place a banner image at:
```
app/PostHogMobile/src/assets/donation-banner.png
```

Recommended specs:
- Format: PNG (with transparency or dark background)
- Dimensions: 1080×540 (2:1 aspect ratio) or 1080×360 (3:1)
- Include @2x and @3x variants for high-DPI screens
- Keep file size under 200KB
- Design should work on dark (#0D0D0D) background

### 2. Add the Ko-fi URL constant

In `src/constants/index.ts`, add:
```typescript
export const KOFI_URL = 'https://ko-fi.com/YOUR_USERNAME';
```

Replace `YOUR_USERNAME` with your actual Ko-fi handle.

### 3. Add i18n translation keys

Add the donation section keys to both `src/i18n/locales/es.ts` and `en.ts` under the `settings` namespace. See `contracts/donation-section.md` for exact key definitions.

### 4. Create DonationBanner component

Create `src/components/DonationBanner.tsx` with:
- Pressable wrapper with `active:opacity-70`
- Image component with local `require()` source
- Error fallback (text button when image fails)
- Accept `onPress`, `accessibilityLabel`, `fallbackText` props

Export from `src/components/index.ts`.

### 5. Integrate into Settings screen

In `src/app/(tabs)/settings.tsx`:
- Import `DonationBanner`, `KOFI_URL`, `expo-linking`
- Add donation section after the language section
- Handle press with haptic feedback + URL open

## Verification

1. Open Settings screen and scroll to bottom
2. Verify "Support the app" section is visible with banner image
3. Tap the banner — external browser should open Ko-fi page
4. Switch language — verify all donation texts update
5. Test with no network — banner should still display (local asset)

## Files Modified

| File | Action |
|------|--------|
| `src/constants/index.ts` | Add `KOFI_URL` constant |
| `src/i18n/locales/es.ts` | Add 4 donation keys to `settings` |
| `src/i18n/locales/en.ts` | Add 4 donation keys to `settings` |
| `src/i18n/types.ts` | Add new keys to `TranslationKey` type |
| `src/components/DonationBanner.tsx` | **New file** — banner component |
| `src/components/index.ts` | Export `DonationBanner` |
| `src/app/(tabs)/settings.tsx` | Add donation section |
| `src/assets/donation-banner.png` | **New file** — banner image asset |
