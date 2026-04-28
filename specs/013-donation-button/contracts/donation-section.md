# Contract: DonationBanner Component

**Feature**: 013-donation-button  
**Date**: 2026-03-20  
**Type**: UI Component  

---

## Component: `DonationBanner`

**Location**: `app/PostHogMobile/src/components/DonationBanner.tsx`  
**Exported from**: `app/PostHogMobile/src/components/index.ts`

### Interface

```typescript
interface DonationBannerProps {
  /** Callback when the banner is pressed */
  onPress: () => void;
  /** Accessibility label for screen readers */
  accessibilityLabel: string;
  /** Fallback text shown if the image fails to load */
  fallbackText: string;
}
```

### Behavior

1. Renders a local PNG banner image inside a `Pressable` wrapper.
2. On press: calls `onPress` callback (parent handles URL opening).
3. Visual feedback: `active:opacity-70` via NativeWind (Pressable pressed state).
4. If image fails to load (`onError`): hides the image and shows a styled text button fallback.
5. Follows the card styling pattern: `bg-background-secondary border border-border rounded-2xl`.

### Accessibility

- `accessibilityRole="link"` (navigates to external content)
- `accessibilityLabel` provided by parent via i18n

### Visual Spec

- Full-width image with rounded corners (`rounded-2xl`, `overflow-hidden`)
- Image aspect ratio: flexible (depends on actual banner asset)
- Wrapped in card-style container matching other Settings sections
- Dark theme compatible (transparent PNG or dark-background-aware design)

---

## Constants Contract

**Location**: `app/PostHogMobile/src/constants/index.ts`

### New Exports

```typescript
/** Ko-fi donation page URL */
export const KOFI_URL = 'https://ko-fi.com/ingsobczak';
```

---

## i18n Contract

**Location**: `app/PostHogMobile/src/i18n/locales/es.ts` and `en.ts`

### New Keys (under `settings` namespace)

```typescript
// Spanish (es.ts)
settings: {
  // ... existing keys ...
  donationSection: 'Apoyar la app',
  donationDescription: 'Esta app es totalmente gratis. Si te resulta útil, puedes apoyar su desarrollo con una donación voluntaria.',
  donationLabel: 'Hacer una donación en Ko-fi',
  donationFallback: 'Apoyar con una donación',
}

// English (en.ts)
settings: {
  // ... existing keys ...
  donationSection: 'Support the app',
  donationDescription: 'This app is completely free. If you find it useful, you can support its development with a voluntary donation.',
  donationLabel: 'Make a donation on Ko-fi',
  donationFallback: 'Support with a donation',
}
```

### Types Update

New keys must be added to `TranslationKey` type in `src/i18n/types.ts` to maintain type safety.

---

## Integration: Settings Screen

**Location**: `app/PostHogMobile/src/app/(tabs)/settings.tsx`

### Usage Pattern

```typescript
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { DonationBanner } from '../../components';
import { KOFI_URL } from '../../constants';

// Inside SettingsScreen, after language section:
function handleDonation() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  Linking.openURL(KOFI_URL);
}

// JSX:
<Text className="text-text-secondary font-inter-medium text-sm uppercase tracking-widest mb-3 mt-6 px-1">
  {t('settings.donationSection')}
</Text>
<Text className="text-text-secondary font-inter text-sm mb-3 px-1">
  {t('settings.donationDescription')}
</Text>
<DonationBanner
  onPress={handleDonation}
  accessibilityLabel={t('settings.donationLabel')}
  fallbackText={t('settings.donationFallback')}
/>
```
