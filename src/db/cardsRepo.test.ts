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

  it('rejects a purchase date that is not dd-mm-yyyy', () => {
    const iso = { ...emptyDraft(), cardCode: 'OP01-001', purchaseDate: '2026-09-15' };
    const slashes = { ...emptyDraft(), cardCode: 'OP01-001', purchaseDate: '15/09/2026' };
    const impossible = { ...emptyDraft(), cardCode: 'OP01-001', purchaseDate: '31-02-2026' };
    assert.equal(validateDraft(iso), 'Use dd-mm-yyyy.');
    assert.equal(validateDraft(slashes), 'Use dd-mm-yyyy.');
    assert.equal(validateDraft(impossible), 'Use dd-mm-yyyy.');
  });

  it('accepts blank or valid AU purchase dates', () => {
    assert.equal(validateDraft({ ...emptyDraft(), cardCode: 'OP01-001' }), null);
    assert.equal(
      validateDraft({ ...emptyDraft(), cardCode: 'OP01-001', purchaseDate: '15-09-2026' }),
      null,
    );
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

  it('keeps an existing card id when editing', () => {
    const existing = draftToPersistable({
      ...emptyDraft(),
      cardCode: 'OP01-001',
    });
    const updated = draftToPersistable(
      {
        ...emptyDraft(),
        cardCode: 'OP01-024',
        notes: 'edited',
      },
      existing,
    );
    assert.equal(updated.id, existing.id);
    assert.equal(updated.cardCode, 'OP01-024');
    assert.equal(updated.notes, 'edited');
    assert.equal(updated.createdAt, existing.createdAt);
  });

  it('stores purchase date as ISO YYYY-MM-DD', () => {
    const card = draftToPersistable({
      ...emptyDraft(),
      cardCode: 'OP01-001',
      purchaseDate: '15-09-2026',
    });
    assert.equal(card.purchaseDate, '2026-09-15');
  });
});
