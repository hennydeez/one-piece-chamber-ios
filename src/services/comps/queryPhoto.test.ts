import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CollectionCard } from '../../models/card';
import type { CompQuery } from '../../models/comps';
import { cardMatchesCompQuery, resolveQueryPhotoUri } from './queryPhoto';

const query: CompQuery = {
  cardCode: 'OP01-001',
  printNote: null,
  language: 'EN',
  type: 'PSA',
  grade: '10',
};

function card(partial: Partial<CollectionCard> & Pick<CollectionCard, 'id'>): CollectionCard {
  return {
    cardCode: 'OP01-001',
    type: 'PSA',
    grade: '10',
    certNumber: null,
    printNote: null,
    language: 'EN',
    purchaseDate: null,
    purchasePriceAud: null,
    notes: null,
    photoUri: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('cardMatchesCompQuery', () => {
  it('matches Scout identity keys', () => {
    assert.equal(cardMatchesCompQuery(card({ id: 'a' }), query), true);
    assert.equal(cardMatchesCompQuery(card({ id: 'a', type: 'Raw', grade: null }), query), false);
    assert.equal(cardMatchesCompQuery(card({ id: 'a', cardCode: 'OP01-002' }), query), false);
  });
});

describe('resolveQueryPhotoUri', () => {
  it('prefers the selected matching card photo', () => {
    const selected = card({ id: 'sel', photoUri: 'file:///selected.jpg' });
    const other = card({ id: 'other', photoUri: 'file:///other.jpg' });
    assert.equal(
      resolveQueryPhotoUri(query, {
        selectedCard: selected,
        cards: [other, selected],
        draftPhotoUri: 'file:///draft.jpg',
      }),
      'file:///selected.jpg',
    );
  });

  it('falls back to a matching collection photo', () => {
    const match = card({ id: 'm', photoUri: 'file:///match.jpg' });
    assert.equal(
      resolveQueryPhotoUri(query, {
        selectedCard: card({ id: 'wrong', cardCode: 'OP02-001', photoUri: 'file:///no.jpg' }),
        cards: [match],
        draftPhotoUri: 'file:///draft.jpg',
      }),
      'file:///match.jpg',
    );
  });

  it('uses a draft photo when no collection photo matches', () => {
    assert.equal(
      resolveQueryPhotoUri(query, {
        cards: [card({ id: 'raw', type: 'Raw', grade: null, photoUri: 'file:///raw.jpg' })],
        draftPhotoUri: 'file:///draft.jpg',
      }),
      'file:///draft.jpg',
    );
  });

  it('returns null when nothing has a photo — still no invented solds', () => {
    assert.equal(resolveQueryPhotoUri(query, { cards: [card({ id: 'bare' })] }), null);
  });
});
