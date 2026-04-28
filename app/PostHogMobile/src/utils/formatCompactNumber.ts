export function formatCompactNumber(n: number): string {
  if (n === 0) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return sign + (v % 1 === 0 ? `${v}M` : `${parseFloat(v.toFixed(1))}M`);
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return sign + (v % 1 === 0 ? `${v}k` : `${parseFloat(v.toFixed(1))}k`);
  }
  return sign + String(abs);
}
