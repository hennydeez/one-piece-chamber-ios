import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { StubCompsService, UNCONFIGURED_COMPS_MESSAGE } from './stubCompsService';

describe('StubCompsService', () => {
  it('returns an honest empty result and never invents prices', async () => {
    const service = new StubCompsService();
    const result = await service.getLastCompletedSolds({
      cardCode: 'OP01-001',
      printNote: null,
      language: 'EN',
      type: 'Raw',
      grade: null,
    });
    assert.equal(result.sourceStatus, 'unconfigured');
    assert.equal(result.sourceMessage, UNCONFIGURED_COMPS_MESSAGE);
    assert.equal(result.fixed.averageAud, null);
    assert.equal(result.fixed.solds.length, 0);
    assert.equal(result.auction.solds.length, 0);
    assert.equal(result.fixed.label, 'Last-5 avg (AUD)');
  });
});
