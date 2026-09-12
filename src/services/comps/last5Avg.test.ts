import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CompQuery, CompSold } from '../../models/comps';
import { LAST5_AVG_LABEL, buildCompsResult, honestCountLabel, selectLast5 } from './last5Avg';

const query: CompQuery = {
  cardCode: 'OP01-001',
  printNote: null,
  language: 'EN',
  type: 'PSA',
  grade: '10',
};

function sold(partial: Partial<CompSold> & Pick<CompSold, 'id' | 'soldAt' | 'priceAud' | 'channel'>): CompSold {
  return {
    cardCode: 'OP01-001',
    printNote: null,
    language: 'EN',
    type: 'PSA',
    grade: '10',
    completed: true,
    priceOriginal: partial.priceOriginal ?? partial.priceAud,
    currencyOriginal: partial.currencyOriginal ?? 'AUD',
    fxRateToAud: partial.fxRateToAud ?? null,
    fxStampedAt: partial.fxStampedAt ?? null,
    source: 'fixture',
    sourceUrl: 'https://www.ebay.com/itm/fixture',
    ...partial,
  };
}

describe('Last-5 avg', () => {
  it('uses the exact product label', () => {
    const result = buildCompsResult(query, [], 'unconfigured', 'stub');
    assert.equal(result.fixed.label, LAST5_AVG_LABEL);
    assert.equal(result.fixed.label, 'Last-5 avg (AUD)');
  });

  it('is an arithmetic mean of the selected AUD prices', () => {
    const result = buildCompsResult(
      query,
      [
        sold({ id: 'a', soldAt: '2026-01-05', priceAud: 100, channel: 'fixed' }),
        sold({ id: 'b', soldAt: '2026-01-04', priceAud: 200, channel: 'fixed' }),
        sold({ id: 'c', soldAt: '2026-01-03', priceAud: 300, channel: 'fixed' }),
      ],
      'live',
      'ok',
    );
    assert.equal(result.fixed.n, 3);
    assert.equal(result.fixed.averageAud, 200);
    assert.match(result.fixed.honestCountLabel, /n=3 of 5/);
  });

  it('never invents a price when there are no solds', () => {
    const result = buildCompsResult(query, [], 'unconfigured', 'none');
    assert.equal(result.fixed.averageAud, null);
    assert.equal(result.fixed.n, 0);
    assert.equal(result.auction.averageAud, null);
  });

  it('keeps auctions out of the fixed average', () => {
    const result = buildCompsResult(
      query,
      [
        sold({ id: 'f', soldAt: '2026-01-05', priceAud: 120, channel: 'fixed' }),
        sold({ id: 'a', soldAt: '2026-01-05', priceAud: 900, channel: 'auction' }),
      ],
      'live',
      'ok',
    );
    assert.equal(result.fixed.averageAud, 120);
    assert.equal(result.auction.averageAud, 900);
  });

  it('prefers AUD then fills with FX-stamped conversions, newest first, max 5', () => {
    const chosen = selectLast5([
      sold({ id: 'usd-old', soldAt: '2026-01-01', priceAud: 50, channel: 'fixed', currencyOriginal: 'USD', fxRateToAud: 1.5, fxStampedAt: '2026-01-01', priceOriginal: 33 }),
      sold({ id: 'aud-1', soldAt: '2026-02-01', priceAud: 110, channel: 'fixed' }),
      sold({ id: 'aud-2', soldAt: '2026-03-01', priceAud: 120, channel: 'fixed' }),
      sold({ id: 'usd-new', soldAt: '2026-04-01', priceAud: 80, channel: 'fixed', currencyOriginal: 'USD', fxRateToAud: 1.5, fxStampedAt: '2026-04-01', priceOriginal: 53 }),
      sold({ id: 'aud-3', soldAt: '2026-01-15', priceAud: 90, channel: 'fixed' }),
    ]);
    assert.deepEqual(
      chosen.map((s) => s.id),
      ['aud-2', 'aud-1', 'aud-3', 'usd-new', 'usd-old'],
    );
  });

  it('drops non-AUD solds that have no FX stamp', () => {
    const chosen = selectLast5([
      sold({
        id: 'bare-usd',
        soldAt: '2026-04-01',
        priceAud: 999,
        channel: 'fixed',
        currencyOriginal: 'USD',
        fxRateToAud: null,
        fxStampedAt: null,
        priceOriginal: 600,
      }),
    ]);
    assert.equal(chosen.length, 0);
  });

  it('drops leftover sample / example.invalid solds from the last 5', () => {
    const chosen = selectLast5([
      sold({
        id: 'live',
        soldAt: '2026-01-05',
        priceAud: 100,
        channel: 'fixed',
        sourceUrl: 'https://www.ebay.com/itm/live',
      }),
      sold({
        id: 'sample-row',
        soldAt: '2026-01-06',
        priceAud: 999,
        channel: 'fixed',
        sourceUrl: 'https://example.invalid/sample/fixture',
      }),
    ]);
    assert.deepEqual(
      chosen.map((s) => s.id),
      ['live'],
    );
  });

  it('reports honest n when under 5', () => {
    assert.equal(honestCountLabel(0), 'n=0 of 5');
    assert.equal(honestCountLabel(2), 'n=2 of 5');
    assert.equal(honestCountLabel(5), 'n=5 of 5');
  });
});
