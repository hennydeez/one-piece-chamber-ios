import { isSlab, type CardType } from '../models/card';

export const PSA_GRADE_CHIPS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;
export const TAG_GRADE_CHIPS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;
export const BGS_GRADE_CHIPS = ['7', '7.5', '8', '8.5', '9', '9.5', '10'] as const;

/** Chip values for Add Card / Comps. Raw has none (grade stays hidden). */
export function gradeChipOptions(type: CardType): readonly string[] {
  if (type === 'PSA') return PSA_GRADE_CHIPS;
  if (type === 'TAG') return TAG_GRADE_CHIPS;
  if (type === 'BGS') return BGS_GRADE_CHIPS;
  return [];
}

/** Keep a typed grade only when it is one of that grader's chips. */
export function snapGradeToChips(value: string, type: CardType): string {
  if (!isSlab(type)) return '';
  const filtered = filterNumericGrade(value, type);
  return gradeChipOptions(type).includes(filtered) ? filtered : '';
}

/** Strip letters and extra punctuation. Keeps digits and a single decimal. */
export function filterNumericGrade(value: string, type: CardType): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  if (type === 'PSA') {
    return cleaned.replace(/\..*$/, '').slice(0, 2);
  }
  const match = cleaned.match(/^(\d{0,2})(?:\.(\d?))?/);
  if (!match) return '';
  if (cleaned.includes('.') && match[1] !== undefined) {
    return `${match[1]}.${match[2] ?? ''}`;
  }
  return match[1] ?? '';
}

export function validateGrade(value: string, type: CardType): string | null {
  const trimmed = value.trim();
  if (!trimmed || !isSlab(type)) return null;
  if (type === 'PSA') {
    if (!/^\d{1,2}$/.test(trimmed)) return 'PSA grades are whole numbers.';
    return null;
  }
  // BGS: decimals allowed. TAG: integer or one decimal (Henny TBD — numeric only).
  if (!/^\d{1,2}(?:\.\d)?$/.test(trimmed)) {
    return type === 'BGS' ? 'BGS grades are numbers (decimals ok).' : 'TAG grades are numbers.';
  }
  return null;
}

export function gradeFieldHint(_type?: CardType, opts?: { optional?: boolean }): string {
  return opts?.optional ? 'Numbers only. Optional.' : 'Numbers only.';
}
