import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChamberScreen } from '@/src/components/ChamberScreen';
import { ChipRow } from '@/src/components/ChipRow';
import { CompsLookupProgress } from '@/src/components/CompsLookupProgress';
import { CompsPhoto } from '@/src/components/CompsPhoto';
import { CompsResults } from '@/src/components/CompsResults';
import { Field } from '@/src/components/Field';
import { GoldButton } from '@/src/components/GoldButton';
import { GradeChips } from '@/src/components/GradeChips';
import { useCompsLookup } from '@/src/components/useCompsLookup';
import { useChamber } from '@/src/context/ChamberContext';
import { snapGradeToChips } from '@/src/lib/grade';
import { COMP_LANGUAGES, compLanguageFromCode, languageCodeFromComp, type CompLanguage } from '@/src/lib/language';
import { CARD_TYPES, type CardType, type CollectionCard } from '@/src/models/card';
import type { CompQuery } from '@/src/models/comps';
import { compsViewMessage } from '@/src/services/comps/last5Avg';
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
  const [searchedPhotoUri, setSearchedPhotoUri] = useState<string | null>(null);
  const { result, view, loading, runLookup, changeView, reset } = useCompsLookup(lookupComps);

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
    reset();
    setSearchedPhotoUri(null);
  };

  const photoOptions = {
    selectedCard: cards.find((card) => card.id === selectedId) ?? null,
    cards,
    draftPhotoUri: pendingPhotoUri,
  };

  const getComps = async () => {
    if (!query.cardCode) return;
    setSearchedPhotoUri(resolveQueryPhotoUri(query, photoOptions));
    const next = await runLookup(query, 'quick');
    setSearchedPhotoUri(
      resolveQueryPhotoUri(query, {
        ...photoOptions,
        apiImageUrl: next?.imageUrl,
      }),
    );
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
          reset();
          setSearchedPhotoUri(null);
        }}
      />
      <GradeChips type={type} value={grade} onChange={setGrade} />
      <GoldButton label="Get comps" onPress={getComps} loading={loading} disabled={!query.cardCode} />
      <CompsLookupProgress loading={loading} />

      {result ? (
        <View style={styles.results}>
          <CompsPhoto
            uri={
              searchedPhotoUri ??
              resolveQueryPhotoUri(query, {
                ...photoOptions,
                apiImageUrl: result.imageUrl,
              })
            }
          />
          <Text style={styles.bannerText}>{compsViewMessage(result, view)}</Text>
          <CompsResults result={result} view={view} onViewChange={(next) => void changeView(next)} />
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
    backgroundColor: chamber.goldWash,
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
