import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { CardDraft, CollectionCard } from '@/src/models/card';
import { draftToPersistable, validateDraft } from '@/src/db/cardsRepo';
import { compsService } from '@/src/services/comps';
import type { CompQuery } from '@/src/models/comps';
import { ChamberContext } from './ChamberContext';

/**
 * Web preview store. Native builds use SQLite via ChamberProvider.tsx.
 * expo-sqlite's wa-sqlite.wasm is not shipped in this SDK build, so web
 * keeps cards in memory for UI review only.
 */
export function ChamberProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);

  const refresh = useCallback(async () => undefined, []);

  const saveDraft = useCallback(async (draft: CardDraft, existing?: CollectionCard) => {
    const error = validateDraft(draft);
    if (error) throw new Error(error);
    const card = draftToPersistable(draft, existing);
    setCards((current) => {
      const without = current.filter((row) => row.id !== card.id);
      return [card, ...without];
    });
    return card;
  }, []);

  const removeCard = useCallback(async (id: string) => {
    setCards((current) => current.filter((row) => row.id !== id));
  }, []);

  const findCard = useCallback(
    async (id: string) => cards.find((row) => row.id === id) ?? null,
    [cards],
  );

  const lookupComps = useCallback(async (query: CompQuery) => {
    return compsService.getLastCompletedSolds(query);
  }, []);

  const value = useMemo(
    () => ({
      ready: true,
      cards,
      pendingPhotoUri,
      setPendingPhotoUri,
      refresh,
      saveDraft,
      removeCard,
      findCard,
      lookupComps,
    }),
    [cards, pendingPhotoUri, refresh, saveDraft, removeCard, findCard, lookupComps],
  );

  return <ChamberContext.Provider value={value}>{children}</ChamberContext.Provider>;
}
