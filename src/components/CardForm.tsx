import { Image, StyleSheet, Text, View } from 'react-native';
import { CARD_LANGUAGES, CARD_TYPES, isSlab, type CardDraft, type CardType } from '@/src/models/card';
import { chamber } from '@/src/theme/chamber';
import { Field } from './Field';
import { ChipRow } from './ChipRow';
import { GoldButton } from './GoldButton';
import { ChamberMark } from './ChamberMark';
import { todayIsoDate } from '@/src/lib/dates';

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
            <Text style={styles.placeholderText}>Raw card or PSA / BGS / TAG slab</Text>
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
        onSelect={(type: CardType) => set('type', type)}
      />
      <Field
        label={isSlab(draft.type) ? 'Grade' : 'Grade / condition'}
        value={draft.grade}
        placeholder={isSlab(draft.type) ? '10' : 'NM (optional)'}
        onChangeText={(grade) => set('grade', grade)}
      />
      <Field
        label="Cert #"
        value={draft.certNumber}
        placeholder={isSlab(draft.type) ? 'Slab certification number' : 'Optional'}
        keyboardType="number-pad"
        onChangeText={(certNumber) => set('certNumber', certNumber)}
      />
      <Field
        label="Print note"
        value={draft.printNote}
        placeholder="Alternate Art, Manga, Parallel…"
        onChangeText={(printNote) => set('printNote', printNote)}
        hint="Optional. Comps match print exactly, including blank."
      />
      <ChipRow
        label="Language"
        values={CARD_LANGUAGES}
        selected={(CARD_LANGUAGES as readonly string[]).includes(draft.language) ? (draft.language as (typeof CARD_LANGUAGES)[number]) : 'Other'}
        onSelect={(language) => set('language', language === 'Other' ? draft.language === 'Other' ? 'Other' : 'Other' : language)}
      />
      {draft.language === 'Other' || !(CARD_LANGUAGES as readonly string[]).includes(draft.language) ? (
        <Field
          label="Language code"
          value={draft.language === 'Other' ? '' : draft.language}
          placeholder="Custom language"
          autoCapitalize="characters"
          onChangeText={(language) => set('language', language || 'Other')}
        />
      ) : null}
      <Field
        label="Purchase date"
        value={draft.purchaseDate}
        placeholder="YYYY-MM-DD"
        onChangeText={(purchaseDate) => set('purchaseDate', purchaseDate)}
        hint="Optional."
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
        placeholder="Source, condition notes…"
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
