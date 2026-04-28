# Data Model: Self-Hosted Support

**Feature**: 017-self-hosted-support  
**Date**: 2026-03-20

---

## Entities

### PostHogCloud (modified)

**Current definition** (`src/types/index.ts`):
```typescript
export type PostHogCloud = 'us' | 'eu';
```

**New definition**:
```typescript
export type PostHogCloud = 'us' | 'eu' | 'self-hosted';
```

- **Fields**: Literal string union — no additional fields.
- **Validation**: `isPostHogCloud()` type guard updated to also accept `'self-hosted'`.
- **Relationships**: Used by `ApiKeyState`, `PostHogProjectInfo`, all API service functions, `CloudRegionSelector`, `useAuth`.

---

### ApiKeyState (modified)

**Current definition** (`src/types/index.ts`):
```typescript
export interface ApiKeyState {
  hasApiKey: boolean;
  maskedValue: string | null;
  cloudRegion: PostHogCloud;
  isLoading: boolean;
  error: ApiKeyError | null;
}
```

**New definition** — adds `selfHostedUrl`:
```typescript
export interface ApiKeyState {
  hasApiKey: boolean;
  maskedValue: string | null;
  cloudRegion: PostHogCloud;
  /** URL de la instancia self-hosted. null cuando cloudRegion es 'us' o 'eu'. */
  selfHostedUrl: string | null;
  isLoading: boolean;
  error: ApiKeyError | null;
}
```

- **Validation**: `selfHostedUrl` must be a valid HTTPS URL when `cloudRegion === 'self-hosted'`; must be `null` otherwise.
- **State transitions**: Set during `validateAndStore`/`updateApiKey`; cleared on `deleteApiKey` or when switching to cloud region.

---

### ApiKeyErrorCode (modified)

**Current definition** (`src/types/index.ts`):
```typescript
export type ApiKeyErrorCode =
  | 'EMPTY'
  | 'INVALID_FORMAT'
  | 'INVALID_KEY'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'SECURE_STORE_UNAVAILABLE';
```

**New definition** — adds self-hosted-specific codes:
```typescript
export type ApiKeyErrorCode =
  | 'EMPTY'
  | 'INVALID_FORMAT'
  | 'INVALID_KEY'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'SECURE_STORE_UNAVAILABLE'
  | 'INVALID_URL'
  | 'INSTANCE_UNREACHABLE'
  | 'NOT_POSTHOG_INSTANCE';
```

---

### SecureStore Keys

| Key | Value | When Used |
|-----|-------|-----------|
| `POSTHOG_API_KEY` | Personal API Key string | Always (existing) |
| `POSTHOG_CLOUD` | `'us'` \| `'eu'` \| `'self-hosted'` | Always (modified — new value) |
| `POSTHOG_SELF_HOSTED_URL` | `'https://posthog.example.com'` | Only when cloud is `'self-hosted'` (new) |

---

### URL Validation Rules (new — `utils/url.ts`)

| Rule | Input | Output | Error |
|------|-------|--------|-------|
| Trim whitespace | `'  https://ph.co  '` | `'https://ph.co'` | — |
| Remove trailing slash | `'https://ph.co/'` | `'https://ph.co'` | — |
| Require HTTPS | `'http://ph.co'` | — | `INVALID_URL` (HTTPS required) |
| Valid URL format | `'not-a-url'` | — | `INVALID_URL` (invalid format) |
| No embedded credentials | `'https://u:p@ph.co'` | — | `INVALID_URL` (credentials not allowed) |
| Accept ports | `'https://ph.co:8443'` | `'https://ph.co:8443'` | — |
| Accept sub-paths | `'https://co.com/posthog'` | `'https://co.com/posthog'` | — |

---

## Constants (modified — `constants/index.ts`)

| Constant | Value | Notes |
|----------|-------|-------|
| `SELF_HOSTED_URL_KEY` | `'POSTHOG_SELF_HOSTED_URL'` | New SecureStore key |
| `POSTHOG_CLOUD_LABELS['self-hosted']` | `'Self-Hosted'` | New label entry |
| `isPostHogCloud()` | Accepts `'self-hosted'` | Modified type guard |
| `getPostHogApiHost()` | New signature with optional `selfHostedUrl` | Returns `selfHostedUrl` when cloud is `'self-hosted'` |
| `API_KEY_ERRORS.INVALID_URL` | `'errors.invalidUrl'` | New i18n key |
| `API_KEY_ERRORS.INSTANCE_UNREACHABLE` | `'errors.instanceUnreachable'` | New i18n key |
| `API_KEY_ERRORS.NOT_POSTHOG_INSTANCE` | `'errors.notPosthogInstance'` | New i18n key |
