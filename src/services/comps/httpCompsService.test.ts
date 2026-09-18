import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  COMPS_QUOTA_MESSAGE,
  COMPS_TIMEOUT_MESSAGE,
  COMPS_UNREACHABLE_MESSAGE,
  DETAILED_SOURCE_MESSAGE,
  HttpCompsService,
  QUICK_SOURCE_MESSAGE,
  asCompletedSold,
  payloadSourceFailed,
  sourceMessageFromPayload,
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

  it('reads optional imageUrl from JSON', () => {
    const sold = asCompletedSold({
      ...base,
      sourceUrl: 'https://www.ebay.com/itm/123',
      imageUrl: '  https://cdn.example/op01-001.jpg  ',
    });
    assert.ok(sold);
    assert.equal(sold.imageUrl, 'https://cdn.example/op01-001.jpg');
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

  it('reads optional imageUrl and ignores blanks', () => {
    const sold = asCompletedSold({
      ...base,
      sourceUrl: 'https://www.ebay.com/itm/123',
      imageUrl: ' https://cdn.example/op01-001.jpg ',
    });
    assert.ok(sold);
    assert.equal(sold.imageUrl, 'https://cdn.example/op01-001.jpg');
    assert.equal(
      asCompletedSold({
        ...base,
        sourceUrl: 'https://www.ebay.com/itm/123',
        imageUrl: 'OP01-001',
      })?.imageUrl,
      undefined,
    );
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

describe('HttpCompsService query params', () => {
  it('asks for months=6 on Get comps and leaves mode off', async () => {
    let requested = '';
    globalThis.fetch = async (input) => {
      requested = String(input);
      return new Response(JSON.stringify([]), { status: 200 });
    };

    const result = await new HttpCompsService('https://example.com/comps.php').getLastCompletedSolds(query);
    const url = new URL(requested);
    assert.equal(url.searchParams.get('cardCode'), 'OP01-001');
    assert.equal(url.searchParams.get('completed'), 'true');
    assert.equal(url.searchParams.get('mode'), null);
    assert.equal(url.searchParams.get('months'), '6');
    assert.equal(result.lookupMode, 'quick');
    assert.equal(result.sourceMessage, QUICK_SOURCE_MESSAGE);
    assert.equal(result.months.length, 6);
  });

  it('adds mode=detailed and months=6 for Last 6 months', async () => {
    let requested = '';
    globalThis.fetch = async (input) => {
      requested = String(input);
      return new Response(
        JSON.stringify([
          {
            ...base,
            id: 'sep',
            soldAt: '2026-09-02T00:00:00.000Z',
            priceAud: 120,
            priceOriginal: 120,
            language: 'EN',
            grade: '10',
            sourceUrl: 'https://www.ebay.com/itm/sep',
          },
          {
            ...base,
            id: 'apr',
            soldAt: '2026-04-10T00:00:00.000Z',
            priceAud: 80,
            priceOriginal: 80,
            language: 'EN',
            grade: '10',
            sourceUrl: 'https://www.ebay.com/itm/apr',
          },
        ]),
        { status: 200 },
      );
    };

    const result = await new HttpCompsService('https://example.com/comps.php').getLastCompletedSolds(query, {
      mode: 'detailed',
    });
    const url = new URL(requested);
    assert.equal(url.searchParams.get('mode'), 'detailed');
    assert.equal(url.searchParams.get('months'), '6');
    assert.equal(result.lookupMode, 'detailed');
    assert.equal(result.sourceMessage, DETAILED_SOURCE_MESSAGE);
    assert.equal(result.solds.length, 2);
    assert.equal(result.months.length, 6);
    assert.equal(result.last5.n, 2);
  });

  it('treats an empty quota payload as an error, not live solds', async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          solds: [],
          sourceStatus: 'error',
          sourceMessage: 'SoldComps: Monthly quota exceeded and no credits remaining',
        }),
        { status: 200 },
      );

    const result = await new HttpCompsService('https://example.com/comps.php').getLastCompletedSolds(query, {
      mode: 'detailed',
    });
    assert.equal(result.sourceStatus, 'error');
    assert.equal(result.sourceMessage, COMPS_QUOTA_MESSAGE);
    assert.equal(result.last5.n, 0);
    assert.equal(result.solds.length, 0);
    assert.equal(result.months.every((month) => month.n === 0), true);
  });

  it('keeps a payload imageUrl when solds are empty', async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          solds: [],
          imageUrl: 'https://cdn.example/op01-001.jpg',
        }),
        { status: 200 },
      );

    const result = await new HttpCompsService('https://example.com/comps.php').getLastCompletedSolds(query);
    assert.equal(result.sourceStatus, 'live');
    assert.equal(result.last5.n, 0);
    assert.equal(result.solds.length, 0);
    assert.equal(result.imageUrl, 'https://cdn.example/op01-001.jpg');
  });
});

describe('comps payload honesty', () => {
  it('shortens a quota sourceMessage', () => {
    assert.equal(
      sourceMessageFromPayload(
        { sourceMessage: 'SoldComps: Monthly quota exceeded and no credits remaining' },
        'fallback',
      ),
      COMPS_QUOTA_MESSAGE,
    );
  });

  it('does not treat a true empty solds list as a source failure', () => {
    assert.equal(payloadSourceFailed({ solds: [] }, 0), false);
    assert.equal(payloadSourceFailed({ sourceStatus: 'error', sourceMessage: 'quota' }, 0), true);
    assert.equal(payloadSourceFailed({ sourceStatus: 'error' }, 3), false);
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
