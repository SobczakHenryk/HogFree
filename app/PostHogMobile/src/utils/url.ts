export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl: string | null;
  /** i18n key for the error message. null if valid. */
  errorKey: string | null;
}

/**
 * Validates and sanitizes a self-hosted PostHog URL.
 * Pure function — no side effects, no network calls.
 */
export function validateSelfHostedUrl(raw: string): UrlValidationResult {
  const trimmed = raw.trim();

  if (trimmed === '') {
    return { isValid: false, sanitizedUrl: null, errorKey: 'selfHosted.errors.emptyUrl' };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { isValid: false, sanitizedUrl: null, errorKey: 'selfHosted.errors.invalidFormat' };
  }

  if (url.protocol !== 'https:') {
    return { isValid: false, sanitizedUrl: null, errorKey: 'selfHosted.errors.httpsRequired' };
  }

  if (url.username !== '' || url.password !== '') {
    return { isValid: false, sanitizedUrl: null, errorKey: 'selfHosted.errors.credentialsNotAllowed' };
  }

  // Build sanitized URL: origin + pathname, strip trailing slash
  const sanitized = (url.origin + url.pathname).replace(/\/+$/, '');

  return { isValid: true, sanitizedUrl: sanitized, errorKey: null };
}
