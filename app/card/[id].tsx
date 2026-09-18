import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ChamberScreen } from '@/src/components/ChamberScreen';
import { CompsLookupProgress } from '@/src/components/CompsLookupProgress';
import { CompsPhoto } from '@/src/components/CompsPhoto';
import { CompsResults } from '@/src/components/CompsResults';
import { GoldButton } from '@/src/components/GoldButton';
import { useCompsLookup } from '@/src/components/useCompsLookup';
import { useChamber } from '@/src/context/ChamberContext';
import { formatPurchaseDate } from '@/src/lib/dates';
import { compsViewMessage } from '@/src/services/comps/last5Avg';
import { formatAud } from '@/src/lib/money';
import type { CollectionCard } from '@/src/models/card';
import { chamber } from '@/src/theme/chamber';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { findCard, removeCard, lookupComps } = useChamber();
  const [card, setCard] = useState<CollectionCard | null | undefined>(undefined);
  const { result: comps, view, loading: loadingComps, runLookup, changeView } = useCompsLookup(lookupComps);

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setCard(null);
        return;
      }
      void findCard(id).then(setCard);
    }, [id, findCard]),
  );

  if (card === undefined) {
    return (
      <ChamberScreen title="Card">
        <Text style={styles.muted}>Loading…</Text>
      </ChamberScreen>
    );
  }

  if (!card) {
    return (
      <ChamberScreen title="Card">
        <Text style={styles.muted}>Card not found.</Text>
      </ChamberScreen>
    );
  }

  const confirmDelete = () => {
    Alert.alert('Delete', `Delete ${card.cardCode}?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeCard(card.id);
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const loadComps = async () => {
    await runLookup(
      {
        cardCode: card.cardCode,
        printNote: card.printNote,
        language: card.language,
        type: card.type,
        grade: card.grade,
      },
      'quick',
    );
  };

  return (
    <ChamberScreen title={card.cardCode} subtitle={`${card.type}${card.grade ? ` ${card.grade}` : ''} · ${card.language}`}>
      <CompsPhoto uri={card.photoUri} height={320} />
      <View style={styles.sheet}>
        <Row label="Type" value={card.type} />
        <Row label="Grade" value={card.grade ?? '—'} />
        <Row label="Cert #" value={card.certNumber ?? '—'} />
        <Row label="Print" value={card.printNote ?? '—'} />
        <Row label="Language" value={card.language} />
        <Row label="Purchased" value={formatPurchaseDate(card.purchaseDate)} />
        <Row label="Price paid" value={formatAud(card.purchasePriceAud)} />
        <Row label="Notes" value={card.notes ?? '—'} />
      </View>
      <GoldButton label="Edit" onPress={() => router.push(`/edit/${card.id}`)} />
      <GoldButton label="Sales history" onPress={() => router.push(`/sales/${card.id}`)} />
      <GoldButton label="Get comps" onPress={loadComps} loading={loadingComps} />
      <CompsLookupProgress loading={loadingComps} />
      {comps ? (
        <View style={styles.comps}>
          <Text style={styles.banner}>{compsViewMessage(comps, view)}</Text>
          <CompsResults result={comps} view={view} onViewChange={(next) => void changeView(next)} />
        </View>
      ) : null}
      <GoldButton label="Delete" tone="danger" onPress={confirmDelete} />
    </ChamberScreen>
  );
}

const styles = StyleSheet.create({
  muted: {
    color: chamber.muted,
  },
  sheet: {
    backgroundColor: chamber.panel,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: chamber.panelEdge,
    padding: 12,
  },
  row: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: chamber.panelEdge,
  },
  rowLabel: {
    color: chamber.faint,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  rowValue: {
    color: chamber.ink,
    fontSize: 16,
    marginTop: 4,
  },
  comps: {
    gap: 12,
  },
  banner: {
    color: chamber.goldSoft,
    fontSize: 13,
    lineHeight: 18,
  },
});
