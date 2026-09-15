import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatDisplayDate,
  formatIsoToAuDate,
  formatPurchaseDate,
  isAuDate,
  isIsoDate,
  parseAuDateToIso,
  toAuPurchaseDateInput,
  todayAuDate,
  todayIsoDate,
} from './dates';

describe('parseAuDateToIso', () => {
  it('parses padded dd-mm-yyyy to ISO', () => {
    assert.equal(parseAuDateToIso('15-09-2026'), '2026-09-15');
    assert.equal(parseAuDateToIso(' 01-01-2020 '), '2020-01-01');
  });

  it('rejects wrong shapes', () => {
    assert.equal(parseAuDateToIso('2026-09-15'), null);
    assert.equal(parseAuDateToIso('15/09/2026'), null);
    assert.equal(parseAuDateToIso('15-9-2026'), null);
    assert.equal(parseAuDateToIso('15-09-26'), null);
    assert.equal(parseAuDateToIso(''), null);
  });

  it('rejects impossible calendar days', () => {
    assert.equal(parseAuDateToIso('32-01-2026'), null);
    assert.equal(parseAuDateToIso('29-02-2025'), null);
    assert.equal(parseAuDateToIso('31-04-2026'), null);
    assert.equal(parseAuDateToIso('00-01-2026'), null);
    assert.equal(parseAuDateToIso('15-13-2026'), null);
  });

  it('accepts a leap day', () => {
    assert.equal(parseAuDateToIso('29-02-2024'), '2024-02-29');
  });
});

describe('formatIsoToAuDate', () => {
  it('formats ISO to dd-mm-yyyy', () => {
    assert.equal(formatIsoToAuDate('2026-09-15'), '15-09-2026');
    assert.equal(formatIsoToAuDate('2020-01-01'), '01-01-2020');
  });

  it('rejects AU and junk', () => {
    assert.equal(formatIsoToAuDate('15-09-2026'), null);
    assert.equal(formatIsoToAuDate('2026-13-01'), null);
    assert.equal(formatIsoToAuDate('not-a-date'), null);
  });
});

describe('formatPurchaseDate / toAuPurchaseDateInput', () => {
  it('shows stored ISO as dd-mm-yyyy', () => {
    assert.equal(formatPurchaseDate('2026-09-15'), '15-09-2026');
    assert.equal(toAuPurchaseDateInput('2026-09-15'), '15-09-2026');
  });

  it('keeps already-AU input', () => {
    assert.equal(formatPurchaseDate('15-09-2026'), '15-09-2026');
    assert.equal(toAuPurchaseDateInput('15-09-2026'), '15-09-2026');
  });

  it('uses em dash / empty for blank or junk', () => {
    assert.equal(formatPurchaseDate(null), '—');
    assert.equal(formatPurchaseDate(''), '—');
    assert.equal(formatPurchaseDate('yesterday'), '—');
    assert.equal(toAuPurchaseDateInput(null), '');
    assert.equal(toAuPurchaseDateInput(''), '');
  });
});

describe('formatDisplayDate (comps soldAt — leave as-is)', () => {
  it('still uses short en-AU month, not dd-mm-yyyy', () => {
    const shown = formatDisplayDate('2026-08-01T00:00:00.000Z');
    assert.match(shown, /2026/);
    assert.doesNotMatch(shown, /^\d{2}-\d{2}-\d{4}$/);
    assert.equal(formatDisplayDate(null), '—');
  });
});

describe('today helpers', () => {
  it('todayIsoDate is local YYYY-MM-DD', () => {
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    assert.equal(todayIsoDate(), expected);
    assert.equal(isIsoDate(todayIsoDate()), true);
  });

  it('todayAuDate is local dd-mm-yyyy', () => {
    const d = new Date();
    const expected = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    assert.equal(todayAuDate(), expected);
    assert.equal(isAuDate(todayAuDate()), true);
    assert.equal(parseAuDateToIso(todayAuDate()), todayIsoDate());
  });
});
