import { Image, StyleSheet, View } from 'react-native';
import { chamber } from '@/src/theme/chamber';
import { ChamberMark } from './ChamberMark';

export function CompsPhoto({ uri, height = 220 }: { uri: string | null; height?: number }) {
  return (
    <View style={[styles.photo, { height }]}>
      {uri ? <Image source={{ uri }} style={styles.photoImage} resizeMode="contain" /> : <ChamberMark size={72} />}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    borderRadius: 12,
    backgroundColor: chamber.bgSunken,
    borderWidth: 1.5,
    borderColor: chamber.panelEdge,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
});
