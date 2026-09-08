import { draftToPersistable, validateDraft } from '../db/cardsRepo';
import type { CardDraft, CollectionCard } from '../models/card';

export interface PersistDraftRuntime {
  persistPhoto: (sourceUri: string) => Promise<string>;
  upsert: (card: CollectionCard) => Promise<void>;
}

/**
 * Write the card to SQLite *before* any photo-file work.
 * A later ExpoAsset / FileSystem blow-up must not lose the row.
 */
export async function persistValidatedDraft(
  draft: CardDraft,
  existing: CollectionCard | undefined,
  runtime: PersistDraftRuntime,
): Promise<CollectionCard> {
  const error = validateDraft(draft);
  if (error) throw new Error(error);

  const initial = draftToPersistable(draft, existing);
  await runtime.upsert(initial);

  if (!draft.photoUri) return initial;

  try {
    const photoUri = await runtime.persistPhoto(draft.photoUri);
    if (photoUri === draft.photoUri) return initial;
    const updated: CollectionCard = {
      ...initial,
      photoUri,
      updatedAt: new Date().toISOString(),
    };
    await runtime.upsert(updated);
    return updated;
  } catch {
    return initial;
  }
}
