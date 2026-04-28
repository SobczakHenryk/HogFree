# Quickstart: Self-Hosted Support

**Feature**: 017-self-hosted-support  
**Date**: 2026-03-20

---

## Prerequisites

- Node.js installed, Expo CLI available
- PostHog self-hosted instance accessible via HTTPS (for testing)
- Working PostHog Personal API Key for the self-hosted instance

## Setup

```bash
cd app/PostHogMobile
npm install   # No new dependencies needed
```

## Implementation Order

1. **Types** → `src/types/index.ts`: Expand `PostHogCloud` union, add error codes, add `selfHostedUrl` to `ApiKeyState`
2. **Utils** → `src/utils/url.ts` (new): URL validation/sanitization pure function
3. **Constants** → `src/constants/index.ts`: Add `SELF_HOSTED_URL_KEY`, update `isPostHogCloud()`, update `getPostHogApiHost()`, add error constants, add label
4. **i18n** → `src/i18n/locales/en.ts` & `es.ts`: Add `selfHosted.*` keys
5. **Services** → `src/services/posthog-api.ts`: Add `selfHostedUrl?` param to all API functions
6. **Services** → `src/services/posthog.ts`: Pass `selfHostedUrl` through `validateApiKey`
7. **Hook** → `src/hooks/useAuth.tsx`: Store/load/clear `selfHostedUrl`, update function signatures
8. **Component** → `src/components/SelfHostedUrlInput.tsx` (new): URL text input with inline validation
9. **Component** → `src/components/CloudRegionSelector.tsx`: Add `'self-hosted'` option, render URL input when selected
10. **Screen** → Settings screen already uses `CloudRegionSelector` — verify it works with the expanded component

## Verification

1. Fresh install: Select "Self-Hosted" → enter URL → enter API Key → Save → should validate and navigate to dashboard
2. Cloud user: Existing US/EU config should work unchanged after update
3. Switch: Cloud → Self-Hosted from Settings → should replace config
4. Errors: Invalid URL, HTTP URL, unreachable instance → should show differentiated error messages
5. Theme: Toggle dark/light → URL input and selector should render correctly in both
6. i18n: Switch language en/es → all self-hosted text should translate
