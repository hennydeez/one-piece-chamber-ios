import type { CompQuery, CompSold, CompsResult, CompsService } from '../../models/comps';
import { buildCompsResult } from './last5Avg';
import { sampleSourceUrl } from './sourceLink';

export const SAMPLE_COMPS_MESSAGE =
  'SAMPLE listings only — not live solds. Each source link is a fake example.invalid URL so you can check the tap target. Last-5 avg (AUD) below is computed from these sample rows and is not a live market figure.';

export const UNCONFIGURED_COMPS_MESSAGE = SAMPLE_COMPS_MESSAGE;

function sampleRow(
  query: CompQuery,
  id: string,
  channel: CompSold['channel'],
  soldAt: string,
  priceAud: number,
  kind: 'ebay-sold' | 'pricecharting',
  label: string,
): CompSold {
  const slug = `${query.cardCode}-${channel}-${id}`.toLowerCase();
  return {
    id: `sample_${id}`,
    cardCode: query.cardCode,
    printNote: query.printNote,
    language: query.language,
    type: query.type,
    grade: query.grade,
    soldAt,
    channel,
    completed: true,
    priceOriginal: priceAud,
    currencyOriginal: 'AUD',
    priceAud,
    fxRateToAud: null,
    fxStampedAt: null,
    source: 'sample',
    sourceUrl: sampleSourceUrl(kind, slug),
    sourceLabel: label,
  };
}

/** Clearly fake placeholder solds that match the query so source links can be tapped. */
export function sampleSoldsForQuery(query: CompQuery): CompSold[] {
  return [
    sampleRow(query, 'fixed-1', 'fixed', '2026-08-20T00:00:00.000Z', 11.11, 'ebay-sold', 'Sample eBay sold page — not live'),
    sampleRow(query, 'fixed-2', 'fixed', '2026-08-12T00:00:00.000Z', 22.22, 'pricecharting', 'Sample PriceCharting page — not live'),
    sampleRow(query, 'fixed-3', 'fixed', '2026-07-30T00:00:00.000Z', 33.33, 'ebay-sold', 'Sample eBay sold page — not live'),
    sampleRow(query, 'auction-1', 'auction', '2026-08-18T00:00:00.000Z', 44.44, 'ebay-sold', 'Sample eBay auction sold — not live'),
    sampleRow(query, 'auction-2', 'auction', '2026-08-02T00:00:00.000Z', 55.55, 'pricecharting', 'Sample PriceCharting page — not live'),
  ];
}

/**
 * v0.1 stub. Emits SAMPLE rows (fake example.invalid URLs) so each last-5
 * listing has a tappable source link. Never presented as live solds.
 */
export class StubCompsService implements CompsService {
  async getLastCompletedSolds(query: CompQuery): Promise<CompsResult> {
    return buildCompsResult(query, sampleSoldsForQuery(query), 'sample', SAMPLE_COMPS_MESSAGE);
  }
}
