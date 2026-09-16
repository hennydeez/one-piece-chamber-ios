import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  RAW_CARD_MM,
  SLAB_CARD_MM,
  cropForCameraSnap,
  cropForLibraryPick,
  frameAspect,
  frameKindFromCardType,
  inscribedCenteredCrop,
  isNearlyFullImage,
  mapCoverFrameToImage,
  parseFrameKind,
  toPixelCrop,
  viewfinderRect,
} from './cardFrame';

describe('frame kind', () => {
  it('maps collection types to raw vs slab', () => {
    assert.equal(frameKindFromCardType('Raw'), 'raw');
    assert.equal(frameKindFromCardType('PSA'), 'slab');
    assert.equal(frameKindFromCardType('BGS'), 'slab');
    assert.equal(frameKindFromCardType('TAG'), 'slab');
  });

  it('treats unknown route params as raw', () => {
    assert.equal(parseFrameKind('slab'), 'slab');
    assert.equal(parseFrameKind('raw'), 'raw');
    assert.equal(parseFrameKind(undefined), 'raw');
    assert.equal(parseFrameKind('PSA'), 'raw');
  });

  it('uses TCG and slab millimetre ratios', () => {
    assert.equal(frameAspect('raw'), RAW_CARD_MM.width / RAW_CARD_MM.height);
    assert.equal(frameAspect('slab'), SLAB_CARD_MM.width / SLAB_CARD_MM.height);
    assert.ok(frameAspect('slab') < frameAspect('raw'));
  });
});

describe('viewfinderRect', () => {
  it('returns a centered raw hole inset from a portrait preview', () => {
    const preview = { width: 390, height: 700 };
    const frame = viewfinderRect(preview, 'raw');
    assert.ok(frame);
    assert.ok(frame.x > 10);
    assert.ok(frame.y > 10);
    assert.ok(frame.x + frame.width < preview.width - 10);
    assert.ok(frame.y + frame.height < preview.height - 10);
    assert.ok(Math.abs(frame.width / frame.height - frameAspect('raw')) < 1e-6);
    assert.ok(Math.abs(frame.x - (preview.width - frame.width) / 2) < 1e-6);
  });

  it('makes the slab hole taller than raw when both fit the same width', () => {
    const preview = { width: 390, height: 700 };
    const raw = viewfinderRect(preview, 'raw');
    const slab = viewfinderRect(preview, 'slab');
    assert.ok(raw && slab);
    assert.ok(Math.abs(slab.width - raw.width) < 1e-6);
    assert.ok(slab.height > raw.height);
    assert.ok(slab.width / slab.height < raw.width / raw.height);
  });

  it('makes the slab hole narrower than raw when both fill the preview height', () => {
    const preview = { width: 700, height: 400 };
    const raw = viewfinderRect(preview, 'raw');
    const slab = viewfinderRect(preview, 'slab');
    assert.ok(raw && slab);
    assert.ok(Math.abs(slab.height - raw.height) < 1e-6);
    assert.ok(slab.width < raw.width);
  });

  it('returns null for unusable preview sizes', () => {
    assert.equal(viewfinderRect({ width: 0, height: 400 }, 'raw'), null);
    assert.equal(viewfinderRect({ width: 200, height: -1 }, 'slab'), null);
  });
});

describe('mapCoverFrameToImage', () => {
  it('maps 1:1 when preview and photo match', () => {
    const preview = { width: 400, height: 600 };
    const image = { width: 400, height: 600 };
    const frame = { x: 40, y: 60, width: 320, height: 480 };
    const mapped = mapCoverFrameToImage({ preview, image, frame });
    assert.deepEqual(mapped, frame);
  });

  it('accounts for a wider photo cover-fitted into a tall preview', () => {
    const preview = { width: 390, height: 700 };
    const image = { width: 4032, height: 3024 };
    const frame = viewfinderRect(preview, 'raw');
    assert.ok(frame);
    const mapped = mapCoverFrameToImage({ preview, image, frame });
    assert.ok(mapped);
    const scale = preview.height / image.height;
    assert.ok(Math.abs(mapped.height - frame.height / scale) < 1e-6);
    assert.ok(mapped.x > 0);
    assert.ok(mapped.x + mapped.width < image.width);
    assert.ok(mapped.y >= -1);
  });

  it('returns null when preview or image is empty', () => {
    const frame = { x: 0, y: 0, width: 10, height: 10 };
    assert.equal(
      mapCoverFrameToImage({
        preview: { width: 0, height: 100 },
        image: { width: 100, height: 100 },
        frame,
      }),
      null,
    );
  });
});

describe('inscribedCenteredCrop', () => {
  it('letterboxes a 3:4 photo to the raw card ratio', () => {
    const image = { width: 3000, height: 4000 };
    const rect = inscribedCenteredCrop(image, 'raw');
    assert.ok(rect);
    assert.ok(Math.abs(rect.width / rect.height - frameAspect('raw')) < 1e-6);
    assert.equal(rect.height, 4000);
    assert.ok(rect.width < 3000);
    assert.ok(Math.abs(rect.x - (3000 - rect.width) / 2) < 1e-6);
    assert.equal(rect.y, 0);
  });

  it('pillar-boxes a wide photo', () => {
    const image = { width: 4000, height: 2000 };
    const rect = inscribedCenteredCrop(image, 'raw');
    assert.ok(rect);
    assert.equal(rect.height, 2000);
    assert.ok(rect.width < 4000);
  });
});

describe('toPixelCrop', () => {
  it('rounds and clamps to the image', () => {
    const crop = toPixelCrop(
      { x: -4.2, y: 10.6, width: 5000, height: 20.2 },
      { width: 100, height: 80 },
    );
    assert.deepEqual(crop, { originX: 0, originY: 11, width: 100, height: 20 });
  });

  it('rejects a crop smaller than the minimum edge', () => {
    assert.equal(toPixelCrop({ x: 0, y: 0, width: 4, height: 40 }, { width: 100, height: 80 }), null);
  });
});

describe('crop helpers', () => {
  it('builds a camera crop from preview + kind', () => {
    const crop = cropForCameraSnap({
      preview: { width: 390, height: 700 },
      image: { width: 3024, height: 4032 },
      kind: 'raw',
    });
    assert.ok(crop);
    assert.ok(crop.originX >= 0);
    assert.ok(crop.originY >= 0);
    assert.ok(crop.originX + crop.width <= 3024);
    assert.ok(crop.originY + crop.height <= 4032);
    assert.ok(crop.width < 3024);
  });

  it('skips a library crop that would keep the whole photo', () => {
    const image = { width: 630, height: 880 };
    assert.equal(cropForLibraryPick(image, 'raw'), null);
    assert.equal(isNearlyFullImage({ originX: 0, originY: 0, width: 630, height: 880 }, image), true);
  });

  it('crops a 4:3 library photo to the slab ratio', () => {
    const crop = cropForLibraryPick({ width: 4000, height: 3000 }, 'slab');
    assert.ok(crop);
    assert.ok(crop.width < 4000);
    assert.ok(crop.height <= 3000);
  });
});
