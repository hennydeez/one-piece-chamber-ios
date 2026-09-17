import type { CompQuery, CompsLookupOptions, CompsResult, CompsService } from '../../models/comps';
import { emptyCompsResult } from './last5Avg';

export const UNCONFIGURED_COMPS_MESSAGE = 'No comps source set.';

/**
 * Default when no live endpoint is configured.
 * Returns n=0. Never invents solds or sample prices.
 */
export class UnconfiguredCompsService implements CompsService {
  async getLastCompletedSolds(query: CompQuery, options?: CompsLookupOptions): Promise<CompsResult> {
    return emptyCompsResult(
      query,
      'unconfigured',
      UNCONFIGURED_COMPS_MESSAGE,
      options?.mode === 'detailed' ? 'detailed' : 'quick',
    );
  }
}
