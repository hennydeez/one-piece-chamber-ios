import { isSlab, normalizeGrade, normalizePrintNote } from '../../models/card';
import type { CompQuery, CompSold } from '../../models/comps';

function norm(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

export function matchesScoutRules(sold: CompSold, query: CompQuery): boolean {
  if (!sold.completed) return false;
  if (norm(sold.cardCode) !== norm(query.cardCode)) return false;
  if (norm(sold.language) !== norm(query.language)) return false;
  if (normalizePrintNote(sold.printNote) !== normalizePrintNote(query.printNote)) {
    return false;
  }
  if (isSlab(sold.type) !== isSlab(query.type)) return false;
  if (sold.type !== query.type) return false;
  if (normalizeGrade(sold.grade) !== normalizeGrade(query.grade)) return false;
  return true;
}

export function filterMatchingSolds(solds: CompSold[], query: CompQuery): CompSold[] {
  return solds.filter((sold) => matchesScoutRules(sold, query));
}
