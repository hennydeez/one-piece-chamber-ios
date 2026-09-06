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
  channel: SaleChannel;
}

export type CompsSourceStatus = 'live' | 'unconfigured' | 'error';

export interface CompsResult {
  query: CompQuery;
  fixed: Last5Avg;
  auction: Last5Avg;
  sourceStatus: CompsSourceStatus;
  sourceMessage: string;
  fetchedAt: string;
}

export interface CompsService {
  getLastCompletedSolds(query: CompQuery): Promise<CompsResult>;
}
