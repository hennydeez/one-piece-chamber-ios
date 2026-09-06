import type { CompQuery, CompSold, CompsService, CompsResult } from '../../models/comps';
import { buildCompsResult, emptyCompsResult } from './last5Avg';

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
  return {
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
    listingUrl: typeof row.listingUrl === 'string' ? row.listingUrl : undefined,
  };
}

/**
 * Live provider. Expects a JSON array (or `{ solds: [] }`) of completed solds.
 * Rejects incomplete rows. Never fabricates prices on error.
 */
export class HttpCompsService implements CompsService {
  constructor(private readonly endpoint: string) {}

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
          `Comps source returned HTTP ${response.status}. No prices were invented.`,
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
          'Comps source returned an unexpected payload. No prices were invented.',
        );
      }

      const solds = rows
        .map(asCompletedSold)
        .filter((row): row is CompSold => row != null);

      return buildCompsResult(
        query,
        solds,
        'live',
        `Live completed solds from configured source. Showing newest ≤5 per channel after Scout match.`,
      );
    } catch {
      return emptyCompsResult(
        query,
        'error',
        'Comps source could not be reached. No prices were invented.',
      );
    }
  }
}
