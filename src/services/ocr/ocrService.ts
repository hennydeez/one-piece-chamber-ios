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

function failed(message: string): OcrAttempt {
  return {
    status: 'failed',
    text: '',
    fields: emptyPrefill(),
    message,
  };
}

/**
 * Expo-compatible OCR: on-device text extraction via expo-text-extractor
 * (Apple Vision / ML Kit) inside a development or EAS build.
 * Expo Go and web report unsupported — fields stay manual.
 */
export const expoOcrService: OcrService = {
  async recognize(imageUri: string): Promise<OcrAttempt> {
    if (!imageUri) {
      return failed('No photo to read.');
    }

    try {
      const extractor = await import('expo-text-extractor');
      const supported = extractor.isSupported === true;
      if (!supported) {
        return {
          status: 'unsupported',
          text: '',
          fields: emptyPrefill(),
          message:
            'OCR is not available on this device. Enter fields manually — nothing was invented.',
        };
      }

      const extract = extractor.extractTextFromImage;
      if (typeof extract !== 'function') {
        return {
          status: 'unsupported',
          text: '',
          fields: emptyPrefill(),
          message:
            'OCR module is present but has no extract function. Enter fields manually.',
        };
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
      const detail = error instanceof Error ? error.message : 'unknown error';
      return {
        status: 'failed',
        text: '',
        fields: emptyPrefill(),
        message: `OCR attempt failed (${detail}). Enter fields manually — values were not invented.`,
      };
    }
  },
};
