import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChamberScreen } from '@/src/components/ChamberScreen';
import { CompsLookupProgress } from '@/src/components/CompsLookupProgress';
import { CompsPhoto } from '@/src/components/CompsPhoto';
import { SoldRowsTable } from '@/src/components/SoldRowsTable';
import { useChamber } from '@/src/context/ChamberContext';
import type { CollectionCard } from '@/src/models/card';
import type { CompsResult } from '@/src/models/comps';
import { resolveQueryPhotoUri } from '@/src/services/comps/queryPhoto';
import { chamber } from '@/src/theme/chamber';

export default function SalesHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { findCard, lookupComps } = useChamber();
  const [card, setCard] = useState<CollectionCard | null | undefined>(undefined);
  const [result, setResult] = useState<CompsResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setCard(null);
      return;
    }
    void findCard(id).then(setCard);
  }, [id, findCard]);

  useEffect(() => {
    if (!card) return;
    let cancelled = false;
    setLoading(true);
    setResult(null);
    void lookupComps({
      cardCode: card.cardCode,
      printNote: card.printNote,
      language: card.language,
      type: card.type,
      grade: card.grade,
    })
      .then((next) => {
        if (!cancelled) setResult(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [card, lookupComps]);

  if (card === undefined) {
    return (
      <ChamberScreen title="Sales history">
        <Text style={styles.muted}>Loading…</Text>
      </ChamberScreen>
    );
  }

  if (!card) {
    return (
      <ChamberScreen title="Sales history">
        <Text style={styles.muted}>Card not found.</Text>
      </ChamberScreen>
    );
  }

  const photoUri = resolveQueryPhotoUri(
    {
      cardCode: card.cardCode,
      printNote: card.printNote,
      language: card.language,
      type: card.type,
      grade: card.grade,
    },
    {
      selectedCard: card,
      apiImageUrl: result?.imageUrl,
    },
  );

  const emptyLabel =
    result?.sourceStatus === 'error' ? result.sourceMessage : 'No solds for this card.';

  return (
    <ChamberScreen title="Sales history" subtitle={`${card.cardCode} · completed solds.`}>
      <CompsPhoto uri={photoUri ?? card.photoUri} />
      <CompsLookupProgress loading={loading} />
      {result ? (
        <View style={styles.card}>
          <Text style={styles.banner}>{result.sourceMessage}</Text>
          <SoldRowsTable solds={result.solds} emptyLabel={emptyLabel} />
        </View>
      ) : !loading ? (
        <View style={styles.card}>
          <SoldRowsTable solds={[]} emptyLabel="No solds for this card." />
        </View>
      ) : null}
    </ChamberScreen>
  );
}

const styles = StyleSheet.create({
  muted: {
    color: chamber.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: chamber.panel,
    borderWidth: 1,
    borderColor: chamber.goldDim,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 8,
  },
  banner: {
    color: chamber.goldSoft,
    fontSize: 13,
    lineHeight: 18,
  },
});
