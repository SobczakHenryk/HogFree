# Contract: Auth Storage & Connection Resolution

**Feature**: 017-self-hosted-support  
**Date**: 2026-03-20

---

## 1. useAuth Hook — Expanded Interface

### Current Interface

```typescript
interface UseAuthReturn extends ApiKeyState {
  validateAndStore: (key: string, cloudRegion: PostHogCloud) => Promise<void>;
  updateApiKey: (key: string, cloudRegion: PostHogCloud) => Promise<void>;
  deleteApiKey: () => Promise<void>;
  clearError: () => void;
}
```

### New Interface

```typescript
interface UseAuthReturn extends ApiKeyState {
  validateAndStore: (key: string, cloudRegion: PostHogCloud, selfHostedUrl?: string) => Promise<void>;
  updateApiKey: (key: string, cloudRegion: PostHogCloud, selfHostedUrl?: string) => Promise<void>;
  deleteApiKey: () => Promise<void>;
  clearError: () => void;
}
```

**Changes**:
- `validateAndStore` and `updateApiKey` accept optional `selfHostedUrl` as third parameter.
- `ApiKeyState` now includes `selfHostedUrl: string | null` (from data model).
- When `cloudRegion === 'self-hosted'`, `selfHostedUrl` is required (will error if missing).
- On boot, `selfHostedUrl` is loaded from SecureStore key `POSTHOG_SELF_HOSTED_URL`.
- On `deleteApiKey`, the `POSTHOG_SELF_HOSTED_URL` key is also deleted from SecureStore.

### Storage Flow

```
validateAndStore('phx_abc...', 'self-hosted', 'https://posthog.example.com')
  ├── 1. Validate URL format (utils/url.ts)
  ├── 2. Validate API key format (existing regex)
  ├── 3. Call getProjects(key, 'self-hosted', 'https://posthog.example.com')
  ├── 4. SecureStore.setItemAsync('POSTHOG_API_KEY', key)
  ├── 5. SecureStore.setItemAsync('POSTHOG_CLOUD', 'self-hosted')
  ├── 6. SecureStore.setItemAsync('POSTHOG_SELF_HOSTED_URL', 'https://posthog.example.com')
  └── 7. setState({ hasApiKey: true, cloudRegion: 'self-hosted', selfHostedUrl: '...', ... })
```

### Boot Flow

```
useEffect (mount)
  ├── SecureStore.getItemAsync('POSTHOG_API_KEY')
  ├── SecureStore.getItemAsync('POSTHOG_CLOUD')
  ├── SecureStore.getItemAsync('POSTHOG_SELF_HOSTED_URL')
  └── setState based on loaded values
```

---

## 2. getPostHogApiHost — Expanded Signature

### Current

```typescript
export function getPostHogApiHost(cloud: PostHogCloud): string {
  return POSTHOG_CLOUD_HOSTS[cloud];
}
```

### New

```typescript
export function getPostHogApiHost(cloud: PostHogCloud, selfHostedUrl?: string): string {
  if (cloud === 'self-hosted') {
    if (!selfHostedUrl) throw new Error('selfHostedUrl required when cloud is self-hosted');
    return selfHostedUrl;
  }
  return POSTHOG_CLOUD_HOSTS[cloud];
}
```

**Callers must update**: All functions in `posthog-api.ts` that call `getPostHogApiHost(cloudRegion)` need to pass `selfHostedUrl` as second arg.

---

## 3. posthog-api.ts — Function Signature Changes

All exported functions add `selfHostedUrl?: string` parameter and pass it to `getPostHogApiHost()`:

```typescript
// Before
export async function getProjects(apiKey: string, cloudRegion: PostHogCloud): Promise<PostHogProjectInfo>

// After
export async function getProjects(apiKey: string, cloudRegion: PostHogCloud, selfHostedUrl?: string): Promise<PostHogProjectInfo>
```

Same pattern for: `getEventDefinitions`, `getPropertyDefinitions`, `queryMetricValue`, `queryMetricSeries`, `queryBreakdownSeries`, `queryFunnel`.

**No behavioral change** for cloud callers — `selfHostedUrl` defaults to `undefined` and `getPostHogApiHost('us', undefined)` returns `'https://us.posthog.com'` as before.

---

## 4. URL Validation Contract (`utils/url.ts`)

```typescript
export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl: string | null;
  /** i18n key for the error message. null if valid. */
  errorKey: string | null;
}

/**
 * Validates and sanitizes a self-hosted URL.
 * Pure function — no side effects, no network calls.
 */
export function validateSelfHostedUrl(raw: string): UrlValidationResult;
```

### Validation Rules (in order)

1. Trim whitespace → empty string → `{ isValid: false, errorKey: 'selfHosted.errors.emptyUrl' }`
2. Parse with `new URL()` → parse failure → `{ isValid: false, errorKey: 'selfHosted.errors.invalidFormat' }`
3. Check `url.protocol === 'https:'` → not HTTPS → `{ isValid: false, errorKey: 'selfHosted.errors.httpsRequired' }`
4. Check `url.username === '' && url.password === ''` → has credentials → `{ isValid: false, errorKey: 'selfHosted.errors.credentialsNotAllowed' }`
5. Build sanitized URL: `url.origin + url.pathname` with trailing slash removed → `{ isValid: true, sanitizedUrl: result }`

---

## 5. i18n Keys Added

```typescript
selfHosted: {
  label: 'Self-Hosted URL',          // en
  placeholder: 'https://posthog.example.com',
  errors: {
    emptyUrl: 'Please enter your instance URL',
    invalidFormat: 'Invalid URL format',
    httpsRequired: 'HTTPS is required',
    credentialsNotAllowed: 'URLs with embedded credentials are not allowed',
    instanceUnreachable: 'Could not connect to the instance',
    notPosthogInstance: 'This does not appear to be a PostHog instance',
  },
}
```

Spanish equivalents added to `es.ts`.
