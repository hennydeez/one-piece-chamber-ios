import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CompQuery, CompSold } from '../../models/comps';
import { matchesScoutRules } from './scoutMatch';

const baseQuery: CompQuery = {
  cardCode: 'OP01-001',
  printNote: 'Manga',
  language: 'EN',
  type: 'PSA',
  grade: '10',
};

const baseSold: CompSold = {
  id: '1',
  cardCode: 'OP01-001',
  printNote: 'Manga',
  language: 'EN',
  type: 'PSA',
  grade: '10',
  soldAt: '2026-01-01',
  channel: 'fixed',
  completed: true,
  priceOriginal: 100,
  currencyOriginal: 'AUD',
  priceAud: 100,
  fxRateToAud: null,
  fxStampedAt: null,
  source: 'fixture',
};

describe('Scout match', () => {
  it('matches code ∧ print ∧ language ∧ grade ∧ type', () => {
    assert.equal(matchesScoutRules(baseSold, baseQuery), true);
  });

  it('rejects raw vs slab', () => {
    assert.equal(matchesScoutRules({ ...baseSold, type: 'Raw', grade: null }, baseQuery), false);
    assert.equal(
      matchesScoutRules(baseSold, { ...baseQuery, type: 'Raw', grade: null }),
      false,
    );
  });

  it('rejects mismatched print, language, grade, or code', () => {
    assert.equal(matchesScoutRules({ ...baseSold, printNote: null }, baseQuery), false);
    assert.equal(matchesScoutRules({ ...baseSold, language: 'JP' }, baseQuery), false);
    assert.equal(matchesScoutRules({ ...baseSold, grade: '9' }, baseQuery), false);
    assert.equal(matchesScoutRules({ ...baseSold, cardCode: 'OP01-002' }, baseQuery), false);
  });

  it('treats blank print notes as equal', () => {
    assert.equal(
      matchesScoutRules({ ...baseSold, printNote: '  ' }, { ...baseQuery, printNote: null }),
      true,
    );
  });

  it('is case-insensitive on code and language', () => {
    assert.equal(
      matchesScoutRules({ ...baseSold, cardCode: 'op01-001', language: 'en' }, baseQuery),
      true,
    );
  });
});
