import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyDraft } from '../models/card';
import { draftToPersistable, validateDraft } from './cardsRepo';

describe('cardsRepo helpers', () => {
  it('requires a card code', () => {
    assert.equal(validateDraft(emptyDraft()), 'Card code is required.');
  });

  it('rejects a letter grade on a PSA slab', () => {
    const draft = { ...emptyDraft(), cardCode: 'OP01-001', type: 'PSA' as const, grade: 'GEM' };
    assert.equal(validateDraft(draft), 'PSA grades are whole numbers.');
  });

  it('rejects a non-numeric price', () => {
    const draft = { ...emptyDraft(), cardCode: 'OP01-001', purchasePriceAud: 'abc' };
    assert.equal(validateDraft(draft), 'Purchase price must be a valid AUD amount.');
  });

  it('normalizes code, language, and blank print', () => {
    const card = draftToPersistable({
      ...emptyDraft(),
      cardCode: 'op01-001',
      language: 'en',
      printNote: '  ',
      purchasePriceAud: '125.499',
    });
    assert.equal(card.cardCode, 'OP01-001');
    assert.equal(card.language, 'EN');
    assert.equal(card.printNote, null);
    assert.equal(card.purchasePriceAud, 125.5);
    assert.equal(card.type, 'Raw');
  });
});
