import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChamberScreen } from '@/src/components/ChamberScreen';
import { ChipRow } from '@/src/components/ChipRow';
import { Field } from '@/src/components/Field';
import { GoldButton } from '@/src/components/GoldButton';
import { Last5AvgStamp } from '@/src/components/Last5AvgStamp';
import { useChamber } from '@/src/context/ChamberContext';
import { CARD_TYPES, isSlab, type CardType, type CollectionCard } from '@/src/models/card';
import type { CompQuery, CompsResult } from '@/src/models/comps';
import { filterNumericGrade } from '@/src/lib/grade';
import { COMP_LANGUAGES, compLanguageFromCode, languageCodeFromComp, type CompLanguage } from '@/src/lib/language';
import { chamber } from '@/src/theme/chamber';

export default function CompsScreen() {
  const { cards, lookupComps } = useChamber();
  const [cardCode, setCardCode] = useState('');
  const [printNote, setPrintNote] = useState('');
  const [language, setLanguage] = useState<CompLanguage>('Global');
  const [type, setType] = useState<CardType>('Raw');
  const [grade, setGrade] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<CompsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo<CompQuery>(
    () => ({
      cardCode: cardCode.trim().toUpperCase(),
      printNote: printNote.trim() || null,
      language: languageCodeFromComp(language),
      type,
      grade: type === 'Raw' ? null : grade.trim() || null,
    }),
    [cardCode, printNote, language, type, grade],
  );

  const applyCard = (card: CollectionCard) => {
    setSelectedId(card.id);
    setCardCode(card.cardCode);
    setPrintNote(card.printNote ?? '');
    setLanguage(compLanguageFromCode(card.language));
    setType(card.type);
    setGrade(card.type === 'Raw' ? '' : filterNumericGrade(card.grade ?? '', card.type));
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
    <ChamberScreen title="Comps" subtitle="Last solds for this code / grade.">
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
        <Text style={styles.hint}>Add a card or type a code below.</Text>
      )}

      <Field
        label="Card code"
        value={cardCode}
        autoCapitalize="characters"
        onChangeText={setCardCode}
      />
      <Field
        label="Print note"
        value={printNote}
        placeholder="Blank matches blank"
        onChangeText={setPrintNote}
      />
      <ChipRow
        label="Language"
        values={COMP_LANGUAGES}
        selected={language}
        onSelect={setLanguage}
      />
      <ChipRow
        label="Type"
        values={CARD_TYPES}
        selected={type}
        onSelect={(next) => {
          setType(next);
          setGrade(next === 'Raw' ? '' : filterNumericGrade(grade, next));
          setResult(null);
        }}
      />
      {isSlab(type) ? (
        <Field
          label="Grade"
          value={grade}
          placeholder={type === 'BGS' ? '9.5' : '10'}
          keyboardType="decimal-pad"
          onChangeText={(value) => setGrade(filterNumericGrade(value, type))}
          hint="Numbers only"
        />
      ) : null}
      <GoldButton label="Get comps" onPress={runLookup} loading={loading} disabled={!query.cardCode} />

      {result ? (
        <View style={styles.results}>
          <Text style={styles.bannerText}>{result.sourceMessage}</Text>
          <Last5AvgStamp avg={result.fixed} sourceStatus={result.sourceStatus} />
          <Last5AvgStamp avg={result.auction} sourceStatus={result.sourceStatus} />
        </View>
      ) : null}
    </ChamberScreen>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  cardChipOn: {
    borderColor: chamber.gold,
  },
  cardChipText: {
    color: chamber.ink,
    fontSize: 13,
  },
  hint: {
    color: chamber.muted,
    fontSize: 14,
  },
  results: {
    gap: 12,
  },
  bannerText: {
    color: chamber.goldSoft,
    fontSize: 14,
    lineHeight: 20,
  },
});
