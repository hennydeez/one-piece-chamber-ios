import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { persistCardPhoto, type PhotoPersistRuntime } from './photos';

function runtime(overrides: Partial<PhotoPersistRuntime> = {}): PhotoPersistRuntime {
  return {
    getLegacyFileSystem: () => null,
    createDestName: () => 'img_test',
    ...overrides,
  };
}

describe('persistCardPhoto', () => {
  it('keeps the source URI when ExponentFileSystem is missing', async () => {
    const uri = await persistCardPhoto('file:///cache/snap.jpg', runtime());
    assert.equal(uri, 'file:///cache/snap.jpg');
  });

  it('keeps the source URI when documentDirectory is null', async () => {
    let copied = false;
    const uri = await persistCardPhoto(
      'file:///cache/snap.jpg',
      runtime({
        getLegacyFileSystem: () => ({
          documentDirectory: null,
          makeDirectoryAsync: async () => undefined,
          copyAsync: async () => {
            copied = true;
          },
        }),
      }),
    );
    assert.equal(uri, 'file:///cache/snap.jpg');
    assert.equal(copied, false);
  });

  it('keeps the source URI when copy methods are missing', async () => {
    const uri = await persistCardPhoto(
      'file:///cache/snap.jpg',
      runtime({
        getLegacyFileSystem: () => ({
          documentDirectory: 'file:///documents/',
        }),
      }),
    );
    assert.equal(uri, 'file:///cache/snap.jpg');
  });

  it('copies into documentDirectory/cards when the native module is present', async () => {
    const calls: string[] = [];
    const uri = await persistCardPhoto(
      'file:///cache/snap.jpg',
      runtime({
        getLegacyFileSystem: () => ({
          documentDirectory: 'file:///documents/',
          makeDirectoryAsync: async (dir) => {
            calls.push(`mkdir:${dir}`);
          },
          copyAsync: async ({ from, to }) => {
            calls.push(`copy:${from}->${to}`);
          },
        }),
      }),
    );
    assert.equal(uri, 'file:///documents/cards/img_test.jpg');
    assert.deepEqual(calls, [
      'mkdir:file:///documents/cards/',
      'copy:file:///cache/snap.jpg->file:///documents/cards/img_test.jpg',
    ]);
  });

  it('falls back to the source URI if native copy throws', async () => {
    const uri = await persistCardPhoto(
      'file:///cache/snap.jpg',
      runtime({
        getLegacyFileSystem: () => ({
          documentDirectory: 'file:///documents/',
          makeDirectoryAsync: async () => undefined,
          copyAsync: async () => {
            throw new Error("Cannot find native module 'ExpoAsset'");
          },
        }),
      }),
    );
    assert.equal(uri, 'file:///cache/snap.jpg');
  });

  it('returns an empty source unchanged', async () => {
    assert.equal(await persistCardPhoto('', runtime()), '');
  });
});
