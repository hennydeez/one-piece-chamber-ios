import type { CompQuery, CompsResult, CompsService } from '../../models/comps';
import { emptyCompsResult } from './last5Avg';

export const UNCONFIGURED_COMPS_MESSAGE =
  'Live comps source is not configured. Chamber does not invent solds or label placeholder prices as real.';

/**
 * Default v1 provider. Returns an honest empty result.
 * Swap via createCompsService() when a live completed-solds API exists.
 */
export class StubCompsService implements CompsService {
  async getLastCompletedSolds(query: CompQuery): Promise<CompsResult> {
    return emptyCompsResult(query, 'unconfigured', UNCONFIGURED_COMPS_MESSAGE);
  }
}
