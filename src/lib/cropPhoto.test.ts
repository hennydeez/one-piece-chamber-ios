import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cropCameraPhoto, cropLibraryPhoto, cropPhotoIfPossible, type CropRuntime } from './cropPhoto';

function runtime(overrides: Partial<CropRuntime> = {}): CropRuntime {
  return {
    hasNativeModule: () => false,
    loadManipulator: async () => {
      throw new Error('should not load expo-image-manipulator');
    },
    getSize: async () => null,
    ...overrides,
  };
}

describe('cropPhotoIfPossible', () => {
  const crop = { originX: 10, originY: 20, width: 100, height: 140 };

  it('keeps the source URI when ExpoImageManipulator is missing', async () => {
    let loaded = false;
    const uri = await cropPhotoIfPossible(
      'file:///cache/snap.jpg',
      crop,
      runtime({
        loadManipulator: async () => {
          loaded = true;
          throw new Error("Cannot find native module 'ExpoImageManipulator'");
        },
      }),
    );
    assert.equal(uri, 'file:///cache/snap.jpg');
    assert.equal(loaded, false);
  });

  it('returns the cropped URI when manipulateAsync is present', async () => {
    const uri = await cropPhotoIfPossible(
      'file:///cache/snap.jpg',
      crop,
      runtime({
        hasNativeModule: () => true,
        loadManipulator: async () => ({
          manipulateAsync: async (source, actions) => {
            assert.equal(source, 'file:///cache/snap.jpg');
            assert.deepEqual(actions, [{ crop }]);
            return { uri: 'file:///cache/crop.jpg' };
          },
        }),
      }),
    );
    assert.equal(uri, 'file:///cache/crop.jpg');
  });

  it('uses the object API when manipulateAsync is absent', async () => {
    const uri = await cropPhotoIfPossible(
      'file:///cache/snap.jpg',
      crop,
      runtime({
        hasNativeModule: () => true,
        loadManipulator: async () => ({
          ImageManipulator: {
            manipulate: () => ({
              crop: () => ({
                renderAsync: async () => ({
                  saveAsync: async () => ({ uri: 'file:///cache/object-crop.jpg' }),
                }),
              }),
            }),
          },
        }),
      }),
    );
    assert.equal(uri, 'file:///cache/object-crop.jpg');
  });

  it('falls back to the source URI if native crop throws', async () => {
    const uri = await cropPhotoIfPossible(
      'file:///cache/snap.jpg',
      crop,
      runtime({
        hasNativeModule: () => true,
        loadManipulator: async () => ({
          manipulateAsync: async () => {
            throw new Error("Cannot find native module 'ExpoImageManipulator'");
          },
        }),
      }),
    );
    assert.equal(uri, 'file:///cache/snap.jpg');
  });

  it('returns an empty source unchanged', async () => {
    assert.equal(await cropPhotoIfPossible('', crop, runtime()), '');
  });
});

describe('cropCameraPhoto', () => {
  it('maps the viewfinder onto the photo when the manipulator is present', async () => {
    const uri = await cropCameraPhoto(
      {
        uri: 'file:///cache/snap.jpg',
        kind: 'raw',
        imageWidth: 3024,
        imageHeight: 4032,
        preview: { width: 390, height: 700 },
      },
      runtime({
        hasNativeModule: () => true,
        loadManipulator: async () => ({
          manipulateAsync: async (_source, actions) => {
            const next = actions[0]?.crop;
            assert.ok(next);
            assert.ok(next.originX >= 0);
            assert.ok(next.width < 3024);
            return { uri: 'file:///cache/framed.jpg' };
          },
        }),
      }),
    );
    assert.equal(uri, 'file:///cache/framed.jpg');
  });

  it('keeps the full snap when native crop is missing', async () => {
    const uri = await cropCameraPhoto(
      {
        uri: 'file:///cache/snap.jpg',
        kind: 'raw',
        imageWidth: 3024,
        imageHeight: 4032,
        preview: { width: 390, height: 700 },
      },
      runtime(),
    );
    assert.equal(uri, 'file:///cache/snap.jpg');
  });
});

describe('cropLibraryPhoto', () => {
  it('crops a 4:3 pick to the card frame when the manipulator is present', async () => {
    const uri = await cropLibraryPhoto(
      {
        uri: 'file:///library/card.jpg',
        kind: 'raw',
        imageWidth: 4000,
        imageHeight: 3000,
      },
      runtime({
        hasNativeModule: () => true,
        loadManipulator: async () => ({
          manipulateAsync: async () => ({ uri: 'file:///library/cropped.jpg' }),
        }),
      }),
    );
    assert.equal(uri, 'file:///library/cropped.jpg');
  });

  it('reads size from the runtime when the picker omitted it', async () => {
    let sized = false;
    const uri = await cropLibraryPhoto(
      { uri: 'file:///library/card.jpg', kind: 'slab' },
      runtime({
        getSize: async () => {
          sized = true;
          return { width: 4000, height: 3000 };
        },
        hasNativeModule: () => true,
        loadManipulator: async () => ({
          manipulateAsync: async () => ({ uri: 'file:///library/sized.jpg' }),
        }),
      }),
    );
    assert.equal(sized, true);
    assert.equal(uri, 'file:///library/sized.jpg');
  });

  it('keeps the full pick when size cannot be resolved', async () => {
    const uri = await cropLibraryPhoto(
      { uri: 'file:///library/card.jpg', kind: 'raw' },
      runtime({
        hasNativeModule: () => true,
        loadManipulator: async () => ({
          manipulateAsync: async () => ({ uri: 'file:///library/should-not.jpg' }),
        }),
      }),
    );
    assert.equal(uri, 'file:///library/card.jpg');
  });
});
