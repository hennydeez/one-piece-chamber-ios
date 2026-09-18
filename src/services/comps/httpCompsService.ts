import type { CompQuery, CompSold, CompsLookupOptions, CompsService, CompsResult } from '../../models/comps';
import { imageUrlFromPayload, readImageUrl } from './imageUrl';
import {
  DETAILED_SOURCE_MESSAGE,
  QUICK_SOURCE_MESSAGE,
  buildCompsResult,
  emptyCompsResult,
} from './last5Avg';
import { isSampleSold } from './sourceLink';

export { DETAILED_SOURCE_MESSAGE, QUICK_SOURCE_MESSAGE };
export const COMPS_QUOTA_MESSAGE = 'Comps quota exceeded. Try again.';

export function sourceMessageFromPayload(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const raw = (payload as { sourceMessage?: unknown }).sourceMessage;
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  const msg = raw.trim();
  if (/quota/i.test(msg)) return COMPS_QUOTA_MESSAGE;
  return msg.length > 90 ? fallback : msg;
}

export function payloadSourceFailed(payload: unknown, soldCount: number): boolean {
  if (soldCount > 0) return false;
  if (!payload || typeof payload !== 'object') return false;
  const status = (payload as { sourceStatus?: unknown }).sourceStatus;
  if (status === 'error') return true;
  const raw = (payload as { sourceMessage?: unknown }).sourceMessage;
  return typeof raw === 'string' && /quota|error|fail|couldn/i.test(raw);
}

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
  const imageUrl = readImageUrl(row.imageUrl) ?? readImageUrl(row.image_url) ?? undefined;
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
    imageUrl,
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

  async getLastCompletedSolds(query: CompQuery, options?: CompsLookupOptions): Promise<CompsResult> {
    const lookupMode = options?.mode === 'detailed' ? 'detailed' : 'quick';
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
      url.searchParams.set('months', '6');
      if (lookupMode === 'detailed') {
        url.searchParams.set('mode', 'detailed');
      }

      const response = await fetch(url.toString(), { signal: controller.signal });
      if (!response.ok) {
        return emptyCompsResult(
          query,
          'error',
          `Comps source failed (HTTP ${response.status}).`,
          lookupMode,
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
          lookupMode,
          imageUrlFromPayload(payload),
        );
      }

      const solds = rows
        .map(asCompletedSold)
        .filter((row): row is CompSold => row != null)
        .filter((row) => !isSampleSold(row));
      const imageUrl = imageUrlFromPayload(payload, solds);

      if (payloadSourceFailed(payload, solds.length)) {
        return emptyCompsResult(
          query,
          'error',
          sourceMessageFromPayload(payload, COMPS_UNREACHABLE_MESSAGE),
          lookupMode,
          imageUrl,
        );
      }

      return buildCompsResult(
        query,
        solds,
        'live',
        lookupMode === 'detailed' ? DETAILED_SOURCE_MESSAGE : QUICK_SOURCE_MESSAGE,
        undefined,
        lookupMode,
        imageUrl,
      );
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) {
        return emptyCompsResult(query, 'error', COMPS_TIMEOUT_MESSAGE, lookupMode);
      }
      return emptyCompsResult(query, 'error', COMPS_UNREACHABLE_MESSAGE, lookupMode);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
