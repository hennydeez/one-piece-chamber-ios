import type { CardType } from './card';

export type SaleChannel = 'fixed' | 'auction';

export interface CompQuery {
  cardCode: string;
  printNote: string | null;
  language: string;
  type: CardType;
  grade: string | null;
}

export interface CompSold {
  id: string;
  cardCode: string;
  printNote: string | null;
  language: string;
  type: CardType;
  grade: string | null;
  soldAt: string;
  channel: SaleChannel;
  completed: true;
  priceOriginal: number;
  currencyOriginal: string;
  priceAud: number;
  fxRateToAud: number | null;
  fxStampedAt: string | null;
  source: string;
  /** URL of the sold listing (eBay sold, PriceCharting, etc.) for accuracy checks. */
  sourceUrl: string;
  /** Button / link caption. Defaults to a generic “Open sold listing”. */
  sourceLabel?: string;
  /** Listing title from the live API. Optional — never invented client-side. */
  title?: string;
  /** Card / listing photo from the live API. Optional — never invented client-side. */
  imageUrl?: string;
  /** @deprecated Prefer sourceUrl. Accepted from live payloads as a fallback. */
  listingUrl?: string;
}

export interface Last5Avg {
  /** Fixed product label — do not rename. */
  label: 'Last-5 avg (AUD)';
  averageAud: number | null;
  n: number;
  maxN: 5;
  honestCountLabel: string;
  solds: CompSold[];
  /** Set on per-channel stamps. Omitted on the merged last-5 table. */
  channel?: SaleChannel;
}

export type CompsLookupMode = 'quick' | 'detailed';

export interface CompsLookupOptions {
  mode?: CompsLookupMode;
}

export interface MonthBucket {
  /** Calendar month `YYYY-MM`. */
  key: string;
  /** e.g. Sep 2026 */
  label: string;
  n: number;
  /** Arithmetic mean of that month’s matching AUD prices. Null when n=0 — never invented. */
  averageAud: number | null;
  solds: CompSold[];
}

export interface MonthChartBar {
  key: string;
  /** Tick under the bar, e.g. Sep or Sep 25 when the window spans years. */
  label: string;
  /** Full month label, e.g. Sep 2026 */
  fullLabel: string;
  averageAud: number | null;
  n: number;
  /** 0–1 vs the max real monthly avg. Empty months are 0. */
  heightRatio: number;
  /** Number on the bar. Empty months are "—" — not a fake $0 sold. */
  valueLabel: string;
}

export type CompsSourceStatus = 'live' | 'unconfigured' | 'error' | 'sample';

export interface CompsResult {
  query: CompQuery;
  /** Newest completed solds across BIN + auction, max 5, plus their arithmetic avg. */
  last5: Last5Avg;
  fixed: Last5Avg;
  auction: Last5Avg;
  /**
   * Matching live solds after Scout + noise filters, newest first.
   * Quick may be a short list. Detailed asks the source for last 6 months.
   */
  solds: CompSold[];
  /** Last 6 calendar months, newest first. Always 6 slots; empty months have n=0. */
  months: MonthBucket[];
  lookupMode: CompsLookupMode;
  /**
   * Card photo from the live payload (or a sold row). Optional.
   * Shown after Get comps even when solds are empty — never invented.
   */
  imageUrl: string | null;
  sourceStatus: CompsSourceStatus;
  sourceMessage: string;
  fetchedAt: string;
}

export interface CompsService {
  getLastCompletedSolds(query: CompQuery, options?: CompsLookupOptions): Promise<CompsResult>;
}
