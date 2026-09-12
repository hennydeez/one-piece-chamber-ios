import type { CompSold } from '../../models/comps';

export const SAMPLE_SOURCE_HOST = 'example.invalid';

export function resolveSourceUrl(sold: Pick<CompSold, 'sourceUrl' | 'listingUrl'>): string | null {
  const url = sold.sourceUrl?.trim() || sold.listingUrl?.trim() || '';
  return url.length > 0 ? url : null;
}

export function resolveSourceLabel(sold: Pick<CompSold, 'sourceLabel' | 'sourceUrl' | 'listingUrl'>): string {
  if (sold.sourceLabel?.trim()) return sold.sourceLabel.trim();
  return 'Open sold listing';
}

export function isSampleSourceUrl(url: string): boolean {
  try {
    return new URL(url).hostname === SAMPLE_SOURCE_HOST;
  } catch {
    return false;
  }
}

/** Leftover stub / SAMPLE / example.invalid rows must never render as comps. */
export function isSampleSold(
  sold: Pick<CompSold, 'source' | 'sourceUrl' | 'listingUrl' | 'id' | 'title'>,
): boolean {
  const source = sold.source.trim().toLowerCase();
  if (source === 'sample' || source === 'stub') return true;
  const id = sold.id.trim().toLowerCase();
  if (id.startsWith('sample-') || id.startsWith('stub-')) return true;
  const url = resolveSourceUrl(sold);
  return url != null && isSampleSourceUrl(url);
}
