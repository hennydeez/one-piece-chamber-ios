export const CARD_TYPES = ['Raw', 'PSA', 'BGS', 'TAG'] as const;
export type CardType = (typeof CARD_TYPES)[number];

export const CARD_LANGUAGES = ['EN', 'JP', 'KR', 'CN', 'IT', 'FR', 'DE', 'ES', 'Other'] as const;
export type CardLanguage = (typeof CARD_LANGUAGES)[number];

export function isSlab(type: CardType): boolean {
  return type !== 'Raw';
}

export interface CollectionCard {
  id: string;
  cardCode: string;
  type: CardType;
  grade: string | null;
  certNumber: string | null;
  printNote: string | null;
  language: string;
  purchaseDate: string | null;
  purchasePriceAud: number | null;
  notes: string | null;
  photoUri: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CardDraft {
  cardCode: string;
  type: CardType;
  grade: string;
  certNumber: string;
  printNote: string;
  language: string;
  purchaseDate: string;
  purchasePriceAud: string;
  notes: string;
  photoUri: string | null;
}

export function emptyDraft(): CardDraft {
  return {
    cardCode: '',
    type: 'Raw',
    grade: '',
    certNumber: '',
    printNote: '',
    language: 'EN',
    purchaseDate: '',
    purchasePriceAud: '',
    notes: '',
    photoUri: null,
  };
}

export function draftFromCard(card: CollectionCard): CardDraft {
  return {
    cardCode: card.cardCode,
    type: card.type,
    grade: card.grade ?? '',
    certNumber: card.certNumber ?? '',
    printNote: card.printNote ?? '',
    language: card.language,
    purchaseDate: card.purchaseDate ?? '',
    purchasePriceAud:
      card.purchasePriceAud == null ? '' : String(card.purchasePriceAud),
    notes: card.notes ?? '',
    photoUri: card.photoUri,
  };
}

export function normalizePrintNote(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length === 0 ? null : trimmed;
}

export function normalizeGrade(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length === 0 ? null : trimmed;
}
