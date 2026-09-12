import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSampleSold, isSampleSourceUrl, resolveSourceLabel, resolveSourceUrl } from './sourceLink';

describe('sourceLink', () => {
  it('prefers sourceUrl over listingUrl', () => {
    assert.equal(
      resolveSourceUrl({
        sourceUrl: 'https://www.ebay.com/itm/a',
        listingUrl: 'https://www.ebay.com/itm/b',
      }),
      'https://www.ebay.com/itm/a',
    );
  });

  it('falls back to listingUrl', () => {
    assert.equal(
      resolveSourceUrl({ sourceUrl: '', listingUrl: 'https://www.pricecharting.com/game/b' }),
      'https://www.pricecharting.com/game/b',
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

  it('defaults the link caption when sourceLabel is missing', () => {
    assert.equal(
      resolveSourceLabel({ sourceUrl: 'https://www.ebay.com/itm/1' }),
      'Open sold listing',
    );
  });

  it('flags leftover sample / stub solds so they never render', () => {
    assert.equal(isSampleSourceUrl('https://example.invalid/sample/ebay-sold/op01-001'), true);
    assert.equal(
      isSampleSold({
        id: 'live-1',
        source: 'live',
        sourceUrl: 'https://example.invalid/sample/fixture',
      }),
      true,
    );
    assert.equal(
      isSampleSold({
        id: 'sample-1',
        source: 'live',
        sourceUrl: 'https://www.ebay.com/itm/1',
      }),
      true,
    );
    assert.equal(
      isSampleSold({
        id: 'stub-1',
        source: 'stub',
        sourceUrl: 'https://www.ebay.com/itm/1',
      }),
      true,
    );
  });

  it('does not treat a real host as sample', () => {
    assert.equal(isSampleSourceUrl('https://www.pricecharting.com/game/foo'), false);
    assert.equal(
      isSampleSold({
        id: 'ebay-1',
        source: 'soldcomps-ebay',
        sourceUrl: 'https://www.ebay.com.au/itm/123',
        title: 'OP01-001 Monkey D. Luffy PSA 10',
      }),
      false,
    );
  });
});
