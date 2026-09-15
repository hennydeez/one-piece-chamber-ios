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

/** SoldComps often takes 10–60s. Abort rather than hang or invent solds. */
export const COMPS_FETCH_TIMEOUT_MS = 50_000;

export const COMPS_TIMEOUT_MESSAGE = 'Comps took too long. Try again.';
export const COMPS_UNREACHABLE_MESSAGE = 'Couldn’t reach comps.';

function isAbortError(error: unknown): boolean {
  return (
    (typeof error === 'object' && error !== null && 'name' in error && (error as { name: string }).name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

/**
 * Live provider. Expects a JSON array (or `{ solds: [] }`) of completed solds.
 * Rejects incomplete rows. Never fabricates prices on error or timeout.
 */
export class HttpCompsService implements CompsService {
  constructor(
    readonly endpoint: string,
    readonly timeoutMs = COMPS_FETCH_TIMEOUT_MS,
  ) {}

  async getLastCompletedSolds(query: CompQuery): Promise<CompsResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const url = new URL(this.endpoint);
      url.searchParams.set('cardCode', query.cardCode);
      url.searchParams.set('language', query.language);
      url.searchParams.set('type', query.type);
      if (query.grade) url.searchParams.set('grade', query.grade);
      if (query.printNote) url.searchParams.set('printNote', query.printNote);
      url.searchParams.set('completed', 'true');

      const response = await fetch(url.toString(), { signal: controller.signal });
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
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) {
        return emptyCompsResult(query, 'error', COMPS_TIMEOUT_MESSAGE);
      }
      return emptyCompsResult(query, 'error', COMPS_UNREACHABLE_MESSAGE);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
