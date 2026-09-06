import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChamberScreen } from '@/src/components/ChamberScreen';
import { ChipRow } from '@/src/components/ChipRow';
import { Field } from '@/src/components/Field';
import { GoldButton } from '@/src/components/GoldButton';
import { Last5AvgStamp } from '@/src/components/Last5AvgStamp';
import { useChamber } from '@/src/context/ChamberContext';
import { CARD_TYPES, type CardType, type CollectionCard } from '@/src/models/card';
import type { CompQuery, CompsResult } from '@/src/models/comps';
import { LAST5_AVG_LABEL } from '@/src/services/comps';
import { chamber } from '@/src/theme/chamber';

export default function CompsScreen() {
  const { cards, lookupComps } = useChamber();
  const [cardCode, setCardCode] = useState('');
  const [printNote, setPrintNote] = useState('');
  const [language, setLanguage] = useState('EN');
  const [type, setType] = useState<CardType>('Raw');
  const [grade, setGrade] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<CompsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo<CompQuery>(
    () => ({
      cardCode: cardCode.trim().toUpperCase(),
      printNote: printNote.trim() || null,
      language: language.trim().toUpperCase() || 'EN',
      type,
      grade: grade.trim() || null,
    }),
    [cardCode, printNote, language, type, grade],
  );

  const applyCard = (card: CollectionCard) => {
    setSelectedId(card.id);
    setCardCode(card.cardCode);
    setPrintNote(card.printNote ?? '');
    setLanguage(card.language);
    setType(card.type);
    setGrade(card.grade ?? '');
    setResult(null);
  };

  const runLookup = async () => {
    if (!query.cardCode) return;
    setLoading(true);
    try {
      setResult(await lookupComps(query));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChamberScreen
      title="Comps"
      subtitle="Completed solds only. Match is code ∧ print ∧ language ∧ grade. Raw is never a slab.">
      <View style={styles.rules}>
        <Text style={styles.rulesTitle}>Scout match</Text>
        <Text style={styles.rulesBody}>
          Newest ≤5 per channel · AUD first · FX stamped on conversions · auctions kept
          separate · {LAST5_AVG_LABEL} is an arithmetic mean · n is honest when under 5 ·
          fake prices are never labeled as real.
        </Text>
      </View>

      {cards.length > 0 ? (
        <View style={styles.picker}>
          <Text style={styles.pickerLabel}>From collection</Text>
          <View style={styles.cardChips}>
            {cards.map((card) => (
              <Pressable
                key={card.id}
                onPress={() => applyCard(card)}
                style={[styles.cardChip, selectedId === card.id && styles.cardChipOn]}>
                <Text style={styles.cardChipText}>
                  {card.cardCode} · {card.type}
                  {card.grade ? ` ${card.grade}` : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <Text style={styles.hint}>Add a card to prefill a Scout query, or type one below.</Text>
      )}

      <Field label="Card code" value={cardCode} autoCapitalize="characters" onChangeText={setCardCode} />
      <Field label="Print note" value={printNote} placeholder="Blank matches blank" onChangeText={setPrintNote} />
      <Field label="Language" value={language} autoCapitalize="characters" onChangeText={setLanguage} />
      <ChipRow label="Type" values={CARD_TYPES} selected={type} onSelect={setType} />
      <Field label="Grade" value={grade} placeholder="Blank matches ungraded / raw blank" onChangeText={setGrade} />
      <GoldButton label="Look up last completed solds" onPress={runLookup} loading={loading} disabled={!query.cardCode} />

      {result ? (
        <View style={styles.results}>
          <View style={[styles.banner, result.sourceStatus !== 'live' && styles.bannerWarn]}>
            <Text style={styles.bannerText}>{result.sourceMessage}</Text>
          </View>
          <Last5AvgStamp avg={result.fixed} />
          <Last5AvgStamp avg={result.auction} />
        </View>
      ) : null}
    </ChamberScreen>
  );
}

const styles = StyleSheet.create({
  rules: {
    backgroundColor: chamber.panel,
    borderColor: chamber.panelEdge,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  rulesTitle: {
    color: chamber.gold,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  rulesBody: {
    color: chamber.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  picker: {
    gap: 8,
  },
  pickerLabel: {
    color: chamber.goldSoft,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  cardChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardChip: {
    borderWidth: 1,
    borderColor: chamber.panelEdge,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cardChipOn: {
    borderColor: chamber.gold,
  },
  cardChipText: {
    color: chamber.ink,
    fontSize: 12,
  },
  hint: {
    color: chamber.muted,
    fontSize: 13,
  },
  results: {
    gap: 12,
  },
  banner: {
    backgroundColor: '#1B2418',
    borderColor: chamber.ok,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  bannerWarn: {
    backgroundColor: '#241C12',
    borderColor: chamber.goldDim,
  },
  bannerText: {
    color: chamber.goldSoft,
    fontSize: 13,
    lineHeight: 18,
  },
});
