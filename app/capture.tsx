import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { CardViewfinder } from '@/src/components/CardViewfinder';
import { ChipRow } from '@/src/components/ChipRow';
import { GoldButton } from '@/src/components/GoldButton';
import { PhotoConfirm } from '@/src/components/PhotoConfirm';
import { useChamber } from '@/src/context/ChamberContext';
import { parseFrameKind, type FrameKind, type Size } from '@/src/lib/cardFrame';
import { cropCameraPhoto } from '@/src/lib/cropPhoto';
import { chamber } from '@/src/theme/chamber';

const FRAME_CHIPS = ['Raw', 'Slab'] as const;

export default function CaptureScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { setPendingPhotoUri } = useChamber();
  const params = useLocalSearchParams<{ frame?: string }>();
  const [kind, setKind] = useState<FrameKind>(() => parseFrameKind(params.frame));
  const [preview, setPreview] = useState<Size | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewUri, setReviewUri] = useState<string | null>(null);

  const onPreviewLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPreview({ width, height });
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Loading…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Need the camera for a photo.</Text>
        <GoldButton label="Allow camera" onPress={() => void requestPermission()} />
        <GoldButton label="Close" tone="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const take = async () => {
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) return;
      const cropped = await cropCameraPhoto({
        uri: photo.uri,
        kind,
        imageWidth: photo.width,
        imageHeight: photo.height,
        preview,
      });
      setReviewUri(cropped);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.cameraWrap} onLayout={onPreviewLayout}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        {reviewUri || !preview ? null : (
          <CardViewfinder width={preview.width} height={preview.height} kind={kind} />
        )}
      </View>
      <View style={styles.dock}>
        <ChipRow
          label="Frame"
          values={FRAME_CHIPS}
          selected={kind === 'slab' ? 'Slab' : 'Raw'}
          onSelect={(value) => setKind(value === 'Slab' ? 'slab' : 'raw')}
        />
        <Text style={styles.hint}>
          {kind === 'slab' ? 'Fit the slab in the frame.' : 'Fit the card in the frame.'}
        </Text>
        <GoldButton label={busy ? 'Capturing…' : 'Capture'} onPress={take} loading={busy} />
        <GoldButton label="Cancel" tone="ghost" onPress={() => router.back()} />
      </View>
      {reviewUri ? (
        <View style={styles.confirm}>
          <PhotoConfirm
            uri={reviewUri}
            busy={busy}
            onUse={() => {
              setPendingPhotoUri(reviewUri);
              router.back();
            }}
            onRetake={() => setReviewUri(null)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: chamber.bg,
  },
  cameraWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  dock: {
    padding: 16,
    gap: 10,
    backgroundColor: chamber.bgElevated,
  },
  hint: {
    color: chamber.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  confirm: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
  center: {
    flex: 1,
    backgroundColor: chamber.bg,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  text: {
    color: chamber.ink,
    textAlign: 'center',
    lineHeight: 22,
  },
});
