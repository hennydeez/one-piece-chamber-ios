import type { CompQuery, CompSold, CompsResult, CompsSourceStatus, Last5Avg, SaleChannel } from '../../models/comps';
import { mean } from '../../lib/money';
import { filterMatchingSolds } from './scoutMatch';
import { isSampleSold } from './sourceLink';

export const LAST5_AVG_LABEL = 'Last-5 avg (AUD)' as const;
export const LAST5_MAX = 5;

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
  return solds.filter((sold) => !isSampleSold(sold) && (isAud(sold) || isFxStamped(sold)));
}

/**
 * Newest completed solds, AUD-first, max 5.
 * Non-AUD rows may fill remaining slots only if they already carry a stamped FX conversion.
 */
export function selectLast5(solds: CompSold[]): CompSold[] {
  const live = solds.filter((sold) => !isSampleSold(sold));
  const aud = live.filter(isAud).sort(byNewest);
  const converted = live.filter(isFxStamped).sort(byNewest);
  return [...aud, ...converted].slice(0, LAST5_MAX);
}

/**
 * Merge BIN + auction solds, newest first, max 5.
 * Same eligibility as selectLast5: live AUD, or a stamped FX conversion. Does not invent prices.
 */
export function selectMergedLast5(solds: CompSold[]): CompSold[] {
  return liveEligible(solds).sort(byNewest).slice(0, LAST5_MAX);
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
): CompsResult {
  const matched = filterMatchingSolds(solds, query);
  return {
    query,
    last5: stampMergedLast5Avg(matched),
    fixed: stampLast5Avg(matched, 'fixed'),
    auction: stampLast5Avg(matched, 'auction'),
    sourceStatus,
    sourceMessage,
    fetchedAt,
  };
}

export function emptyCompsResult(
  query: CompQuery,
  sourceStatus: CompsSourceStatus,
  sourceMessage: string,
): CompsResult {
  return buildCompsResult(query, [], sourceStatus, sourceMessage);
}
