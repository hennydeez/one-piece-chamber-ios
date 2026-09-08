import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyDraft } from '../../models/card';
import { applyOcrPrefill } from './applyOcrPrefill';
import { emptyPrefill } from './parseCardText';
import { createOcrService, OCR_UNAVAILABLE_EXPO_GO, type OcrRuntime } from './ocrService';

const slabText = 'OP01-001 Monkey D. Luffy PSA 10 Cert 81234567 English';

function runtime(overrides: Partial<OcrRuntime> = {}): OcrRuntime {
  return {
    hasNativeModule: () => true,
    isExpoGo: () => false,
    loadExtractor: async () => ({
      isSupported: true,
      extractTextFromImage: async () => [slabText],
    }),
    ...overrides,
  };
}

describe('applyOcrPrefill', () => {
  it('autofills empty Add Card fields from OCR', () => {
    const next = applyOcrPrefill(emptyDraft(), {
      cardCode: 'OP01-001',
      type: 'PSA',
      grade: '10',
      certNumber: '81234567',
      printNote: 'Alternate Art',
      language: 'EN',
    });

    assert.equal(next.cardCode, 'OP01-001');
    assert.equal(next.type, 'PSA');
    assert.equal(next.grade, '10');
    assert.equal(next.certNumber, '81234567');
    assert.equal(next.printNote, 'Alternate Art');
  });

  it('does not wipe values the user already typed', () => {
    const draft = {
      ...emptyDraft(),
      cardCode: 'ST01-012',
      type: 'BGS' as const,
      grade: '9.5',
      certNumber: '111',
      printNote: 'Manga',
      language: 'JP',
    };

    const next = applyOcrPrefill(draft, {
      cardCode: 'OP01-001',
      type: 'PSA',
      grade: '10',
      certNumber: '81234567',
      printNote: 'Alternate Art',
      language: 'EN',
    });

    assert.equal(next.cardCode, 'ST01-012');
    assert.equal(next.type, 'BGS');
    assert.equal(next.grade, '9.5');
    assert.equal(next.certNumber, '111');
    assert.equal(next.printNote, 'Manga');
    assert.equal(next.language, 'JP');
  });

  it('leaves the form manual when OCR returned empty fields', () => {
    const next = applyOcrPrefill({ ...emptyDraft(), photoUri: 'file:///card.jpg' }, emptyPrefill());
    assert.equal(next.cardCode, '');
    assert.equal(next.type, 'Raw');
    assert.equal(next.grade, '');
    assert.equal(next.certNumber, '');
    assert.equal(next.photoUri, 'file:///card.jpg');
  });
});

describe('Add Card ingest (recognize + apply)', () => {
  it('autofills parsed fields when the native module is present', async () => {
    const attempt = await createOcrService(runtime()).recognize('file:///card.jpg');
    const next = applyOcrPrefill({ ...emptyDraft(), photoUri: 'file:///card.jpg' }, attempt.fields);

    assert.equal(attempt.status, 'ok');
    assert.equal(next.cardCode, 'OP01-001');
    assert.equal(next.type, 'PSA');
    assert.equal(next.grade, '10');
    assert.equal(next.certNumber, '81234567');
    assert.equal(next.photoUri, 'file:///card.jpg');
    assert.match(attempt.message, /Check these fields/);
  });

  it('keeps empty manual fields after an Expo Go miss', async () => {
    const attempt = await createOcrService(
      runtime({
        isExpoGo: () => true,
        loadExtractor: async () => {
          throw new Error("Cannot find native module 'ExpoTextExtractor'");
        },
      }),
    ).recognize('file:///card.jpg');
    const next = applyOcrPrefill({ ...emptyDraft(), photoUri: 'file:///card.jpg' }, attempt.fields);

    assert.equal(attempt.status, 'unsupported');
    assert.equal(attempt.message, OCR_UNAVAILABLE_EXPO_GO);
    assert.equal(next.cardCode, '');
    assert.equal(next.type, 'Raw');
    assert.equal(next.grade, '');
    assert.equal(next.certNumber, '');
    assert.equal(next.photoUri, 'file:///card.jpg');
  });
});
