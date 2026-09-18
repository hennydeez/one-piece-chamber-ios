import type { CompsService } from '../../models/comps';
import { HttpCompsService } from './httpCompsService';

export {
  DETAILED_SOURCE_MESSAGE,
  LAST5_AVG_LABEL,
  QUICK_SOURCE_MESSAGE,
  buildCompsResult,
  compsViewMessage,
  emptyCompsResult,
  honestCountLabel,
  selectLast5,
  selectLiveSolds,
  selectMergedLast5,
  shouldRefetchDetailed,
  stampLast5Avg,
  stampMergedLast5Avg,
} from './last5Avg';
export {
  DETAILED_MONTHS,
  bucketSoldsByMonth,
  calendarMonthKey,
  chartBarsFromMonths,
  formatAudCompact,
  formatMonthLabel,
  lastCalendarMonthKeys,
} from './monthBuckets';
export { isNoiseTitle, withoutNoiseTitles } from './noiseTitle';
export { filterMatchingSolds, matchesScoutRules } from './scoutMatch';
export { UNCONFIGURED_COMPS_MESSAGE, UnconfiguredCompsService } from './unconfiguredCompsService';
export { HttpCompsService } from './httpCompsService';
export {
  SAMPLE_SOURCE_HOST,
  isSampleSold,
  isSampleSourceUrl,
  resolveSourceLabel,
  resolveSourceUrl,
} from './sourceLink';
export { firstSoldImageUrl, imageUrlFromPayload, readImageUrl } from './imageUrl';
export { cardMatchesCompQuery, resolveQueryPhotoUri } from './queryPhoto';

/** Public Chamber comps.php. Baked in so Expo Go works without eas.json / .env. */
export const DEFAULT_COMPS_API_URL =
  'https://whitesmoke-woodpecker-609130.hostingersite.com/api/comps.php';

/**
 * Live URL is EXPO_PUBLIC_COMPS_API_URL when set (eas.json / .env).
 * Expo Go does not load eas.json env — blank/unset falls back to DEFAULT_COMPS_API_URL
 * so createCompsService() always returns HttpCompsService. Never invents solds.
 */
export function createCompsService(): CompsService {
  const endpoint = process.env.EXPO_PUBLIC_COMPS_API_URL?.trim() || DEFAULT_COMPS_API_URL;
  return new HttpCompsService(endpoint);
}

export const compsService: CompsService = createCompsService();
