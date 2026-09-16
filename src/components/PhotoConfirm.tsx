import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chamber } from '@/src/theme/chamber';
import { GoldButton } from './GoldButton';

interface Props {
  uri: string;
  busy?: boolean;
  onUse: () => void;
  onRetake: () => void;
}

export function PhotoConfirm({ uri, busy, onUse, onRetake }: Props) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.preview}>
        <Image source={{ uri }} style={styles.photo} resizeMode="contain" />
      </View>
      <View style={styles.dock}>
        <Text style={styles.hint}>Look good?</Text>
        <GoldButton label="Use" onPress={onUse} loading={busy} />
        <GoldButton label="Retake" tone="ghost" onPress={onRetake} disabled={busy} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: chamber.bg,
  },
  preview: {
    flex: 1,
    backgroundColor: chamber.bgSunken,
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
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
});
