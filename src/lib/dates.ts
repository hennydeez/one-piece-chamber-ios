const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const AU_DATE = /^\d{2}-\d{2}-\d{4}$/;

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value.trim());
}

export function isAuDate(value: string): boolean {
  return AU_DATE.test(value.trim());
}

function isValidYmd(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1000 || year > 9999) return false;
  const probe = new Date(year, month - 1, day);
  return (
    probe.getFullYear() === year &&
    probe.getMonth() === month - 1 &&
    probe.getDate() === day
  );
}

/** Local calendar day as ISO `YYYY-MM-DD` (not UTC — AU evening would otherwise roll over). */
export function todayIsoDate(): string {
  const d = new Date();
  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Local today as `dd-mm-yyyy` for the purchase-date field. */
export function todayAuDate(): string {
  return formatIsoToAuDate(todayIsoDate()) ?? '';
}

export function parseAuDateToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!AU_DATE.test(trimmed)) return null;
  const [dd, mm, yyyy] = trimmed.split('-');
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (!isValidYmd(year, month, day)) return null;
  return `${yyyy}-${mm}-${dd}`;
}

export function formatIsoToAuDate(value: string): string | null {
  const trimmed = value.trim();
  if (!ISO_DATE.test(trimmed)) return null;
  const [yyyy, mm, dd] = trimmed.split('-');
  const year = Number(yyyy);
  const month = Number(mm);
  const day = Number(dd);
  if (!isValidYmd(year, month, day)) return null;
  return `${dd}-${mm}-${yyyy}`;
}

/** Form / edit field: ISO from SQLite → `dd-mm-yyyy`. Already-AU stays. */
export function toAuPurchaseDateInput(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  const trimmed = value.trim();
  return formatIsoToAuDate(trimmed) ?? trimmed;
}

/** Card detail: stored ISO (or leftover AU) → `dd-mm-yyyy`. */
export function formatPurchaseDate(value: string | null | undefined): string {
  if (!value?.trim()) return '—';
  const trimmed = value.trim();
  const fromIso = formatIsoToAuDate(trimmed);
  if (fromIso) return fromIso;
  if (parseAuDateToIso(trimmed)) return trimmed;
  return '—';
}

/** Last-5 sold table / API `soldAt`. Do not reuse for purchase date. */
export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}
