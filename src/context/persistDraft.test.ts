import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyDraft, type CollectionCard } from '../models/card';
import { persistValidatedDraft } from './persistDraft';

function draft(overrides: Partial<ReturnType<typeof emptyDraft>> = {}) {
  return { ...emptyDraft(), cardCode: 'OP01-001', ...overrides };
}

describe('persistValidatedDraft', () => {
  it('upserts the card before any photo work', async () => {
    const order: string[] = [];
    const card = await persistValidatedDraft(draft({ photoUri: 'file:///cache/snap.jpg' }), undefined, {
      persistPhoto: async (uri) => {
        order.push(`photo:${uri}`);
        return 'file:///documents/cards/copied.jpg';
      },
      upsert: async (row) => {
        order.push(`upsert:${row.photoUri}`);
      },
    });
    assert.deepEqual(order, [
      'upsert:file:///cache/snap.jpg',
      'photo:file:///cache/snap.jpg',
      'upsert:file:///documents/cards/copied.jpg',
    ]);
    assert.equal(card.photoUri, 'file:///documents/cards/copied.jpg');
    assert.equal(card.cardCode, 'OP01-001');
  });

  it('keeps the already-saved row if photo persist throws', async () => {
    const upserts: Array<string | null> = [];
    const card = await persistValidatedDraft(draft({ photoUri: 'file:///cache/snap.jpg' }), undefined, {
      persistPhoto: async () => {
        throw new Error("Cannot find native module 'ExpoAsset'");
      },
      upsert: async (row) => {
        upserts.push(row.photoUri);
      },
    });
    assert.deepEqual(upserts, ['file:///cache/snap.jpg']);
    assert.equal(card.photoUri, 'file:///cache/snap.jpg');
    assert.equal(card.cardCode, 'OP01-001');
  });

  it('does not copy when there is no photo and still persists the card', async () => {
    let photoCalls = 0;
    const saved: CollectionCard[] = [];
    const card = await persistValidatedDraft(draft(), undefined, {
      persistPhoto: async (uri) => {
        photoCalls += 1;
        return uri;
      },
      upsert: async (row) => {
        saved.push(row);
      },
    });
    assert.equal(photoCalls, 0);
    assert.equal(saved.length, 1);
    assert.equal(card.photoUri, null);
  });

  it('rejects an invalid draft before upsert', async () => {
    let upserts = 0;
    await assert.rejects(
      () =>
        persistValidatedDraft(emptyDraft(), undefined, {
          persistPhoto: async (uri) => uri,
          upsert: async () => {
            upserts += 1;
          },
        }),
      /Card code is required/,
    );
    assert.equal(upserts, 0);
  });
});
