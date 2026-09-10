import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChamberMark } from '@/src/components/ChamberMark';
import { ChamberScreen } from '@/src/components/ChamberScreen';
import { ChipRow } from '@/src/components/ChipRow';
import { Field } from '@/src/components/Field';
import { GoldButton } from '@/src/components/GoldButton';
import { GradeChips } from '@/src/components/GradeChips';
import { Last5AvgStamp } from '@/src/components/Last5AvgStamp';
import { useChamber } from '@/src/context/ChamberContext';
import { CARD_TYPES, type CardType, type CollectionCard } from '@/src/models/card';
import type { CompQuery, CompsResult } from '@/src/models/comps';
import { snapGradeToChips } from '@/src/lib/grade';
import { COMP_LANGUAGES, compLanguageFromCode, languageCodeFromComp, type CompLanguage } from '@/src/lib/language';
import { resolveQueryPhotoUri } from '@/src/services/comps/queryPhoto';
import { chamber } from '@/src/theme/chamber';

export default function CompsScreen() {
  const { cards, lookupComps, pendingPhotoUri } = useChamber();
  const [cardCode, setCardCode] = useState('');
  const [printNote, setPrintNote] = useState('');
  const [language, setLanguage] = useState<CompLanguage>('Global');
  const [type, setType] = useState<CardType>('Raw');
  const [grade, setGrade] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<CompsResult | null>(null);
  const [searchedPhotoUri, setSearchedPhotoUri] = useState<string | null>(null);
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
    setGrade(card.type === 'Raw' ? '' : (card.grade ?? ''));
    setResult(null);
    setSearchedPhotoUri(null);
  };

  const runLookup = async () => {
    if (!query.cardCode) return;
    setLoading(true);
    try {
      setSearchedPhotoUri(
        resolveQueryPhotoUri(query, {
          selectedCard: cards.find((card) => card.id === selectedId) ?? null,
          cards,
          draftPhotoUri: pendingPhotoUri,
        }),
      );
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
          setGrade(snapGradeToChips(grade, next));
          setResult(null);
          setSearchedPhotoUri(null);
        }}
      />
      <GradeChips type={type} value={grade} onChange={setGrade} />
      <GoldButton label="Get comps" onPress={runLookup} loading={loading} disabled={!query.cardCode} />

      {result ? (
        <View style={styles.results}>
          <View style={styles.photo}>
            {searchedPhotoUri ? (
              <Image source={{ uri: searchedPhotoUri }} style={styles.photoImage} />
            ) : (
              <ChamberMark size={72} />
            )}
          </View>
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
  photo: {
    height: 220,
    borderRadius: 12,
    backgroundColor: chamber.bgSunken,
    borderWidth: 1,
    borderColor: chamber.panelEdge,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  bannerText: {
    color: chamber.goldSoft,
    fontSize: 14,
    lineHeight: 20,
  },
});
