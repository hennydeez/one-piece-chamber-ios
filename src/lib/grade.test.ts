import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BGS_GRADE_CHIPS,
  PSA_GRADE_CHIPS,
  TAG_GRADE_CHIPS,
  filterNumericGrade,
  gradeChipOptions,
  gradeFieldHint,
  snapGradeToChips,
  validateGrade,
} from './grade';

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

describe('gradeFieldHint', () => {
  it('stays short', () => {
    assert.equal(gradeFieldHint('TAG'), 'Numbers only.');
    assert.equal(gradeFieldHint('PSA'), 'Numbers only.');
    assert.equal(gradeFieldHint('BGS'), 'Numbers only.');
    assert.equal(gradeFieldHint('PSA', { optional: true }), 'Numbers only. Optional.');
  });
});

describe('gradeChipOptions', () => {
  it('uses 1–10 integers for PSA and TAG', () => {
    assert.deepEqual([...gradeChipOptions('PSA')], [...PSA_GRADE_CHIPS]);
    assert.deepEqual([...gradeChipOptions('TAG')], [...TAG_GRADE_CHIPS]);
    assert.deepEqual([...PSA_GRADE_CHIPS], ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    assert.deepEqual([...TAG_GRADE_CHIPS], ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  });

  it('uses BGS half-point chips from 7', () => {
    assert.deepEqual([...gradeChipOptions('BGS')], [...BGS_GRADE_CHIPS]);
    assert.deepEqual([...BGS_GRADE_CHIPS], ['7', '7.5', '8', '8.5', '9', '9.5', '10']);
  });

  it('hides Raw', () => {
    assert.deepEqual([...gradeChipOptions('Raw')], []);
  });
});

describe('snapGradeToChips', () => {
  it('keeps a chip value and clears the rest', () => {
    assert.equal(snapGradeToChips('10', 'PSA'), '10');
    assert.equal(snapGradeToChips('9.5', 'BGS'), '9.5');
    assert.equal(snapGradeToChips('9.5', 'PSA'), '9');
    assert.equal(snapGradeToChips('6', 'BGS'), '');
    assert.equal(snapGradeToChips('9.5', 'TAG'), '');
    assert.equal(snapGradeToChips('10', 'Raw'), '');
  });
});
