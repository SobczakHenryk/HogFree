# Research: Self-Hosted Support

**Feature**: 017-self-hosted-support  
**Date**: 2026-03-20

---

## R-001: URL Validation Strategy for Self-Hosted Instances

**Decision**: Client-side URL format validation + server-side reachability check via existing `/api/projects/` endpoint.

**Rationale**: 
- PostHog's API is identical between cloud and self-hosted — the `/api/projects/` endpoint already validates both connectivity and API key validity in one call.
- Client-side validation covers: HTTPS protocol, valid URL format (via `new URL()` constructor), no embedded credentials (`userinfo` component), trim + trailing slash removal.
- No need for a separate "ping" endpoint — `getProjects()` already serves as the validation call and is used for cloud regions too.

**Alternatives considered**:
- Fetching `/api/` root or `/_health` for connectivity check before key validation → Rejected. Adds an extra network call. The combined URL+key validation via `/api/projects/` is sufficient and already handles connection errors with differentiated error types (timeout, HTTP errors, network errors).
- Using a regex for URL validation → Rejected. `new URL()` is the standard and more robust approach. Regex for URLs is notoriously error-prone.

---

## R-002: SecureStore Key Strategy for Self-Hosted URL

**Decision**: Store the self-hosted URL in a dedicated SecureStore key `POSTHOG_SELF_HOSTED_URL`, read alongside `POSTHOG_CLOUD` and `POSTHOG_API_KEY` at boot.

**Rationale**:
- The existing pattern uses separate SecureStore keys for API Key (`POSTHOG_API_KEY`) and cloud region (`POSTHOG_CLOUD`). Adding a third key `POSTHOG_SELF_HOSTED_URL` follows the same pattern.
- When cloud region is `'us'` or `'eu'`, the URL key is ignored (may be stale from a previous self-hosted config — harmless).
- When cloud region is `'self-hosted'`, the URL key is required and used as the API host.
- On deletion/logout, all three keys are cleared.

**Alternatives considered**:
- Encoding URL inside the cloud region value (e.g., `self-hosted:https://...`) → Rejected. Breaks `isPostHogCloud()` type guard and complicates parsing.
- Storing URL in AsyncStorage instead of SecureStore → Rejected. While the URL isn't as sensitive as the API key, the constitution mandates SecureStore for connection configuration. Keeping it in SecureStore also ensures it survives the same lifecycle as the API key.

---

## R-003: PostHogCloud Type Expansion Strategy

**Decision**: Expand `PostHogCloud = 'us' | 'eu' | 'self-hosted'`.

**Rationale**:
- The type is used throughout the codebase as the discriminator for connection mode. Adding `'self-hosted'` as a literal keeps it a simple union type.
- `getPostHogApiHost()` needs a second parameter (or a lookup mechanism) when cloud is `'self-hosted'` — the cleanest approach is to change its signature to accept the optional self-hosted URL and return it when cloud is `'self-hosted'`.
- `isPostHogCloud()` must be updated to also accept `'self-hosted'`.
- `POSTHOG_CLOUD_HOSTS` map doesn't need a `'self-hosted'` entry — the URL comes from user input.
- `POSTHOG_CLOUD_LABELS` gets a `'self-hosted': 'Self-Hosted'` entry for display.

**Alternatives considered**:
- Keeping `PostHogCloud` as `'us' | 'eu'` and adding a separate `ConnectionType` → Rejected. Creates a parallel type system. Every function that takes `PostHogCloud` would need refactoring to accept `ConnectionType` instead. The union expansion is simpler.

---

## R-004: getPostHogApiHost() Refactoring Approach

**Decision**: Change signature to `getPostHogApiHost(cloud: PostHogCloud, selfHostedUrl?: string): string`. When `cloud === 'self-hosted'`, return `selfHostedUrl` (with assertion). For `'us'`/`'eu'`, behavior is unchanged.

**Rationale**:
- All callers in `posthog-api.ts` already receive `cloudRegion` as parameter. They also receive `apiKey`. The self-hosted URL needs to flow alongside these parameters.
- The `useAuth` hook holds both `cloudRegion` and `selfHostedUrl` in state. Hooks that call API functions (e.g., `useDashboard`, `useInsights`) pass `cloudRegion` from auth context — they'll also pass `selfHostedUrl`.
- To minimize call-site changes, the cleanest approach is passing the URL through `getPostHogApiHost()` rather than having each API function construct the host itself.

**Alternatives considered**:
- Global singleton for the self-hosted URL → Rejected. Violates the existing pattern of explicit parameter passing through hooks and services.
- Storing the URL in a module-level variable set at auth time → Rejected. Same issue as global singleton + hard to test and reason about.

---

## R-005: URL Sanitization Rules

**Decision**: Apply the following sanitization pipeline before storage:
1. `trim()` — remove leading/trailing whitespace
2. Remove trailing `/` (one or more)
3. Validate protocol is `https:`
4. Validate no embedded credentials (`url.username === '' && url.password === ''`)
5. Validate URL is parseable via `new URL()`

**Rationale**:
- The spec explicitly requires: trim (edge case), trailing slash removal (edge case), HTTPS enforcement (FR-003), embedded credentials rejection (FR-012).
- URLs with ports (`:8443`) and sub-paths (`/posthog`) must be accepted (FR-013) — `new URL()` handles both natively.
- Sanitization happens before any network call, as a pure function in `utils/url.ts`.

**Alternatives considered**:
- Normalizing the URL further (lowercasing hostname, sorting query params) → Rejected. Over-engineering. The URL is used as-is for API calls; PostHog will handle its own routing.

---

## R-006: CloudRegionSelector UI Expansion

**Decision**: Expand the existing pill-button selector from 2 options to 3 (`US Cloud`, `EU Cloud`, `Self-Hosted`). When `'self-hosted'` is selected, a `SelfHostedUrlInput` component renders below the selector with a `TextInput` for the URL.

**Rationale**:
- The current `CloudRegionSelector` uses `CLOUD_OPTIONS: PostHogCloud[] = ['us', 'eu']` and maps over them. Adding `'self-hosted'` to the array with proper label in `POSTHOG_CLOUD_LABELS` is the minimal change.
- The URL input appears conditionally — only when `'self-hosted'` is selected. This keeps cloud users' experience unchanged.
- Dark/light theme support via existing NativeWind class patterns already in the component.

**Alternatives considered**:
- Separate screen/modal for self-hosted configuration → Rejected. Adds navigation complexity. The inline approach (URL field below the selector) matches the existing UX pattern and keeps the flow simple.
- Radio buttons instead of pill-buttons → Rejected. The existing pill-button pattern is already established and works well. Three pills still fit on mobile screens.

---

## R-007: Error Differentiation for Self-Hosted Validation

**Decision**: Add new error codes to `ApiKeyErrorCode` for self-hosted-specific failures:
- `'INVALID_URL'` — URL format invalid or not HTTPS
- `'INSTANCE_UNREACHABLE'` — Connection failed (timeout, DNS, network)
- `'NOT_POSTHOG_INSTANCE'` — URL responds but `/api/projects/` doesn't behave as PostHog

**Rationale**:
- FR-011 requires differentiated messages for: URL sin HTTPS, formato URL inválido, instancia no accesible, instancia que no es PostHog, API Key inválida, error de red.
- Client-side URL validation catches "URL sin HTTPS" and "formato URL inválido" → mapped to `'INVALID_URL'` with different messages.
- Server-side errors: TimeoutError/NetworkError → `'INSTANCE_UNREACHABLE'`; unexpected response format → `'NOT_POSTHOG_INSTANCE'`; 401 → existing `'INVALID_KEY'`; 403 → existing `'INSUFFICIENT_PERMISSIONS'`.
- The existing `validateApiKey` in `services/posthog.ts` already maps ky errors to `ApiKeyError` — adding self-hosted-specific mappings follows the same pattern.

**Alternatives considered**:
- Reusing existing error codes with different messages → Rejected. The spec requires differentiated error messages. Using the same `'NETWORK_ERROR'` for both "no internet" and "self-hosted instance unreachable" would be confusing.

---

## R-008: Impact Analysis on Existing API Functions

**Decision**: All functions in `posthog-api.ts` that call `getPostHogApiHost(cloudRegion)` need to also pass `selfHostedUrl`. Since all these functions already take `cloudRegion: PostHogCloud` as parameter, the change is adding an optional `selfHostedUrl?: string` parameter.

**Rationale**:
- Functions affected: `getProjects`, `getEventDefinitions`, `getPropertyDefinitions`, `queryMetricValue`, `queryMetricSeries`, `queryBreakdownSeries`, `queryFunnel` (and any others).
- All callers receive `cloudRegion` from the auth context (via `useAuth` hook). The auth context will also expose `selfHostedUrl`.
- The change is mechanical: add `selfHostedUrl?: string` param, pass to `getPostHogApiHost(cloudRegion, selfHostedUrl)`.
- No behavioral change for cloud users — `selfHostedUrl` is `undefined` for cloud, and `getPostHogApiHost('us', undefined)` returns `'https://us.posthog.com'` as before.

**Alternatives considered**:
- Creating a wrapper/factory that binds the host once → Rejected. Over-engineering for this use case. The explicit parameter passing is clear and follows existing patterns.
