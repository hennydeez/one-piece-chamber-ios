import type { CompsService } from '../../models/comps';
import { HttpCompsService } from './httpCompsService';
import { StubCompsService } from './stubCompsService';

export { LAST5_AVG_LABEL, buildCompsResult, emptyCompsResult, honestCountLabel, selectLast5, stampLast5Avg } from './last5Avg';
export { filterMatchingSolds, matchesScoutRules } from './scoutMatch';
export { SAMPLE_COMPS_MESSAGE, StubCompsService, UNCONFIGURED_COMPS_MESSAGE, sampleSoldsForQuery } from './stubCompsService';
export { HttpCompsService } from './httpCompsService';
export { SAMPLE_SOURCE_HOST, isSampleSourceUrl, resolveSourceLabel, resolveSourceUrl, sampleSourceUrl } from './sourceLink';

export function createCompsService(): CompsService {
  const endpoint = process.env.EXPO_PUBLIC_COMPS_API_URL?.trim();
  if (endpoint) {
    return new HttpCompsService(endpoint);
  }
  return new StubCompsService();
}

export const compsService: CompsService = createCompsService();
