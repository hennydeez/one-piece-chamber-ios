import { isSlab, normalizeGrade, normalizePrintNote, type CollectionCard } from '../../models/card';
import type { CompQuery } from '../../models/comps';

function norm(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

/** Same identity keys as Scout: code + print + language + type + grade. */
export function cardMatchesCompQuery(card: CollectionCard, query: CompQuery): boolean {
  if (norm(card.cardCode) !== norm(query.cardCode)) return false;
  if (norm(card.language) !== norm(query.language)) return false;
  if (normalizePrintNote(card.printNote) !== normalizePrintNote(query.printNote)) return false;
  if (isSlab(card.type) !== isSlab(query.type)) return false;
  if (card.type !== query.type) return false;
  if (normalizeGrade(card.grade) !== normalizeGrade(query.grade)) return false;
  return true;
}

/**
 * Photo for a comps lookup. Selected card, then a matching collection card,
 * then an Add Card draft photo. Never invents solds.
 */
export function resolveQueryPhotoUri(
  query: CompQuery,
  options: {
    selectedCard?: CollectionCard | null;
    cards?: CollectionCard[];
    draftPhotoUri?: string | null;
  },
): string | null {
  const selected = options.selectedCard;
  if (selected?.photoUri && cardMatchesCompQuery(selected, query)) {
    return selected.photoUri;
  }

  const match = (options.cards ?? []).find(
    (card) => card.photoUri && cardMatchesCompQuery(card, query),
  );
  if (match?.photoUri) return match.photoUri;

  const draft = options.draftPhotoUri?.trim() ?? '';
  return draft || null;
}
