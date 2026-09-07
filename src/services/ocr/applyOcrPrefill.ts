import type { CardDraft } from '../../models/card';
import type { OcrPrefill } from './parseCardText';

function firstFilled(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim() ?? '';
    if (trimmed) return trimmed;
  }
  return '';
}

/**
 * Merge OCR guesses into the Add Card draft.
 * Only non-empty extracted values fill empty / default fields.
 * User-typed values are never wiped.
 */
export function applyOcrPrefill(draft: CardDraft, fields: OcrPrefill): CardDraft {
  const ocrType = fields.type;
  const keepUserType = draft.type !== 'Raw' || !ocrType;

  return {
    ...draft,
    cardCode: firstFilled(draft.cardCode, fields.cardCode),
    type: keepUserType ? draft.type : ocrType,
    grade: firstFilled(draft.grade, fields.grade),
    certNumber: firstFilled(draft.certNumber, fields.certNumber),
    printNote: firstFilled(draft.printNote, fields.printNote),
    language:
      draft.language && draft.language !== 'EN'
        ? draft.language
        : firstFilled(fields.language, draft.language) || 'EN',
  };
}
