import type { CompSold, MonthBucket, MonthChartBar } from '../../models/comps';
import { mean } from '../../lib/money';

export const DETAILED_MONTHS = 6;

const ISO_MONTH = /^(\d{4})-(\d{2})/;

const MONTH_TICKS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const compactAud = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

/**
 * Calendar month of a sold date.
 * Prefers the YYYY-MM prefix on ISO stamps so AU offsets do not shift the day.
 * Invalid dates return null — never invent a month.
 */
export function calendarMonthKey(soldAt: string): string | null {
  const trimmed = soldAt.trim();
  const match = trimmed.match(ISO_MONTH);
  if (match) {
    const month = Number(match[2]);
    if (month < 1 || month > 12) return null;
    return `${match[1]}-${match[2]}`;
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthParts(key: string): { year: number; tick: string } | null {
  const date = dateFromMonthKey(key);
  if (!date) return null;
  return {
    year: date.getUTCFullYear(),
    tick: MONTH_TICKS[date.getUTCMonth()] ?? key,
  };
}

export function formatMonthLabel(key: string): string {
  const parts = monthParts(key);
  if (!parts) return key;
  return `${parts.tick} ${parts.year}`;
}

export function formatMonthTick(key: string, spansYears = false): string {
  const parts = monthParts(key);
  if (!parts) return key;
  if (!spansYears) return parts.tick;
  return `${parts.tick} ${String(parts.year).slice(2)}`;
}

export function formatAudCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return compactAud.format(value);
}

/**
 * Newest calendar month first. `now` is pinned in tests.
 */
export function lastCalendarMonthKeys(now: Date, count = DETAILED_MONTHS): string[] {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const keys: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(Date.UTC(year, month - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function dateFromMonthKey(key: string): Date | null {
  const match = key.match(ISO_MONTH);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(Number(match[1]), month - 1, 1));
}

function byNewest(a: CompSold, b: CompSold): number {
  return new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime();
}

/**
 * Group matching solds into the last 6 calendar months (newest first).
 * Empty months stay in the list with n=0 and averageAud=null. No invented prices.
 * Solds outside the window or with a bad date are omitted from buckets.
 */
export function bucketSoldsByMonth(
  solds: CompSold[],
  now = new Date(),
  count = DETAILED_MONTHS,
): MonthBucket[] {
  const keys = lastCalendarMonthKeys(now, count);
  const inWindow = new Set(keys);
  const grouped = new Map<string, CompSold[]>();
  for (const key of keys) grouped.set(key, []);

  for (const sold of solds) {
    const key = calendarMonthKey(sold.soldAt);
    if (!key || !inWindow.has(key)) continue;
    grouped.get(key)?.push(sold);
  }

  return keys.map((key) => {
    const rows = (grouped.get(key) ?? []).slice().sort(byNewest);
    const prices = rows.map((row) => row.priceAud).filter((n) => Number.isFinite(n));
    return {
      key,
      label: formatMonthLabel(key),
      n: rows.length,
      averageAud: mean(prices),
      solds: rows,
    };
  });
}

/**
 * Chart bars, oldest month on the left (readable trend).
 * Empty months: height 0 and "—" — not a fabricated sold price.
 */
export function chartBarsFromMonths(months: MonthBucket[]): MonthChartBar[] {
  const chronological = [...months].reverse();
  const years = new Set(chronological.map((month) => month.key.slice(0, 4)));
  const spansYears = years.size > 1;
  const max = chronological.reduce((acc, month) => {
    if (month.averageAud == null) return acc;
    return Math.max(acc, month.averageAud);
  }, 0);

  return chronological.map((month) => ({
    key: month.key,
    label: formatMonthTick(month.key, spansYears),
    fullLabel: month.label,
    averageAud: month.averageAud,
    n: month.n,
    heightRatio: month.averageAud == null || max <= 0 ? 0 : month.averageAud / max,
    valueLabel: month.averageAud == null ? '—' : formatAudCompact(month.averageAud),
  }));
}
