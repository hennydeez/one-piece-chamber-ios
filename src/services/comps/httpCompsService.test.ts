import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asCompletedSold } from './httpCompsService';

const base = {
  id: 'live-1',
  cardCode: 'OP01-001',
  soldAt: '2026-08-01T00:00:00.000Z',
  channel: 'fixed',
  completed: true,
  priceOriginal: 100,
  currencyOriginal: 'AUD',
  priceAud: 100,
  type: 'PSA',
};

describe('asCompletedSold source fields', () => {
  it('reads sourceUrl and sourceLabel', () => {
    const sold = asCompletedSold({
      ...base,
      sourceUrl: 'https://www.ebay.com/itm/123',
      sourceLabel: 'eBay sold listing',
    });
    assert.ok(sold);
    assert.equal(sold.sourceUrl, 'https://www.ebay.com/itm/123');
    assert.equal(sold.sourceLabel, 'eBay sold listing');
  });

  it('falls back from listingUrl to sourceUrl', () => {
    const sold = asCompletedSold({
      ...base,
      listingUrl: 'https://www.pricecharting.com/game/op01-001',
    });
    assert.ok(sold);
    assert.equal(sold.sourceUrl, 'https://www.pricecharting.com/game/op01-001');
  });
});
