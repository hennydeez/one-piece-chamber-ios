import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isNoiseTitle, withoutNoiseTitles } from './noiseTitle';

describe('isNoiseTitle', () => {
  it('keeps missing or blank titles — never invents one', () => {
    assert.equal(isNoiseTitle(undefined), false);
    assert.equal(isNoiseTitle(null), false);
    assert.equal(isNoiseTitle(''), false);
    assert.equal(isNoiseTitle('   '), false);
  });

  it('flags playset, x4, lot of, and bundle case-insensitively', () => {
    assert.equal(isNoiseTitle('OP01-001 Luffy PLAYSET'), true);
    assert.equal(isNoiseTitle('Playset of 4'), true);
    assert.equal(isNoiseTitle('x4 OP01-001'), true);
    assert.equal(isNoiseTitle('OP01-001 X4 PSA 10'), true);
    assert.equal(isNoiseTitle('Lot of 3 Luffy'), true);
    assert.equal(isNoiseTitle('LOT OF singles'), true);
    assert.equal(isNoiseTitle('Luffy bundle'), true);
    assert.equal(isNoiseTitle('BUNDLE — mixed'), true);
  });

  it('does not treat a normal listing title as noise', () => {
    assert.equal(isNoiseTitle('OP01-001 Monkey D. Luffy PSA 10'), false);
    assert.equal(isNoiseTitle('Romance Dawn Leader EN'), false);
    assert.equal(isNoiseTitle('OP01-014 Nami'), false);
  });

  it('does not treat EX4 as x4', () => {
    assert.equal(isNoiseTitle('OP01-001 EX4 promo'), false);
  });
});

describe('withoutNoiseTitles', () => {
  it('drops noise titles and keeps untitled + clean rows', () => {
    const kept = withoutNoiseTitles([
      { id: 'clean', title: 'OP01-001 Luffy PSA 10' },
      { id: 'playset', title: 'playset x4' },
      { id: 'blank', title: '  ' },
      { id: 'missing' },
      { id: 'lot', title: 'Lot of 4' },
      { id: 'bundle', title: 'Sealed bundle' },
    ]);
    assert.deepEqual(
      kept.map((row) => row.id),
      ['clean', 'blank', 'missing'],
    );
    assert.equal(kept.find((row) => row.id === 'missing')?.title, undefined);
  });
});
