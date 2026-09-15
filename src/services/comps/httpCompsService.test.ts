import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  COMPS_TIMEOUT_MESSAGE,
  COMPS_UNREACHABLE_MESSAGE,
  HttpCompsService,
  asCompletedSold,
} from './httpCompsService';

const query = {
  cardCode: 'OP01-001',
  printNote: null,
  language: 'EN',
  type: 'PSA' as const,
  grade: '10',
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

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
  it('reads optional title from JSON', () => {
    const sold = asCompletedSold({
      ...base,
      title: '  OP01-001 Luffy PSA 10  ',
      sourceUrl: 'https://www.ebay.com/itm/123',
    });
    assert.ok(sold);
    assert.equal(sold.title, 'OP01-001 Luffy PSA 10');
  });

  it('omits blank title', () => {
    const sold = asCompletedSold({
      ...base,
      title: '   ',
      sourceUrl: 'https://www.ebay.com/itm/123',
    });
    assert.ok(sold);
    assert.equal(sold.title, undefined);
  });

  it('drops leftover sample / example.invalid solds', () => {
    assert.equal(
      asCompletedSold({
        ...base,
        sourceUrl: 'https://example.invalid/sample/fixture',
      }),
      null,
    );
    assert.equal(
      asCompletedSold({
        ...base,
        id: 'sample-99',
        sourceUrl: 'https://www.ebay.com/itm/123',
      }),
      null,
    );
  });

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

describe('HttpCompsService timeout', () => {
  it('returns the timeout message and no solds when the fetch is aborted', async () => {
    globalThis.fetch = async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        if (!signal) {
          reject(new Error('expected AbortSignal'));
          return;
        }
        const fail = () => {
          reject(Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' }));
        };
        if (signal.aborted) {
          fail();
          return;
        }
        signal.addEventListener('abort', fail, { once: true });
      });

    const result = await new HttpCompsService('https://example.com/comps.php', 15).getLastCompletedSolds(query);
    assert.equal(result.sourceStatus, 'error');
    assert.equal(result.sourceMessage, COMPS_TIMEOUT_MESSAGE);
    assert.equal(result.sourceMessage, 'Comps took too long. Try again.');
    assert.equal(result.last5.n, 0);
    assert.equal(result.last5.solds.length, 0);
    assert.equal(result.last5.averageAud, null);
  });

  it('keeps the reachability message for a non-timeout failure', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch');
    };

    const result = await new HttpCompsService('https://example.com/comps.php', 5_000).getLastCompletedSolds(query);
    assert.equal(result.sourceStatus, 'error');
    assert.equal(result.sourceMessage, COMPS_UNREACHABLE_MESSAGE);
    assert.equal(result.last5.n, 0);
    assert.equal(result.last5.solds.length, 0);
  });
});
