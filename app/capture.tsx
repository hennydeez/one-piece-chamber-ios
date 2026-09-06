import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GoldButton } from '@/src/components/GoldButton';
import { useChamber } from '@/src/context/ChamberContext';
import { chamber } from '@/src/theme/chamber';

export default function CaptureScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { setPendingPhotoUri } = useChamber();
  const [busy, setBusy] = useState(false);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          Camera access is used to photograph raw cards and PSA / BGS / TAG slabs.
        </Text>
        <GoldButton label="Allow camera" onPress={() => void requestPermission()} />
        <GoldButton label="Close" tone="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const take = async () => {
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setPendingPhotoUri(photo.uri);
        router.back();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.dock}>
        <Text style={styles.hint}>Frame the card code, grade, and cert if the slab shows them.</Text>
        <GoldButton label={busy ? 'Capturing…' : 'Capture'} onPress={take} loading={busy} />
        <GoldButton label="Cancel" tone="ghost" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: chamber.bg,
  },
  camera: {
    flex: 1,
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
