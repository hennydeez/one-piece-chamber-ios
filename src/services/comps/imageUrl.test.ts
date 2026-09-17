import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { firstSoldImageUrl, imageUrlFromPayload, readImageUrl } from './imageUrl';

describe('readImageUrl', () => {
  it('keeps http(s) and file URLs', () => {
    assert.equal(readImageUrl(' https://cdn.example/op01-001.jpg '), 'https://cdn.example/op01-001.jpg');
    assert.equal(readImageUrl('file:///cards/op01-001.jpg'), 'file:///cards/op01-001.jpg');
  });

  it('rejects blanks and invented-looking values', () => {
    assert.equal(readImageUrl(''), null);
    assert.equal(readImageUrl('   '), null);
    assert.equal(readImageUrl('OP01-001'), null);
    assert.equal(readImageUrl(null), null);
  });
});

describe('imageUrlFromPayload', () => {
  it('reads a top-level imageUrl when solds are empty', () => {
    assert.equal(
      imageUrlFromPayload({ solds: [], imageUrl: 'https://cdn.example/card.jpg' }),
      'https://cdn.example/card.jpg',
    );
  });

  it('reads image_url / cardImageUrl aliases', () => {
    assert.equal(
      imageUrlFromPayload({ solds: [], image_url: 'https://cdn.example/alt.jpg' }),
      'https://cdn.example/alt.jpg',
    );
    assert.equal(
      imageUrlFromPayload({ solds: [], cardImageUrl: 'https://cdn.example/card-image.jpg' }),
      'https://cdn.example/card-image.jpg',
    );
  });

  it('reads an image on a row that is not a valid sold', () => {
    assert.equal(
      imageUrlFromPayload([{ id: 'bare', imageUrl: 'https://cdn.example/from-row.jpg' }]),
      'https://cdn.example/from-row.jpg',
    );
  });

  it('returns null when no URL exists — does not invent one', () => {
    assert.equal(imageUrlFromPayload({ solds: [] }), null);
    assert.equal(imageUrlFromPayload([]), null);
    assert.equal(firstSoldImageUrl([]), null);
  });
});
