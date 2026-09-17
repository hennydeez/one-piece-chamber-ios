import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CompQuery, CompSold } from '../../models/comps';
import {
  LAST5_AVG_LABEL,
  DETAILED_SOURCE_MESSAGE,
  buildCompsResult,
  compsViewMessage,
  honestCountLabel,
  selectLast5,
  selectMergedLast5,
  shouldRefetchDetailed,
  stampMergedLast5Avg,
} from './last5Avg';

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
    assert.equal(result.last5.label, LAST5_AVG_LABEL);
    assert.equal(result.last5.label, 'Last-5 avg (AUD)');
    assert.equal(result.fixed.label, LAST5_AVG_LABEL);
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
    assert.equal(result.last5.averageAud, null);
    assert.equal(result.last5.n, 0);
    assert.equal(result.last5.solds.length, 0);
    assert.equal(result.fixed.averageAud, null);
    assert.equal(result.fixed.n, 0);
    assert.equal(result.auction.averageAud, null);
    assert.equal(result.solds.length, 0);
    assert.equal(result.months.length, 6);
    assert.equal(
      result.months.every((month) => month.n === 0 && month.averageAud === null),
      true,
    );
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

  it('drops noise titles from last-5 and keeps untitled rows', () => {
    const chosen = selectLast5([
      sold({ id: 'playset', soldAt: '2026-01-06', priceAud: 400, channel: 'fixed', title: 'Playset' }),
      sold({ id: 'clean', soldAt: '2026-01-05', priceAud: 100, channel: 'fixed', title: 'OP01-001 Luffy PSA 10' }),
      sold({ id: 'untitled', soldAt: '2026-01-04', priceAud: 90, channel: 'fixed' }),
    ]);
    assert.deepEqual(
      chosen.map((s) => s.id),
      ['clean', 'untitled'],
    );
    assert.equal(chosen[1]?.title, undefined);
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

describe('merged last-5', () => {
  it('merges BIN and auction, newest first, max 5', () => {
    const chosen = selectMergedLast5([
      sold({ id: 'old-auc', soldAt: '2026-01-01', priceAud: 600, channel: 'auction' }),
      sold({ id: 'd', soldAt: '2026-01-02', priceAud: 500, channel: 'fixed' }),
      sold({ id: 'c', soldAt: '2026-01-03', priceAud: 400, channel: 'auction' }),
      sold({ id: 'b', soldAt: '2026-01-04', priceAud: 300, channel: 'fixed' }),
      sold({ id: 'a', soldAt: '2026-01-05', priceAud: 200, channel: 'auction' }),
      sold({ id: 'newest', soldAt: '2026-01-06', priceAud: 100, channel: 'fixed' }),
    ]);
    assert.deepEqual(
      chosen.map((s) => s.id),
      ['newest', 'a', 'b', 'c', 'd'],
    );
    assert.equal(chosen.length, 5);
  });

  it('averages only the rows actually shown', () => {
    const stamped = stampMergedLast5Avg([
      sold({ id: 'newest', soldAt: '2026-01-06', priceAud: 100, channel: 'fixed' }),
      sold({ id: 'a', soldAt: '2026-01-05', priceAud: 200, channel: 'auction' }),
      sold({ id: 'b', soldAt: '2026-01-04', priceAud: 300, channel: 'fixed' }),
      sold({ id: 'c', soldAt: '2026-01-03', priceAud: 400, channel: 'auction' }),
      sold({ id: 'd', soldAt: '2026-01-02', priceAud: 500, channel: 'fixed' }),
      sold({ id: 'dropped', soldAt: '2026-01-01', priceAud: 9999, channel: 'auction' }),
    ]);
    assert.equal(stamped.label, LAST5_AVG_LABEL);
    assert.equal(stamped.n, 5);
    assert.equal(stamped.averageAud, 300);
    assert.equal(stamped.honestCountLabel, 'n=5 of 5');
    assert.equal(stamped.solds.some((row) => row.id === 'dropped'), false);
  });

  it('averages n of 5 when fewer than 5 solds exist', () => {
    const stamped = stampMergedLast5Avg([
      sold({ id: 'a', soldAt: '2026-01-03', priceAud: 10, channel: 'fixed' }),
      sold({ id: 'b', soldAt: '2026-01-02', priceAud: 20, channel: 'auction' }),
      sold({ id: 'c', soldAt: '2026-01-01', priceAud: 30, channel: 'fixed' }),
    ]);
    assert.equal(stamped.n, 3);
    assert.equal(stamped.averageAud, 20);
    assert.equal(stamped.honestCountLabel, 'n=3 of 5');
  });

  it('is empty and Unavailable when n=0', () => {
    const stamped = stampMergedLast5Avg([]);
    assert.equal(stamped.n, 0);
    assert.equal(stamped.solds.length, 0);
    assert.equal(stamped.averageAud, null);
    assert.equal(stamped.honestCountLabel, 'n=0 of 5');
    assert.equal(stamped.label, 'Last-5 avg (AUD)');
  });

  it('does not invent prices or titles', () => {
    const chosen = selectMergedLast5([
      sold({ id: 'named', soldAt: '2026-01-02', priceAud: 80, channel: 'fixed', title: 'OP01-001 Luffy PSA 10' }),
      sold({ id: 'plain', soldAt: '2026-01-01', priceAud: 90, channel: 'auction' }),
    ]);
    assert.equal(chosen[0]?.title, 'OP01-001 Luffy PSA 10');
    assert.equal(chosen[1]?.title, undefined);
    assert.equal(
      chosen.every((row) => row.priceAud === 80 || row.priceAud === 90),
      true,
    );
  });

  it('ranks a newer FX-stamped sold ahead of an older AUD sold', () => {
    const chosen = selectMergedLast5([
      sold({
        id: 'usd-new',
        soldAt: '2026-04-01',
        priceAud: 80,
        channel: 'auction',
        currencyOriginal: 'USD',
        fxRateToAud: 1.5,
        fxStampedAt: '2026-04-01',
        priceOriginal: 53,
      }),
      sold({ id: 'aud-old', soldAt: '2026-01-01', priceAud: 110, channel: 'fixed' }),
    ]);
    assert.deepEqual(
      chosen.map((s) => s.id),
      ['usd-new', 'aud-old'],
    );
  });

  it('drops leftover sample solds and bare non-AUD rows', () => {
    const chosen = selectMergedLast5([
      sold({
        id: 'sample-row',
        soldAt: '2026-01-06',
        priceAud: 999,
        channel: 'fixed',
        sourceUrl: 'https://example.invalid/sample/fixture',
      }),
      sold({
        id: 'bare-usd',
        soldAt: '2026-01-05',
        priceAud: 888,
        channel: 'auction',
        currencyOriginal: 'USD',
        fxRateToAud: null,
        fxStampedAt: null,
        priceOriginal: 600,
      }),
      sold({ id: 'live', soldAt: '2026-01-04', priceAud: 75, channel: 'fixed' }),
    ]);
    assert.deepEqual(
      chosen.map((s) => s.id),
      ['live'],
    );
  });

  it('drops noise titles from the merged last-5 and keeps untitled rows', () => {
    const chosen = selectMergedLast5([
      sold({ id: 'playset', soldAt: '2026-01-06', priceAud: 400, channel: 'fixed', title: 'OP01-001 playset' }),
      sold({ id: 'x4', soldAt: '2026-01-05', priceAud: 350, channel: 'auction', title: 'Luffy X4' }),
      sold({ id: 'lot', soldAt: '2026-01-04', priceAud: 300, channel: 'fixed', title: 'Lot of 3 Luffy' }),
      sold({ id: 'bundle', soldAt: '2026-01-03', priceAud: 250, channel: 'auction', title: 'Sealed bundle' }),
      sold({ id: 'clean', soldAt: '2026-01-02', priceAud: 80, channel: 'fixed', title: 'OP01-001 Luffy PSA 10' }),
      sold({ id: 'untitled', soldAt: '2026-01-01', priceAud: 90, channel: 'auction' }),
    ]);
    assert.deepEqual(
      chosen.map((s) => s.id),
      ['clean', 'untitled'],
    );
    assert.equal(chosen[0]?.title, 'OP01-001 Luffy PSA 10');
    assert.equal(chosen[1]?.title, undefined);
  });

  it('lets cleaner solds fill last-5 when newer rows are noise', () => {
    const chosen = selectMergedLast5([
      sold({ id: 'noise-new', soldAt: '2026-01-10', priceAud: 999, channel: 'fixed', title: 'PLAYSET x4' }),
      sold({ id: 'a', soldAt: '2026-01-09', priceAud: 10, channel: 'auction', title: 'OP01-001' }),
      sold({ id: 'b', soldAt: '2026-01-08', priceAud: 20, channel: 'fixed' }),
      sold({ id: 'c', soldAt: '2026-01-07', priceAud: 30, channel: 'auction', title: 'Romance Dawn' }),
      sold({ id: 'd', soldAt: '2026-01-06', priceAud: 40, channel: 'fixed', title: 'Leader EN' }),
      sold({ id: 'e', soldAt: '2026-01-05', priceAud: 50, channel: 'auction' }),
      sold({ id: 'too-old', soldAt: '2026-01-04', priceAud: 60, channel: 'fixed', title: 'older clean' }),
    ]);
    assert.deepEqual(
      chosen.map((s) => s.id),
      ['a', 'b', 'c', 'd', 'e'],
    );
    assert.equal(chosen.length, 5);
  });

  it('averages only the cleaner rows actually shown', () => {
    const stamped = stampMergedLast5Avg([
      sold({ id: 'lot', soldAt: '2026-01-03', priceAud: 900, channel: 'fixed', title: 'lot of 4' }),
      sold({ id: 'a', soldAt: '2026-01-02', priceAud: 10, channel: 'auction', title: 'OP01-001' }),
      sold({ id: 'b', soldAt: '2026-01-01', priceAud: 30, channel: 'fixed' }),
    ]);
    assert.equal(stamped.n, 2);
    assert.equal(stamped.averageAud, 20);
    assert.equal(stamped.honestCountLabel, 'n=2 of 5');
    assert.equal(stamped.solds.some((row) => row.id === 'lot'), false);
  });

  it('puts last-6-month buckets on CompsResult without inventing prices', () => {
    const result = buildCompsResult(
      query,
      [
        sold({ id: 'sep', soldAt: '2026-09-04', priceAud: 120, channel: 'fixed' }),
        sold({ id: 'lot', soldAt: '2026-09-03', priceAud: 900, channel: 'auction', title: 'lot of 4' }),
        sold({ id: 'old', soldAt: '2025-01-01', priceAud: 40, channel: 'fixed' }),
      ],
      'live',
      'ok',
      '2026-09-15T12:00:00.000Z',
      'detailed',
    );
    assert.equal(result.lookupMode, 'detailed');
    assert.equal(result.months.length, 6);
    assert.equal(result.months[0]?.label, 'Sep 2026');
    assert.equal(result.months[0]?.n, 1);
    assert.equal(result.months[0]?.averageAud, 120);
    assert.equal(result.solds.some((row) => row.id === 'lot'), false);
    assert.equal(result.months[0]?.solds.some((row) => row.id === 'lot'), false);
    assert.equal(
      result.months.slice(1).every((month) => month.n === 0 && month.averageAud === null),
      true,
    );
    assert.equal(result.last5.n, 2);
    assert.deepEqual(
      result.last5.solds.map((row) => row.id),
      ['sep', 'old'],
    );
  });

  it('does not refetch Last 6 months when solds are already on the result', () => {
    const withSolds = buildCompsResult(
      query,
      [sold({ id: 'sep', soldAt: '2026-09-04', priceAud: 120, channel: 'fixed' })],
      'live',
      'ok',
      '2026-09-15T12:00:00.000Z',
    );
    assert.equal(shouldRefetchDetailed(withSolds), false);
    assert.equal(compsViewMessage(withSolds, 'detailed'), DETAILED_SOURCE_MESSAGE);
    assert.equal(shouldRefetchDetailed(null), false);
    const emptyLive = buildCompsResult(query, [], 'live', 'ok');
    assert.equal(shouldRefetchDetailed(emptyLive), true);
    const failed = buildCompsResult(query, [], 'error', 'Comps quota exceeded. Try again.');
    assert.equal(shouldRefetchDetailed(failed), false);
  });

  it('puts the merged last-5 on CompsResult.last5', () => {
    const result = buildCompsResult(
      query,
      [
        sold({ id: 'f', soldAt: '2026-01-05', priceAud: 120, channel: 'fixed' }),
        sold({ id: 'a', soldAt: '2026-01-04', priceAud: 180, channel: 'auction' }),
      ],
      'live',
      'ok',
    );
    assert.equal(result.last5.n, 2);
    assert.equal(result.last5.averageAud, 150);
    assert.deepEqual(
      result.last5.solds.map((s) => s.id),
      ['f', 'a'],
    );
    assert.equal(result.fixed.averageAud, 120);
    assert.equal(result.auction.averageAud, 180);
  });
});
