import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filterNumericGrade, validateGrade } from './grade';

describe('filterNumericGrade', () => {
  it('strips letters', () => {
    assert.equal(filterNumericGrade('GEM10', 'PSA'), '10');
    assert.equal(filterNumericGrade('9.5 NM', 'BGS'), '9.5');
  });

  it('blocks decimals for PSA', () => {
    assert.equal(filterNumericGrade('9.5', 'PSA'), '9');
  });

  it('allows one decimal for BGS and TAG', () => {
    assert.equal(filterNumericGrade('9.5', 'BGS'), '9.5');
    assert.equal(filterNumericGrade('10', 'TAG'), '10');
  });
});

describe('validateGrade', () => {
  it('allows empty and raw', () => {
    assert.equal(validateGrade('', 'PSA'), null);
    assert.equal(validateGrade('NM', 'Raw'), null);
  });

  it('requires PSA integers', () => {
    assert.equal(validateGrade('10', 'PSA'), null);
    assert.match(validateGrade('9.5', 'PSA') ?? '', /whole numbers/);
  });

  it('allows BGS decimals', () => {
    assert.equal(validateGrade('9.5', 'BGS'), null);
    assert.match(validateGrade('9.55', 'BGS') ?? '', /numbers/);
  });

  it('allows TAG integer or one decimal', () => {
    assert.equal(validateGrade('10', 'TAG'), null);
    assert.equal(validateGrade('9.5', 'TAG'), null);
  });
});
