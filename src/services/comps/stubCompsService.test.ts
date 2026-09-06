import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SAMPLE_COMPS_MESSAGE, StubCompsService } from './stubCompsService';
import { isSampleSourceUrl } from './sourceLink';

describe('StubCompsService', () => {
  it('returns sample rows with fake example.invalid source links, never as live solds', async () => {
    const service = new StubCompsService();
    const query = {
      cardCode: 'OP01-001',
      printNote: null,
      language: 'EN',
      type: 'PSA' as const,
      grade: '10',
    };
    const result = await service.getLastCompletedSolds(query);
    assert.equal(result.sourceStatus, 'sample');
    assert.equal(result.sourceMessage, SAMPLE_COMPS_MESSAGE);
    assert.equal(result.fixed.label, 'Last-5 avg (AUD)');
    assert.equal(result.fixed.n, 3);
    assert.equal(result.auction.n, 2);
    assert.ok(result.fixed.solds.length > 0);
    for (const sold of [...result.fixed.solds, ...result.auction.solds]) {
      assert.equal(sold.cardCode, 'OP01-001');
      assert.equal(sold.source, 'sample');
      assert.ok(sold.sourceUrl.length > 0);
      assert.equal(isSampleSourceUrl(sold.sourceUrl), true);
      assert.match(sold.sourceLabel ?? '', /not live/i);
    }
  });
});
