import type { SQLiteDatabase } from 'expo-sqlite';
import type { CardDraft, CardType, CollectionCard } from '../models/card';
import { normalizeGrade, normalizePrintNote } from '../models/card';
import { parseAudInput } from '../lib/money';
import { createId } from '../lib/ids';
import { validateGrade } from '../lib/grade';

interface CardRow {
  id: string;
  card_code: string;
  type: string;
  grade: string | null;
  cert_number: string | null;
  print_note: string | null;
  language: string;
  purchase_date: string | null;
  purchase_price_aud: number | null;
  notes: string | null;
  photo_uri: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: CardRow): CollectionCard {
  return {
    id: row.id,
    cardCode: row.card_code,
    type: row.type as CardType,
    grade: row.grade,
    certNumber: row.cert_number,
    printNote: row.print_note,
    language: row.language,
    purchaseDate: row.purchase_date,
    purchasePriceAud: row.purchase_price_aud,
    notes: row.notes,
    photoUri: row.photo_uri,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function draftToPersistable(draft: CardDraft, existing?: CollectionCard): CollectionCard {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? createId('crd'),
    cardCode: draft.cardCode.trim().toUpperCase(),
    type: draft.type,
    grade: normalizeGrade(draft.grade),
    certNumber: draft.certNumber.trim() || null,
    printNote: normalizePrintNote(draft.printNote),
    language: (draft.language.trim() || 'EN').toUpperCase(),
    purchaseDate: draft.purchaseDate.trim() || null,
    purchasePriceAud: parseAudInput(draft.purchasePriceAud),
    notes: draft.notes.trim() || null,
    photoUri: draft.photoUri,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function validateDraft(draft: CardDraft): string | null {
  if (!draft.cardCode.trim()) return 'Card code is required.';
  if (!draft.type) return 'Type is required.';
  if (draft.purchasePriceAud.trim() && parseAudInput(draft.purchasePriceAud) == null) {
    return 'Purchase price must be a valid AUD amount.';
  }
  if (draft.purchaseDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(draft.purchaseDate.trim())) {
    return 'Purchase date must be YYYY-MM-DD.';
  }
  const gradeError = validateGrade(draft.grade, draft.type);
  if (gradeError) return gradeError;
  return null;
}

export async function listCards(db: SQLiteDatabase): Promise<CollectionCard[]> {
  const rows = await db.getAllAsync<CardRow>(
    'SELECT * FROM cards ORDER BY updated_at DESC',
  );
  return rows.map(mapRow);
}

export async function getCard(db: SQLiteDatabase, id: string): Promise<CollectionCard | null> {
  const row = await db.getFirstAsync<CardRow>('SELECT * FROM cards WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function upsertCard(db: SQLiteDatabase, card: CollectionCard): Promise<void> {
  await db.runAsync(
    `INSERT INTO cards (
      id, card_code, type, grade, cert_number, print_note, language,
      purchase_date, purchase_price_aud, notes, photo_uri, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      card_code = excluded.card_code,
      type = excluded.type,
      grade = excluded.grade,
      cert_number = excluded.cert_number,
      print_note = excluded.print_note,
      language = excluded.language,
      purchase_date = excluded.purchase_date,
      purchase_price_aud = excluded.purchase_price_aud,
      notes = excluded.notes,
      photo_uri = excluded.photo_uri,
      updated_at = excluded.updated_at`,
    [
      card.id,
      card.cardCode,
      card.type,
      card.grade,
      card.certNumber,
      card.printNote,
      card.language,
      card.purchaseDate,
      card.purchasePriceAud,
      card.notes,
      card.photoUri,
      card.createdAt,
      card.updatedAt,
    ],
  );
}

export async function deleteCard(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
}
