import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CompSold } from '../../models/comps';
import {
  bucketSoldsByMonth,
  calendarMonthKey,
  chartBarsFromMonths,
  formatAudCompact,
  formatMonthLabel,
  lastCalendarMonthKeys,
} from './monthBuckets';

const now = new Date('2026-09-15T12:00:00.000Z');

function sold(partial: Partial<CompSold> & Pick<CompSold, 'id' | 'soldAt' | 'priceAud'>): CompSold {
  return {
    cardCode: 'OP01-001',
    printNote: null,
    language: 'EN',
    type: 'PSA',
    grade: '10',
    completed: true,
    channel: partial.channel ?? 'fixed',
    priceOriginal: partial.priceOriginal ?? partial.priceAud,
    currencyOriginal: partial.currencyOriginal ?? 'AUD',
    fxRateToAud: partial.fxRateToAud ?? null,
    fxStampedAt: partial.fxStampedAt ?? null,
    source: 'fixture',
    sourceUrl: 'https://www.ebay.com/itm/fixture',
    ...partial,
  };
}

describe('calendar months', () => {
  it('reads YYYY-MM from the ISO prefix so AU offsets do not shift the day', () => {
    assert.equal(calendarMonthKey('2026-09-01T00:00:00+10:00'), '2026-09');
    assert.equal(calendarMonthKey('2026-09-15'), '2026-09');
    assert.equal(calendarMonthKey('2026-04-30T23:00:00.000Z'), '2026-04');
  });

  it('returns null for a bad date instead of inventing a month', () => {
    assert.equal(calendarMonthKey('not-a-date'), null);
    assert.equal(calendarMonthKey('2026-13-01'), null);
  });

  it('labels months like Sep 2026', () => {
    assert.equal(formatMonthLabel('2026-09'), 'Sep 2026');
    assert.equal(formatMonthLabel('2026-04'), 'Apr 2026');
  });

  it('lists the last 6 calendar months, newest first', () => {
    assert.deepEqual(lastCalendarMonthKeys(now), [
      '2026-09',
      '2026-08',
      '2026-07',
      '2026-06',
      '2026-05',
      '2026-04',
    ]);
  });

  it('crosses the year boundary when needed', () => {
    assert.deepEqual(lastCalendarMonthKeys(new Date('2026-02-10T00:00:00.000Z')), [
      '2026-02',
      '2026-01',
      '2025-12',
      '2025-11',
      '2025-10',
      '2025-09',
    ]);
  });
});

describe('bucketSoldsByMonth', () => {
  it('always returns 6 slots and keeps empty months honest', () => {
    const months = bucketSoldsByMonth([], now);
    assert.equal(months.length, 6);
    assert.deepEqual(
      months.map((month) => month.key),
      ['2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04'],
    );
    assert.equal(
      months.every((month) => month.n === 0 && month.averageAud === null && month.solds.length === 0),
      true,
    );
    assert.equal(months[0]?.label, 'Sep 2026');
  });

  it('groups matching solds into the sold month and averages AUD', () => {
    const months = bucketSoldsByMonth(
      [
        sold({ id: 'sep-new', soldAt: '2026-09-12', priceAud: 200, channel: 'fixed' }),
        sold({ id: 'sep-old', soldAt: '2026-09-02', priceAud: 100, channel: 'auction' }),
        sold({ id: 'jul', soldAt: '2026-07-20', priceAud: 80, channel: 'fixed' }),
      ],
      now,
    );
    assert.equal(months[0]?.label, 'Sep 2026');
    assert.equal(months[0]?.n, 2);
    assert.equal(months[0]?.averageAud, 150);
    assert.deepEqual(
      months[0]?.solds.map((row) => row.id),
      ['sep-new', 'sep-old'],
    );
    assert.equal(months[2]?.key, '2026-07');
    assert.equal(months[2]?.n, 1);
    assert.equal(months[2]?.averageAud, 80);
    assert.equal(months[1]?.n, 0);
    assert.equal(months[1]?.averageAud, null);
  });

  it('drops solds outside the last 6 months instead of inventing a bucket', () => {
    const months = bucketSoldsByMonth(
      [
        sold({ id: 'too-old', soldAt: '2026-03-31', priceAud: 999, channel: 'fixed' }),
        sold({ id: 'in-window', soldAt: '2026-04-01', priceAud: 40, channel: 'fixed' }),
      ],
      now,
    );
    assert.equal(months.some((month) => month.solds.some((row) => row.id === 'too-old')), false);
    assert.equal(months[5]?.key, '2026-04');
    assert.equal(months[5]?.n, 1);
    assert.equal(months[5]?.averageAud, 40);
    assert.equal(months.every((month) => month.averageAud !== 999), true);
  });

  it('skips a bad soldAt rather than inventing a price or month', () => {
    const months = bucketSoldsByMonth(
      [sold({ id: 'bad', soldAt: 'whenever', priceAud: 500, channel: 'fixed' })],
      now,
    );
    assert.equal(months.every((month) => month.n === 0 && month.averageAud === null), true);
  });
});

describe('chartBarsFromMonths', () => {
  it('orders oldest month on the left and labels real averages', () => {
    const bars = chartBarsFromMonths(
      bucketSoldsByMonth(
        [
          sold({ id: 'sep', soldAt: '2026-09-01', priceAud: 200, channel: 'fixed' }),
          sold({ id: 'apr', soldAt: '2026-04-10', priceAud: 100, channel: 'auction' }),
        ],
        now,
      ),
    );
    assert.equal(bars.length, 6);
    assert.deepEqual(
      bars.map((bar) => bar.key),
      ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'],
    );
    assert.equal(bars[0]?.valueLabel, formatAudCompact(100));
    assert.equal(bars[0]?.averageAud, 100);
    assert.equal(bars[0]?.heightRatio, 0.5);
    assert.equal(bars[5]?.valueLabel, formatAudCompact(200));
    assert.equal(bars[5]?.heightRatio, 1);
    assert.equal(bars[5]?.label, 'Sep');
  });

  it('shows empty months as 0 height and an em dash — no invented price', () => {
    const bars = chartBarsFromMonths(bucketSoldsByMonth([], now));
    assert.equal(bars.length, 6);
    assert.equal(
      bars.every((bar) => bar.n === 0 && bar.averageAud === null && bar.heightRatio === 0 && bar.valueLabel === '—'),
      true,
    );
    assert.equal(bars.some((bar) => bar.valueLabel.includes('0') || bar.averageAud === 0), false);
  });

  it('adds a 2-digit year on ticks when the window spans years', () => {
    const bars = chartBarsFromMonths(
      bucketSoldsByMonth([], new Date('2026-02-10T00:00:00.000Z')),
    );
    assert.equal(bars[0]?.label, 'Sep 25');
    assert.equal(bars[5]?.label, 'Feb 26');
    assert.equal(bars[0]?.fullLabel, 'Sep 2025');
  });
});
