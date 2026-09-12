import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UNCONFIGURED_COMPS_MESSAGE, UnconfiguredCompsService } from './unconfiguredCompsService';

describe('UnconfiguredCompsService', () => {
  it('returns empty live-ready result with no invented solds', async () => {
    const service = new UnconfiguredCompsService();
    const result = await service.getLastCompletedSolds({
      cardCode: 'OP01-001',
      printNote: null,
      language: 'EN',
      type: 'PSA',
      grade: '10',
    });
    assert.equal(result.sourceStatus, 'unconfigured');
    assert.equal(result.sourceMessage, UNCONFIGURED_COMPS_MESSAGE);
    assert.equal(result.last5.label, 'Last-5 avg (AUD)');
    assert.equal(result.last5.n, 0);
    assert.equal(result.last5.solds.length, 0);
    assert.equal(result.last5.averageAud, null);
    assert.equal(result.fixed.label, 'Last-5 avg (AUD)');
    assert.equal(result.fixed.n, 0);
    assert.equal(result.auction.n, 0);
    assert.equal(result.fixed.solds.length, 0);
    assert.equal(result.auction.solds.length, 0);
    assert.equal(result.fixed.averageAud, null);
  });
});
