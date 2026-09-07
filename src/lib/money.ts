const aud = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 2,
});

export function formatAud(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return aud.format(value);
}

export function parseAudInput(value: string): number | null {
  const trimmed = value.trim().replace(/[$,\s]/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, n) => acc + n, 0);
  return Math.round((sum / values.length) * 100) / 100;
}
