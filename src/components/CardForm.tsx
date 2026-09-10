import { Image, StyleSheet, Text, View } from 'react-native';
import { CARD_TYPES, isSlab, type CardDraft, type CardType } from '@/src/models/card';
import { chamber } from '@/src/theme/chamber';
import { Field } from './Field';
import { ChipRow } from './ChipRow';
import { GoldButton } from './GoldButton';
import { ChamberMark } from './ChamberMark';
import { todayIsoDate } from '@/src/lib/dates';
import { snapGradeToChips } from '@/src/lib/grade';
import { COMP_LANGUAGES, compLanguageFromCode, languageCodeFromComp } from '@/src/lib/language';
import { GradeChips } from './GradeChips';

interface Props {
  draft: CardDraft;
  onChange: (next: CardDraft) => void;
  ocrMessage?: string | null;
  onCamera: () => void;
  onLibrary: () => void;
}

export function CardForm({ draft, onChange, ocrMessage, onCamera, onLibrary }: Props) {
  const set = <K extends keyof CardDraft>(key: K, value: CardDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <View style={styles.form}>
      <View style={styles.photoBlock}>
        {draft.photoUri ? (
          <Image source={{ uri: draft.photoUri }} style={styles.photo} />
        ) : (
          <View style={styles.placeholder}>
            <ChamberMark size={64} />
            <Text style={styles.placeholderText}>Raw card or slab</Text>
          </View>
        )}
        <View style={styles.photoActions}>
          <View style={styles.photoBtn}>
            <GoldButton label="Camera" onPress={onCamera} tone="ghost" />
          </View>
          <View style={styles.photoBtn}>
            <GoldButton label="Library" onPress={onLibrary} tone="ghost" />
          </View>
        </View>
        {ocrMessage ? <Text style={styles.ocr}>{ocrMessage}</Text> : null}
      </View>

      <Field
        label="Card code"
        value={draft.cardCode}
        autoCapitalize="characters"
        placeholder="OP01-001"
        onChangeText={(cardCode) => set('cardCode', cardCode)}
      />
      <ChipRow
        label="Type"
        values={CARD_TYPES}
        selected={draft.type}
        onSelect={(type: CardType) => {
          onChange({
            ...draft,
            type,
            grade: snapGradeToChips(draft.grade, type),
          });
        }}
      />
      <GradeChips
        type={draft.type}
        value={draft.grade}
        optional
        onChange={(grade) => set('grade', grade)}
      />
      {isSlab(draft.type) ? (
        <Field
          label="Cert #"
          value={draft.certNumber}
          placeholder="Cert number"
          keyboardType="number-pad"
          onChangeText={(certNumber) => set('certNumber', certNumber)}
        />
      ) : null}
      <Field
        label="Print note"
        value={draft.printNote}
        placeholder="Alt art, manga…"
        onChangeText={(printNote) => set('printNote', printNote)}
      />
      <ChipRow
        label="Language"
        values={COMP_LANGUAGES}
        selected={compLanguageFromCode(draft.language)}
        onSelect={(option) => set('language', languageCodeFromComp(option))}
      />
      <Field
        label="Purchase date"
        value={draft.purchaseDate}
        placeholder="YYYY-MM-DD"
        onChangeText={(purchaseDate) => set('purchaseDate', purchaseDate)}
      />
      <GoldButton label="Use today’s date" tone="ghost" onPress={() => set('purchaseDate', todayIsoDate())} />
      <Field
        label="Purchase price (AUD)"
        value={draft.purchasePriceAud}
        placeholder="0.00"
        keyboardType="decimal-pad"
        onChangeText={(purchasePriceAud) => set('purchasePriceAud', purchasePriceAud)}
      />
      <Field
        label="Notes"
        value={draft.notes}
        placeholder="Source, condition…"
        multiline
        style={styles.notes}
        onChangeText={(notes) => set('notes', notes)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  photoBlock: {
    gap: 10,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: chamber.bgSunken,
  },
  placeholder: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: chamber.panelEdge,
    backgroundColor: chamber.bgSunken,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderText: {
    color: chamber.muted,
    fontSize: 13,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  photoBtn: {
    flex: 1,
  },
  ocr: {
    color: chamber.goldSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  notes: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
