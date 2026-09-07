import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createOcrService,
  failedOcrAttempt,
  isMissingNativeModuleError,
  OCR_FAILED,
  OCR_UNAVAILABLE,
  OCR_UNAVAILABLE_EXPO_GO,
  unsupportedOcrAttempt,
  type OcrRuntime,
} from './ocrService';

function runtime(overrides: Partial<OcrRuntime> = {}): OcrRuntime {
  return {
    hasNativeModule: () => true,
    isExpoGo: () => false,
    loadExtractor: async () => ({
      isSupported: true,
      extractTextFromImage: async () => ['OP01-001 PSA 10 Cert 81234567 English'],
    }),
    ...overrides,
  };
}

describe('isMissingNativeModuleError', () => {
  it('detects Expo Go native-module misses', () => {
    assert.equal(
      isMissingNativeModuleError(new Error("Cannot find native module 'ExpoTextExtractor'")),
      true,
    );
    assert.equal(isMissingNativeModuleError(new Error('ExpoTextExtractor is not available')), true);
    assert.equal(isMissingNativeModuleError(new Error('network timeout')), false);
  });
});

describe('unsupportedOcrAttempt', () => {
  it('uses an Expo Go-specific message and empty fields', () => {
    const attempt = unsupportedOcrAttempt(true);
    assert.equal(attempt.status, 'unsupported');
    assert.equal(attempt.message, OCR_UNAVAILABLE_EXPO_GO);
    assert.equal(attempt.text, '');
    assert.equal(attempt.fields.cardCode, '');
    assert.equal(attempt.fields.type, null);
  });

  it('does not claim Expo Go when the host is something else', () => {
    const attempt = unsupportedOcrAttempt(false);
    assert.equal(attempt.status, 'unsupported');
    assert.equal(attempt.message, OCR_UNAVAILABLE);
  });
});

describe('createOcrService', () => {
  it('returns a soft Expo Go result without loading the extractor', async () => {
    let loaded = false;
    const service = createOcrService(
      runtime({
        hasNativeModule: () => false,
        isExpoGo: () => true,
        loadExtractor: async () => {
          loaded = true;
          throw new Error('should not load expo-text-extractor');
        },
      }),
    );

    const attempt = await service.recognize('file:///card.jpg');
    assert.equal(loaded, false);
    assert.equal(attempt.status, 'unsupported');
    assert.equal(attempt.message, OCR_UNAVAILABLE_EXPO_GO);
    assert.equal(attempt.fields.cardCode, '');
  });

  it('catches a missing-module throw from the extractor import', async () => {
    const service = createOcrService(
      runtime({
        isExpoGo: () => true,
        loadExtractor: async () => {
          throw new Error("Cannot find native module 'ExpoTextExtractor'");
        },
      }),
    );

    const attempt = await service.recognize('file:///card.jpg');
    assert.equal(attempt.status, 'unsupported');
    assert.equal(attempt.message, OCR_UNAVAILABLE_EXPO_GO);
    assert.equal(attempt.status !== 'ok', true);
  });

  it('returns a generic failed result for other OCR errors', async () => {
    const service = createOcrService(
      runtime({
        loadExtractor: async () => ({
          isSupported: true,
          extractTextFromImage: async () => {
            throw new Error('Vision pipeline exploded');
          },
        }),
      }),
    );

    const attempt = await service.recognize('file:///card.jpg');
    assert.deepEqual(attempt, failedOcrAttempt());
    assert.equal(attempt.message, OCR_FAILED);
    assert.equal(attempt.fields.cardCode, '');
  });

  it('still extracts fields when the native module is present', async () => {
    const service = createOcrService(runtime());
    const attempt = await service.recognize('file:///card.jpg');
    assert.equal(attempt.status, 'ok');
    assert.equal(attempt.fields.cardCode, 'OP01-001');
    assert.equal(attempt.fields.type, 'PSA');
    assert.equal(attempt.fields.grade, '10');
    assert.match(attempt.message, /OCR attempted/);
  });

  it('does not report success when OCR ran but found no fields', async () => {
    const service = createOcrService(
      runtime({
        loadExtractor: async () => ({
          isSupported: true,
          extractTextFromImage: async () => ['beautiful foil character card'],
        }),
      }),
    );

    const attempt = await service.recognize('file:///card.jpg');
    assert.equal(attempt.status, 'ok');
    assert.equal(attempt.fields.cardCode, '');
    assert.match(attempt.message, /found no card fields/);
  });

  it('never throws to the caller', async () => {
    const service = createOcrService(
      runtime({
        hasNativeModule: () => {
          throw new Error("Cannot find native module 'ExpoTextExtractor'");
        },
        loadExtractor: async () => {
          throw new Error('also broken');
        },
      }),
    );

    const attempt = await service.recognize('file:///card.jpg');
    assert.equal(attempt.status, 'unsupported');
    assert.equal(attempt.message, OCR_UNAVAILABLE);
  });
});
