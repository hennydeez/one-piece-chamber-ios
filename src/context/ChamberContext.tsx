import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { CardDraft, CollectionCard } from '@/src/models/card';
import {
  deleteCard as deleteCardRow,
  draftToPersistable,
  getCard as getCardRow,
  listCards,
  upsertCard,
  validateDraft,
} from '@/src/db/cardsRepo';
import { persistCardPhoto } from '@/src/lib/photos';
import { compsService } from '@/src/services/comps';
import type { CompQuery, CompsResult } from '@/src/models/comps';

interface ChamberContextValue {
  ready: boolean;
  cards: CollectionCard[];
  pendingPhotoUri: string | null;
  setPendingPhotoUri: (uri: string | null) => void;
  refresh: () => Promise<void>;
  saveDraft: (draft: CardDraft, existing?: CollectionCard) => Promise<CollectionCard>;
  removeCard: (id: string) => Promise<void>;
  findCard: (id: string) => Promise<CollectionCard | null>;
  lookupComps: (query: CompQuery) => Promise<CompsResult>;
}

const ChamberContext = createContext<ChamberContextValue | null>(null);

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
      const error = validateDraft(draft);
      if (error) throw new Error(error);
      const photoUri = draft.photoUri ? await persistCardPhoto(draft.photoUri) : null;
      const card = draftToPersistable({ ...draft, photoUri }, existing);
      await upsertCard(db, card);
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

  const findCard = useCallback(
    async (id: string) => {
      return getCardRow(db, id);
    },
    [db],
  );

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

export function useChamber(): ChamberContextValue {
  const ctx = useContext(ChamberContext);
  if (!ctx) {
    throw new Error('useChamber must be used inside ChamberProvider');
  }
  return ctx;
}
