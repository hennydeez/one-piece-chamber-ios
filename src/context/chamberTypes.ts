import type { CardDraft, CollectionCard } from '@/src/models/card';
import type { CompQuery, CompsResult } from '@/src/models/comps';

export interface ChamberContextValue {
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
