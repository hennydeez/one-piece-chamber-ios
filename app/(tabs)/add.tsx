import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text } from 'react-native';
import { CardForm } from '@/src/components/CardForm';
import { ChamberScreen } from '@/src/components/ChamberScreen';
import { GoldButton } from '@/src/components/GoldButton';
import { PhotoConfirm } from '@/src/components/PhotoConfirm';
import { useChamber } from '@/src/context/ChamberContext';
import { frameKindFromCardType } from '@/src/lib/cardFrame';
import { cropLibraryPhoto } from '@/src/lib/cropPhoto';
import { emptyDraft, type CardDraft } from '@/src/models/card';
import { isOpCardCode, lookupCardImage } from '@/src/services/comps/lookupCardImage';
import { applyOcrPrefill } from '@/src/services/ocr/applyOcrPrefill';
import { OCR_FAILED, expoOcrService } from '@/src/services/ocr/ocrService';
import { chamber } from '@/src/theme/chamber';

export default function AddCardScreen() {
  const { saveDraft, pendingPhotoUri, setPendingPhotoUri } = useChamber();
  const [draft, setDraft] = useState<CardDraft>(emptyDraft());
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [photoHint, setPhotoHint] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewUri, setReviewUri] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const userPhotoRef = useRef(false);

  const ingestPhoto = useCallback(async (uri: string) => {
    userPhotoRef.current = true;
    setPhotoHint(null);
    setPhotoBusy(false);
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
    const asset = result.assets?.[0];
    if (result.canceled || !asset?.uri) return;

    setReviewBusy(true);
    setReviewUri(asset.uri);
    try {
      const cropped = await cropLibraryPhoto({
        uri: asset.uri,
        kind: frameKindFromCardType(draft.type),
        imageWidth: asset.width,
        imageHeight: asset.height,
      });
      setReviewUri(cropped);
    } finally {
      setReviewBusy(false);
    }
  };

  useEffect(() => {
    if (userPhotoRef.current) return;
    const cardCode = draft.cardCode.trim();
    if (!isOpCardCode(cardCode)) {
      setPhotoHint(null);
      setPhotoBusy(false);
      setDraft((current) => (current.photoUri ? { ...current, photoUri: null } : current));
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setPhotoBusy(true);
        setDraft((current) => (current.photoUri ? { ...current, photoUri: null } : current));
        const found = await lookupCardImage({
          cardCode,
          type: draft.type,
          grade: draft.grade,
          language: draft.language,
          printNote: draft.printNote,
        });
        if (cancelled || userPhotoRef.current) return;
        setPhotoHint(found.message);
        setDraft((current) => ({ ...current, photoUri: found.imageUrl }));
        setPhotoBusy(false);
      })();
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft.cardCode, draft.type, draft.grade, draft.language, draft.printNote]);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      let toSave = draft;
      if (!userPhotoRef.current) {
        const found = await lookupCardImage({
          cardCode: draft.cardCode,
          type: draft.type,
          grade: draft.grade,
          language: draft.language,
          printNote: draft.printNote,
        });
        setPhotoHint(found.message);
        toSave = { ...draft, photoUri: found.imageUrl };
      }
      const card = await saveDraft(toSave);
      setDraft(emptyDraft());
      userPhotoRef.current = false;
      setPhotoHint(null);
      setOcrMessage(null);
      try {
        router.push(`/card/${card.id}`);
      } catch {
        router.replace('/(tabs)');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setSaveError(message);
      Alert.alert('Could not save', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ChamberScreen title="Add Card" subtitle="Snap a photo, or type a code to find card art.">
      <CardForm
        draft={draft}
        onChange={(next) => {
          setSaveError(null);
          setDraft(next);
        }}
        ocrMessage={ocrMessage}
        photoHint={photoHint}
        photoBusy={photoBusy}
        onCamera={() =>
          router.push({
            pathname: '/capture',
            params: { frame: frameKindFromCardType(draft.type) },
          })
        }
        onLibrary={pickLibrary}
      />
      {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
      <GoldButton label="Save" onPress={save} loading={saving} />
      <Modal
        visible={reviewUri != null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setReviewUri(null)}>
        {reviewUri ? (
          <PhotoConfirm
            uri={reviewUri}
            busy={reviewBusy}
            onUse={() => {
              const uri = reviewUri;
              setReviewUri(null);
              void ingestPhoto(uri);
            }}
            onRetake={() => {
              setReviewUri(null);
              void pickLibrary();
            }}
          />
        ) : null}
      </Modal>
    </ChamberScreen>
  );
}

const styles = StyleSheet.create({
  saveError: {
    color: chamber.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
