import type { CompQuery, CompSold, CompsService, CompsResult } from '../../models/comps';
import { buildCompsResult, emptyCompsResult } from './last5Avg';
import { isSampleSold } from './sourceLink';

function asCompletedSold(value: unknown): CompSold | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (row.completed !== true) return null;
  if (typeof row.id !== 'string') return null;
  if (typeof row.cardCode !== 'string') return null;
  if (typeof row.soldAt !== 'string') return null;
  if (row.channel !== 'fixed' && row.channel !== 'auction') return null;
  if (typeof row.priceAud !== 'number' || !Number.isFinite(row.priceAud)) return null;
  if (typeof row.priceOriginal !== 'number') return null;
  if (typeof row.currencyOriginal !== 'string') return null;
  if (typeof row.type !== 'string') return null;
  const sourceUrl =
    typeof row.sourceUrl === 'string' && row.sourceUrl.trim()
      ? row.sourceUrl.trim()
      : typeof row.listingUrl === 'string' && row.listingUrl.trim()
        ? row.listingUrl.trim()
        : '';
  const title = typeof row.title === 'string' && row.title.trim() ? row.title.trim() : undefined;
  const sold: CompSold = {
    id: row.id,
    cardCode: row.cardCode,
    printNote: typeof row.printNote === 'string' ? row.printNote : null,
    language: typeof row.language === 'string' ? row.language : 'EN',
    type: row.type as CompSold['type'],
    grade: typeof row.grade === 'string' ? row.grade : null,
    soldAt: row.soldAt,
    channel: row.channel,
    completed: true,
    priceOriginal: row.priceOriginal,
    currencyOriginal: row.currencyOriginal,
    priceAud: row.priceAud,
    fxRateToAud: typeof row.fxRateToAud === 'number' ? row.fxRateToAud : null,
    fxStampedAt: typeof row.fxStampedAt === 'string' ? row.fxStampedAt : null,
    source: typeof row.source === 'string' ? row.source : 'live',
    sourceUrl,
    sourceLabel: typeof row.sourceLabel === 'string' ? row.sourceLabel : undefined,
    title,
    listingUrl: typeof row.listingUrl === 'string' ? row.listingUrl : undefined,
  };
  if (isSampleSold(sold)) return null;
  return sold;
}

export { asCompletedSold };

/**
 * Live provider. Expects a JSON array (or `{ solds: [] }`) of completed solds.
 * Rejects incomplete rows. Never fabricates prices on error.
 */
export class HttpCompsService implements CompsService {
  constructor(readonly endpoint: string) {}

  async getLastCompletedSolds(query: CompQuery): Promise<CompsResult> {
    try {
      const url = new URL(this.endpoint);
      url.searchParams.set('cardCode', query.cardCode);
      url.searchParams.set('language', query.language);
      url.searchParams.set('type', query.type);
      if (query.grade) url.searchParams.set('grade', query.grade);
      if (query.printNote) url.searchParams.set('printNote', query.printNote);
      url.searchParams.set('completed', 'true');

      const response = await fetch(url.toString());
      if (!response.ok) {
        return emptyCompsResult(
          query,
          'error',
          `Comps source failed (HTTP ${response.status}).`,
        );
      }

      const payload: unknown = await response.json();
      const rows = Array.isArray(payload)
        ? payload
        : payload && typeof payload === 'object' && Array.isArray((payload as { solds?: unknown }).solds)
          ? (payload as { solds: unknown[] }).solds
          : null;

      if (!rows) {
        return emptyCompsResult(
          query,
          'error',
          'Comps source sent a bad response.',
        );
      }

      const solds = rows
        .map(asCompletedSold)
        .filter((row): row is CompSold => row != null)
        .filter((row) => !isSampleSold(row));

      return buildCompsResult(
        query,
        solds,
        'live',
        'Live solds. Newest 5.',
      );
    } catch {
      return emptyCompsResult(
        query,
        'error',
        'Couldn’t reach comps.',
      );
    }
  }
}
