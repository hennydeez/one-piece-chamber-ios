import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isSampleSourceUrl,
  resolveSourceLabel,
  resolveSourceUrl,
  sampleSourceUrl,
} from './sourceLink';

describe('sourceLink', () => {
  it('prefers sourceUrl over listingUrl', () => {
    assert.equal(
      resolveSourceUrl({
        sourceUrl: 'https://example.invalid/a',
        listingUrl: 'https://example.invalid/b',
      }),
      'https://example.invalid/a',
    );
  });

  it('falls back to listingUrl', () => {
    assert.equal(
      resolveSourceUrl({ sourceUrl: '', listingUrl: 'https://example.invalid/b' }),
      'https://example.invalid/b',
    );
  });

  it('returns null when both are blank', () => {
    assert.equal(resolveSourceUrl({ sourceUrl: '  ', listingUrl: '' }), null);
  });

  it('uses sourceLabel when present', () => {
    assert.equal(
      resolveSourceLabel({
        sourceUrl: 'https://ebay.example/item/1',
        sourceLabel: 'eBay sold',
      }),
      'eBay sold',
    );
  });

  it('labels sample URLs as not live', () => {
    const url = sampleSourceUrl('ebay-sold', 'op01-001');
    assert.equal(isSampleSourceUrl(url), true);
    assert.match(resolveSourceLabel({ sourceUrl: url }), /not live/i);
  });

  it('does not treat a real host as sample', () => {
    assert.equal(isSampleSourceUrl('https://www.pricecharting.com/game/foo'), false);
  });
});
