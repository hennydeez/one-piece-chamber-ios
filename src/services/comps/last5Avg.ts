import type {
  CompQuery,
  CompSold,
  CompsLookupMode,
  CompsResult,
  CompsSourceStatus,
  Last5Avg,
  SaleChannel,
} from '../../models/comps';
import { mean } from '../../lib/money';
import { firstSoldImageUrl } from './imageUrl';
import { bucketSoldsByMonth } from './monthBuckets';
import { withoutNoiseTitles } from './noiseTitle';
import { filterMatchingSolds } from './scoutMatch';
import { isSampleSold } from './sourceLink';

export const LAST5_AVG_LABEL = 'Last-5 avg (AUD)' as const;
export const LAST5_MAX = 5;
export const QUICK_SOURCE_MESSAGE = 'Live solds. Newest 5.';
export const DETAILED_SOURCE_MESSAGE = 'Live solds. Last 6 months.';

export function compsViewMessage(result: CompsResult, view: CompsLookupMode): string {
  if (view === 'detailed' && result.sourceStatus === 'live') return DETAILED_SOURCE_MESSAGE;
  return result.sourceMessage;
}

/** Last 6 months uses solds already on the result. Only refetch when live n=0. */
export function shouldRefetchDetailed(result: CompsResult | null): boolean {
  if (!result) return false;
  if (result.lookupMode === 'detailed') return false;
  if (result.solds.length > 0) return false;
  return result.sourceStatus === 'live';
}

function byNewest(a: CompSold, b: CompSold): number {
  return new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime();
}

function isAud(sold: CompSold): boolean {
  return sold.currencyOriginal.toUpperCase() === 'AUD';
}

function isFxStamped(sold: CompSold): boolean {
  return !isAud(sold) && sold.fxRateToAud != null && Boolean(sold.fxStampedAt) && Number.isFinite(sold.priceAud);
}

function liveEligible(solds: CompSold[]): CompSold[] {
  return withoutNoiseTitles(
    solds.filter((sold) => !isSampleSold(sold) && (isAud(sold) || isFxStamped(sold))),
  );
}

/**
 * Newest completed solds, AUD-first, max 5.
 * Non-AUD rows may fill remaining slots only if they already carry a stamped FX conversion.
 * Noise titles (playset / x4 / lot of / bundle) are dropped when title is present.
 */
export function selectLast5(solds: CompSold[]): CompSold[] {
  const live = withoutNoiseTitles(solds.filter((sold) => !isSampleSold(sold)));
  const aud = live.filter(isAud).sort(byNewest);
  const converted = live.filter(isFxStamped).sort(byNewest);
  return [...aud, ...converted].slice(0, LAST5_MAX);
}

/**
 * Merge BIN + auction solds, newest first, max 5.
 * Same eligibility as selectLast5: live AUD, or a stamped FX conversion. Does not invent prices.
 * Drops playset / x4 / “lot of” / bundle titles when the API sent one. Untitled rows stay.
 */
export function selectMergedLast5(solds: CompSold[]): CompSold[] {
  return liveEligible(solds).sort(byNewest).slice(0, LAST5_MAX);
}

/** Matching live solds, newest first. No cap — Detailed groups these into months. */
export function selectLiveSolds(solds: CompSold[]): CompSold[] {
  return liveEligible(solds).sort(byNewest);
}

export function honestCountLabel(n: number, maxN = LAST5_MAX): string {
  return `n=${n} of ${maxN}`;
}

function stampFromChosen(chosen: CompSold[], channel?: SaleChannel): Last5Avg {
  const prices = chosen.map((s) => s.priceAud).filter((n) => Number.isFinite(n));
  return {
    label: LAST5_AVG_LABEL,
    averageAud: mean(prices),
    n: chosen.length,
    maxN: LAST5_MAX,
    honestCountLabel: honestCountLabel(chosen.length),
    solds: chosen,
    channel,
  };
}

export function stampLast5Avg(solds: CompSold[], channel: SaleChannel): Last5Avg {
  return stampFromChosen(
    selectLast5(solds.filter((s) => s.channel === channel)),
    channel,
  );
}

/** Arithmetic mean of the merged last-5 rows actually shown. */
export function stampMergedLast5Avg(solds: CompSold[]): Last5Avg {
  return stampFromChosen(selectMergedLast5(solds));
}

export function buildCompsResult(
  query: CompQuery,
  solds: CompSold[],
  sourceStatus: CompsSourceStatus,
  sourceMessage: string,
  fetchedAt = new Date().toISOString(),
  lookupMode: CompsLookupMode = 'quick',
  imageUrl: string | null = null,
): CompsResult {
  const matched = filterMatchingSolds(solds, query);
  const live = selectLiveSolds(matched);
  return {
    query,
    last5: stampMergedLast5Avg(matched),
    fixed: stampLast5Avg(matched, 'fixed'),
    auction: stampLast5Avg(matched, 'auction'),
    solds: live,
    months: bucketSoldsByMonth(live, new Date(fetchedAt)),
    lookupMode,
    imageUrl: imageUrl ?? firstSoldImageUrl(matched) ?? firstSoldImageUrl(solds),
    sourceStatus,
    sourceMessage,
    fetchedAt,
  };
}

export function emptyCompsResult(
  query: CompQuery,
  sourceStatus: CompsSourceStatus,
  sourceMessage: string,
  lookupMode: CompsLookupMode = 'quick',
  imageUrl: string | null = null,
): CompsResult {
  return buildCompsResult(query, [], sourceStatus, sourceMessage, undefined, lookupMode, imageUrl);
}
