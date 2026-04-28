/**
 * Enmascara una API Key para visualización segura en la UI.
 * Ejemplo: "phx_AbCdEfGhIjKlMnOpQrSt" → "phx_AbCd...rSt"
 */
export function maskApiKey(value: string): string {
  if (value.length < 12) return '***';
  return value.slice(0, 8) + '...' + value.slice(-4);
}
