import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text } from 'react-native';
import { useChamber } from '@/src/context/ChamberContext';
import { frameKindFromCardType } from '@/src/lib/cardFrame';
import { cropLibraryPhoto } from '@/src/lib/cropPhoto';
import { draftFromCard, emptyDraft, type CardDraft, type CollectionCard } from '@/src/models/card';
import {
  isOpCardCode,
  lookupCardImage,
  type CardImageOption,
} from '@/src/services/comps/lookupCardImage';
import { applyOcrPrefill } from '@/src/services/ocr/applyOcrPrefill';
import { OCR_FAILED, expoOcrService } from '@/src/services/ocr/ocrService';
import { chamber } from '@/src/theme/chamber';
import { CardForm } from './CardForm';
import { ChamberScreen } from './ChamberScreen';
import { GoldButton } from './GoldButton';
import { PhotoConfirm } from './PhotoConfirm';
import { PrintImagePicker } from './PrintImagePicker';

interface Props {
  existing?: CollectionCard;
  title: string;
  subtitle: string;
  saveLabel: string;
  onSaved: (card: CollectionCard) => void;
  showCancel?: boolean;
}

export function CardDraftEditor({
  existing,
  title,
  subtitle,
  saveLabel,
  onSaved,
  showCancel = false,
}: Props) {
  const { saveDraft, pendingPhotoUri, setPendingPhotoUri } = useChamber();
  const [draft, setDraft] = useState<CardDraft>(() => (existing ? draftFromCard(existing) : emptyDraft()));
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [photoHint, setPhotoHint] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewUri, setReviewUri] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [printOptions, setPrintOptions] = useState<CardImageOption[]>([]);
  const [pendingPrint, setPendingPrint] = useState<CardImageOption | null>(null);
  const userPhotoRef = useRef(Boolean(existing?.photoUri));

  const ingestPhoto = useCallback(async (uri: string) => {
    userPhotoRef.current = true;
    setPrintOptions([]);
    setPendingPrint(null);
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
      setPrintOptions([]);
      setPendingPrint(null);
      setDraft((current) => (current.photoUri ? { ...current, photoUri: null } : current));
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setPhotoBusy(true);
        setPrintOptions([]);
        setPendingPrint(null);
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
        if (found.options.length > 1) {
          setPrintOptions(found.options);
          setDraft((current) => ({ ...current, photoUri: null }));
        } else {
          setDraft((current) => ({ ...current, photoUri: found.imageUrl }));
        }
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
      if (!userPhotoRef.current && !draft.photoUri) {
        const found = await lookupCardImage({
          cardCode: draft.cardCode,
          type: draft.type,
          grade: draft.grade,
          language: draft.language,
          printNote: draft.printNote,
        });
        setPhotoHint(found.message);
        if (found.options.length > 1) {
          setPrintOptions(found.options);
          setSaving(false);
          return;
        }
        toSave = { ...draft, photoUri: found.imageUrl };
      }
      const card = await saveDraft(toSave, existing);
      if (!existing) {
        setDraft(emptyDraft());
        userPhotoRef.current = false;
        setPrintOptions([]);
        setPendingPrint(null);
        setPhotoHint(null);
        setOcrMessage(null);
      }
      onSaved(card);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setSaveError(message);
      Alert.alert('Could not save', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ChamberScreen title={title} subtitle={subtitle}>
      <CardForm
        draft={draft}
        onChange={(next) => {
          setSaveError(null);
          setDraft(next);
        }}
        ocrMessage={ocrMessage}
        photoHint={photoHint}
        photoBusy={photoBusy}
        belowPhoto={
          printOptions.length > 1 ? (
            <PrintImagePicker
              options={printOptions}
              selected={pendingPrint}
              onSelect={setPendingPrint}
              onConfirm={() => {
                if (!pendingPrint) return;
                setDraft((current) => ({ ...current, photoUri: pendingPrint.imageUrl }));
                setPhotoHint(pendingPrint.label);
                setPrintOptions([]);
                setPendingPrint(null);
              }}
              onCancel={() => setPendingPrint(null)}
            />
          ) : null
        }
        onCamera={() =>
          router.push({
            pathname: '/capture',
            params: { frame: frameKindFromCardType(draft.type) },
          })
        }
        onLibrary={pickLibrary}
      />
      {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
      <GoldButton label={saveLabel} onPress={save} loading={saving} />
      {showCancel ? <GoldButton label="Cancel" tone="ghost" onPress={() => router.back()} /> : null}
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
