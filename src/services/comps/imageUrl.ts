import type { CompSold } from '../../models/comps';

const IMAGE_KEYS = ['imageUrl', 'image_url', 'cardImageUrl', 'photoUrl'] as const;

/**
 * Accept a real photo URL from the API or a local file. Never invents one.
 */
export function readImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('file:')) return trimmed;
  return null;
}

function imageUrlFromRecord(row: Record<string, unknown>): string | null {
  for (const key of IMAGE_KEYS) {
    const url = readImageUrl(row[key]);
    if (url) return url;
  }
  return null;
}

/** First real image URL on sold rows. Skips blanks — does not invent. */
export function firstSoldImageUrl(solds: Array<Pick<CompSold, 'imageUrl'>>): string | null {
  for (const sold of solds) {
    const url = readImageUrl(sold.imageUrl);
    if (url) return url;
  }
  return null;
}

/**
 * Photo for a comps payload. Top-level imageUrl wins, then any row that
 * carried one — even when those rows are not valid solds.
 */
export function imageUrlFromPayload(
  payload: unknown,
  solds: Array<Pick<CompSold, 'imageUrl'>> = [],
): string | null {
  if (Array.isArray(payload)) {
    for (const row of payload) {
      if (row && typeof row === 'object') {
        const url = imageUrlFromRecord(row as Record<string, unknown>);
        if (url) return url;
      }
    }
    return firstSoldImageUrl(solds);
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const top = imageUrlFromRecord(record);
    if (top) return top;
    const rows = Array.isArray(record.solds) ? record.solds : [];
    for (const row of rows) {
      if (row && typeof row === 'object') {
        const url = imageUrlFromRecord(row as Record<string, unknown>);
        if (url) return url;
      }
    }
  }

  return firstSoldImageUrl(solds);
}
