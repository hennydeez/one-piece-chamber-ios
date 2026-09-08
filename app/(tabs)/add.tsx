import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { CardForm } from '@/src/components/CardForm';
import { ChamberScreen } from '@/src/components/ChamberScreen';
import { GoldButton } from '@/src/components/GoldButton';
import { useChamber } from '@/src/context/ChamberContext';
import { emptyDraft, type CardDraft } from '@/src/models/card';
import { applyOcrPrefill } from '@/src/services/ocr/applyOcrPrefill';
import { OCR_FAILED, expoOcrService } from '@/src/services/ocr/ocrService';

export default function AddCardScreen() {
  const { saveDraft, pendingPhotoUri, setPendingPhotoUri } = useChamber();
  const [draft, setDraft] = useState<CardDraft>(emptyDraft());
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ingestPhoto = useCallback(async (uri: string) => {
    setDraft((current) => ({ ...current, photoUri: uri }));
    setOcrMessage('Reading…');
    try {
      const attempt = await expoOcrService.recognize(uri);
      setOcrMessage(attempt.message);
      setDraft((current) => applyOcrPrefill({ ...current, photoUri: uri }, attempt.fields));
    } catch {
      setOcrMessage(OCR_FAILED);
    }
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
      Alert.alert('Photos', 'Need library access to attach a picture.');
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
      try {
        router.push(`/card/${card.id}`);
      } catch {
        router.replace('/(tabs)');
      }
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ChamberScreen title="Add Card" subtitle="Snap or pick a photo. Fix the fields if OCR misses.">
      <CardForm
        draft={draft}
        onChange={setDraft}
        ocrMessage={ocrMessage}
        onCamera={() => router.push('/capture')}
        onLibrary={pickLibrary}
      />
      <GoldButton label="Save" onPress={save} loading={saving} />
    </ChamberScreen>
  );
}
