import type { CompsService } from '../../models/comps';
import { HttpCompsService } from './httpCompsService';

export {
  LAST5_AVG_LABEL,
  buildCompsResult,
  emptyCompsResult,
  honestCountLabel,
  selectLast5,
  selectMergedLast5,
  stampLast5Avg,
  stampMergedLast5Avg,
} from './last5Avg';
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
