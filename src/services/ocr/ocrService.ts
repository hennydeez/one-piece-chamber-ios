import { emptyPrefill, parseCardText, type OcrPrefill } from './parseCardText';

export type OcrStatus = 'ok' | 'unsupported' | 'failed';

export interface OcrAttempt {
  status: OcrStatus;
  text: string;
  fields: OcrPrefill;
  message: string;
}

export interface OcrService {
  recognize(imageUri: string): Promise<OcrAttempt>;
}

export const OCR_UNAVAILABLE_EXPO_GO = 'OCR unavailable in Expo Go — enter fields manually';
export const OCR_UNAVAILABLE = 'OCR unavailable — enter fields manually';
export const OCR_FAILED = 'OCR failed — enter fields manually';

type ExtractorModule = {
  isSupported?: boolean;
  extractTextFromImage?: (uri: string) => Promise<unknown>;
};

export interface OcrRuntime {
  hasNativeModule(): boolean;
  isExpoGo(): boolean;
  loadExtractor(): Promise<ExtractorModule>;
}

export function isMissingNativeModuleError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error ?? '');
  return /cannot find native module/i.test(text) || /ExpoTextExtractor/i.test(text);
}

export function unsupportedOcrAttempt(isExpoGo: boolean): OcrAttempt {
  return {
    status: 'unsupported',
    text: '',
    fields: emptyPrefill(),
    message: isExpoGo ? OCR_UNAVAILABLE_EXPO_GO : OCR_UNAVAILABLE,
  };
}

export function failedOcrAttempt(): OcrAttempt {
  return {
    status: 'failed',
    text: '',
    fields: emptyPrefill(),
    message: OCR_FAILED,
  };
}

function failed(message: string): OcrAttempt {
  return {
    status: 'failed',
    text: '',
    fields: emptyPrefill(),
    message,
  };
}

/**
 * OCR via expo-text-extractor (Apple Vision / ML Kit) in a dev client or EAS build.
 *
 * Never import the JS package until the native module is confirmed present.
 * `requireNativeModule('ExpoTextExtractor')` inside expo-text-extractor red-screens
 * Expo Go even when the caller try/catches the thrown error.
 */
export function createOcrService(runtime: OcrRuntime): OcrService {
  return {
    async recognize(imageUri: string): Promise<OcrAttempt> {
      if (!imageUri) {
        return failed('No photo to read.');
      }

      try {
        // Expo Go never ships ExpoTextExtractor. Detect it first so we never
        // evaluate expo-text-extractor (its requireNativeModule red-screens).
        if (runtime.isExpoGo()) {
          return unsupportedOcrAttempt(true);
        }

        if (!runtime.hasNativeModule()) {
          return unsupportedOcrAttempt(false);
        }

        const extractor = await runtime.loadExtractor();
        if (extractor.isSupported !== true) {
          return unsupportedOcrAttempt(runtime.isExpoGo());
        }

        const extract = extractor.extractTextFromImage;
        if (typeof extract !== 'function') {
          return unsupportedOcrAttempt(runtime.isExpoGo());
        }

        const raw = await extract(imageUri);
        const text = Array.isArray(raw) ? raw.filter(Boolean).join('\n') : String(raw ?? '');
        const fields = parseCardText(text);
        const foundSomething = Boolean(
          fields.cardCode || fields.type || fields.grade || fields.certNumber,
        );

        return {
          status: 'ok',
          text,
          fields,
          message: foundSomething
            ? 'OCR attempted — review and edit every prefilled field before saving.'
            : 'OCR ran but found no card fields. Enter them manually.',
        };
      } catch (error) {
        if (isMissingNativeModuleError(error)) {
          return unsupportedOcrAttempt(runtime.isExpoGo());
        }
        return failedOcrAttempt();
      }
    },
  };
}

function defaultRuntime(): OcrRuntime {
  return {
    hasNativeModule() {
      try {
        const core = require('expo-modules-core') as {
          requireOptionalNativeModule?: (name: string) => unknown;
        };
        if (typeof core.requireOptionalNativeModule !== 'function') {
          // Probe API missing — try the import and let catch handle a hard miss.
          return true;
        }
        return core.requireOptionalNativeModule('ExpoTextExtractor') != null;
      } catch {
        return true;
      }
    },
    isExpoGo() {
      try {
        const imported = require('expo-constants') as {
          default?: { executionEnvironment?: string };
          executionEnvironment?: string;
        };
        const env = imported.default?.executionEnvironment ?? imported.executionEnvironment;
        return env === 'storeClient';
      } catch {
        return false;
      }
    },
    loadExtractor() {
      return import('expo-text-extractor');
    },
  };
}

export const expoOcrService: OcrService = createOcrService(defaultRuntime());
