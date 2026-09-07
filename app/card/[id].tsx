import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { ChamberMark } from '@/src/components/ChamberMark';
import { ChamberScreen } from '@/src/components/ChamberScreen';
import { GoldButton } from '@/src/components/GoldButton';
import { Last5AvgStamp } from '@/src/components/Last5AvgStamp';
import { useChamber } from '@/src/context/ChamberContext';
import { formatDisplayDate } from '@/src/lib/dates';
import { formatAud } from '@/src/lib/money';
import type { CollectionCard } from '@/src/models/card';
import type { CompsResult } from '@/src/models/comps';
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
  const [card, setCard] = useState<CollectionCard | null>(null);
  const [comps, setComps] = useState<CompsResult | null>(null);
  const [loadingComps, setLoadingComps] = useState(false);

  useEffect(() => {
    if (!id) return;
    void findCard(id).then(setCard);
  }, [id, findCard]);

  if (!card) {
    return (
      <ChamberScreen title="Card">
        <Text style={styles.muted}>This card is not in the chamber.</Text>
      </ChamberScreen>
    );
  }

  const confirmDelete = () => {
    Alert.alert('Remove from chamber', `Delete ${card.cardCode}? This cannot be undone.`, [
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
    setLoadingComps(true);
    try {
      setComps(
        await lookupComps({
          cardCode: card.cardCode,
          printNote: card.printNote,
          language: card.language,
          type: card.type,
          grade: card.grade,
        }),
      );
    } finally {
      setLoadingComps(false);
    }
  };

  return (
    <ChamberScreen title={card.cardCode} subtitle={`${card.type}${card.grade ? ` ${card.grade}` : ''} · ${card.language}`}>
      <View style={styles.photo}>
        {card.photoUri ? (
          <Image source={{ uri: card.photoUri }} style={styles.image} />
        ) : (
          <ChamberMark size={80} />
        )}
      </View>
      <View style={styles.sheet}>
        <Row label="Type" value={card.type} />
        <Row label="Grade" value={card.grade ?? '—'} />
        <Row label="Cert #" value={card.certNumber ?? '—'} />
        <Row label="Print" value={card.printNote ?? '—'} />
        <Row label="Language" value={card.language} />
        <Row label="Purchased" value={formatDisplayDate(card.purchaseDate)} />
        <Row label="Price paid" value={formatAud(card.purchasePriceAud)} />
        <Row label="Notes" value={card.notes ?? '—'} />
      </View>
      <GoldButton label="Last-5 comps for this card" onPress={loadComps} loading={loadingComps} />
      {comps ? (
        <View style={styles.comps}>
          <Text style={styles.banner}>{comps.sourceMessage}</Text>
          <Last5AvgStamp avg={comps.fixed} sourceStatus={comps.sourceStatus} />
          <Last5AvgStamp avg={comps.auction} sourceStatus={comps.sourceStatus} />
        </View>
      ) : null}
      <GoldButton label="Delete card" tone="danger" onPress={confirmDelete} />
    </ChamberScreen>
  );
}

const styles = StyleSheet.create({
  muted: {
    color: chamber.muted,
  },
  photo: {
    height: 260,
    borderRadius: 14,
    backgroundColor: chamber.bgSunken,
    borderWidth: 1,
    borderColor: chamber.panelEdge,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sheet: {
    backgroundColor: chamber.panel,
    borderRadius: 14,
    borderWidth: 1,
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
