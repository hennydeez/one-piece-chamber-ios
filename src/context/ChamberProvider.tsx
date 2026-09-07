import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { CardDraft, CollectionCard } from '@/src/models/card';
import {
  deleteCard as deleteCardRow,
  getCard as getCardRow,
  listCards,
  upsertCard,
} from '@/src/db/cardsRepo';
import { persistCardPhoto } from '@/src/lib/photos';
import { compsService } from '@/src/services/comps';
import type { CompQuery } from '@/src/models/comps';
import { ChamberContext } from './ChamberContext';
import { persistValidatedDraft } from './persistDraft';

export function ChamberProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const rows = await listCards(db);
    setCards(rows);
    setReady(true);
  }, [db]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveDraft = useCallback(
    async (draft: CardDraft, existing?: CollectionCard) => {
      const card = await persistValidatedDraft(draft, existing, {
        persistPhoto: persistCardPhoto,
        upsert: (row) => upsertCard(db, row),
      });
      await refresh();
      return card;
    },
    [db, refresh],
  );

  const removeCard = useCallback(
    async (id: string) => {
      await deleteCardRow(db, id);
      await refresh();
    },
    [db, refresh],
  );

  const findCard = useCallback(async (id: string) => getCardRow(db, id), [db]);

  const lookupComps = useCallback(async (query: CompQuery) => {
    return compsService.getLastCompletedSolds(query);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      cards,
      pendingPhotoUri,
      setPendingPhotoUri,
      refresh,
      saveDraft,
      removeCard,
      findCard,
      lookupComps,
    }),
    [ready, cards, pendingPhotoUri, refresh, saveDraft, removeCard, findCard, lookupComps],
  );

  return <ChamberContext.Provider value={value}>{children}</ChamberContext.Provider>;
}
