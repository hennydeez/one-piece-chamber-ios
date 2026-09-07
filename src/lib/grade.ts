import { isSlab, type CardType } from '../models/card';

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

export function gradeFieldHint(type: CardType, opts?: { optional?: boolean }): string {
  const base =
    type === 'PSA'
      ? 'Numbers only. Whole numbers.'
      : type === 'BGS'
        ? 'Numbers only. Decimals ok.'
        : type === 'TAG'
          ? 'Numbers only. Integer or one decimal.'
          : 'Numbers only';
  return opts?.optional ? `${base} Optional.` : base;
}
