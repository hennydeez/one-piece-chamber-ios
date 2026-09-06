import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { CardForm } from '@/src/components/CardForm';
import { ChamberScreen } from '@/src/components/ChamberScreen';
import { GoldButton } from '@/src/components/GoldButton';
import { useChamber } from '@/src/context/ChamberContext';
import { emptyDraft, type CardDraft } from '@/src/models/card';
import { expoOcrService } from '@/src/services/ocr/ocrService';
import { chamber } from '@/src/theme/chamber';

function applyOcr(draft: CardDraft, fields: Awaited<ReturnType<typeof expoOcrService.recognize>>['fields']): CardDraft {
  return {
    ...draft,
    cardCode: draft.cardCode || fields.cardCode,
    type: draft.type !== 'Raw' || !fields.type ? draft.type : fields.type,
    grade: draft.grade || fields.grade,
    certNumber: draft.certNumber || fields.certNumber,
    printNote: draft.printNote || fields.printNote,
    language: draft.language && draft.language !== 'EN' ? draft.language : fields.language || draft.language || 'EN',
  };
}

export default function AddCardScreen() {
  const { saveDraft, pendingPhotoUri, setPendingPhotoUri } = useChamber();
  const [draft, setDraft] = useState<CardDraft>(emptyDraft());
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ingestPhoto = useCallback(async (uri: string) => {
    setDraft((current) => ({ ...current, photoUri: uri }));
    setOcrMessage('Attempting OCR…');
    const attempt = await expoOcrService.recognize(uri);
    setOcrMessage(attempt.message);
    setDraft((current) => applyOcr({ ...current, photoUri: uri }, attempt.fields));
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!pendingPhotoUri) return;
      const uri = pendingPhotoUri;
      setPendingPhotoUri(null);
      void ingestPhoto(uri);
    }, [pendingPhotoUri, setPendingPhotoUri, ingestPhoto]),
  );

  const pickLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Library access', 'Photo library permission is needed to attach a card image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await ingestPhoto(result.assets[0].uri);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const card = await saveDraft(draft);
      setDraft(emptyDraft());
      setOcrMessage(null);
      router.push(`/card/${card.id}`);
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ChamberScreen
      title="Add Card"
      subtitle="Camera or library for raw cards and slabs. OCR is best-effort and fully editable."
      footer={
        <Text style={styles.footerNote}>
          Photos stay on-device. OCR never overwrites a field you already typed unless that field was empty.
        </Text>
      }>
      <CardForm
        draft={draft}
        onChange={setDraft}
        ocrMessage={ocrMessage}
        onCamera={() => router.push('/capture')}
        onLibrary={pickLibrary}
      />
      <GoldButton label="Save to chamber" onPress={save} loading={saving} />
    </ChamberScreen>
  );
}

const styles = StyleSheet.create({
  footerNote: {
    color: chamber.faint,
    fontSize: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    lineHeight: 16,
  },
});
