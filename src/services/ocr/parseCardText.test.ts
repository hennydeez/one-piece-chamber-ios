import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseCardText } from './parseCardText';

describe('parseCardText', () => {
  it('extracts a PSA slab line', () => {
    const fields = parseCardText('OP01-001 Monkey D. Luffy PSA 10 Cert 81234567 English');
    assert.equal(fields.cardCode, 'OP01-001');
    assert.equal(fields.type, 'PSA');
    assert.equal(fields.grade, '10');
    assert.equal(fields.certNumber, '81234567');
    assert.equal(fields.language, 'EN');
  });

  it('normalizes spaced codes and BGS 9.5', () => {
    const fields = parseCardText('OP 09 - 118 BGS 9.5 Japanese Alternate Art');
    assert.equal(fields.cardCode, 'OP09-118');
    assert.equal(fields.type, 'BGS');
    assert.equal(fields.grade, '9.5');
    assert.equal(fields.language, 'JP');
    assert.equal(fields.printNote, 'Alternate Art');
  });

  it('detects TAG and starter codes', () => {
    const fields = parseCardText('ST01-012 TAG 10');
    assert.equal(fields.cardCode, 'ST01-012');
    assert.equal(fields.type, 'TAG');
    assert.equal(fields.grade, '10');
  });

  it('returns empty guesses for blank text', () => {
    const fields = parseCardText('   ');
    assert.equal(fields.cardCode, '');
    assert.equal(fields.type, null);
    assert.equal(fields.certNumber, '');
  });

  it('does not invent a card code', () => {
    const fields = parseCardText('Beautiful foil character card GEM MINT');
    assert.equal(fields.cardCode, '');
  });
});
