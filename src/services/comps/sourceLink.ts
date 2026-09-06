import type { CompSold } from '../../models/comps';

export const SAMPLE_SOURCE_HOST = 'example.invalid';

export function resolveSourceUrl(sold: Pick<CompSold, 'sourceUrl' | 'listingUrl'>): string | null {
  const url = sold.sourceUrl?.trim() || sold.listingUrl?.trim() || '';
  return url.length > 0 ? url : null;
}

export function resolveSourceLabel(sold: Pick<CompSold, 'sourceLabel' | 'sourceUrl' | 'listingUrl'>): string {
  if (sold.sourceLabel?.trim()) return sold.sourceLabel.trim();
  const url = resolveSourceUrl(sold);
  if (url && isSampleSourceUrl(url)) return 'Sample listing — not live';
  return 'Open sold listing';
}

export function isSampleSourceUrl(url: string): boolean {
  try {
    return new URL(url).hostname === SAMPLE_SOURCE_HOST;
  } catch {
    return false;
  }
}

export function sampleSourceUrl(kind: 'ebay-sold' | 'pricecharting', slug: string): string {
  return `https://${SAMPLE_SOURCE_HOST}/sample/${kind}/${encodeURIComponent(slug)}`;
}
