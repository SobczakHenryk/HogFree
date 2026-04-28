# Data Model: Donation Button in Settings

**Feature**: 013-donation-button  
**Date**: 2026-03-20

---

## Entities

### DonationConfig (Static — no persistence)

This feature has **no dynamic data model**. All values are static constants defined at build time.

| Field | Type | Value | Notes |
|-------|------|-------|-------|
| `KOFI_URL` | `string` | `https://ko-fi.com/ingsobczak` | Static constant in `constants/index.ts`. |
| `KOFI_PLATFORM_NAME` | `string` | `Ko-fi` | Used for accessibility labels and fallback text. |

### DonationBanner (Component Props)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onPress` | `() => void` | Yes | Callback triggered when banner is pressed |
| `imageSource` | `ImageSourcePropType` | Yes | Local image asset via `require()` |
| `fallbackText` | `string` | Yes | Text shown if image fails to load |
| `accessibilityLabel` | `string` | Yes | Accessibility label for screen readers |

## State Transitions

None. This feature is stateless — it's a static UI element with a single action (open URL).

## Relationships

```
Settings Screen
  └── Donation Section (new)
       ├── Section Title (i18n text)
       ├── Section Description (i18n text)
       └── DonationBanner (component)
            ├── Image (local asset)
            └── Fallback Text (i18n, shown on image load error)
                 └── onPress → Linking.openURL(KOFI_URL) → External Browser
```

## Validation Rules

- `KOFI_URL` must be a valid `https://` URL (enforced at code review, not runtime — it's a static constant).
- No user input involved — no runtime validation needed.
