import { StyleSheet, View } from 'react-native';
import { chamber } from '@/src/theme/chamber';

/** Original geometric vault mark — not One Piece IP. */
export function ChamberMark({ size = 72 }: { size?: number }) {
  const door = size * 0.62;
  return (
    <View style={[styles.outer, { width: size, height: size, borderRadius: size * 0.18 }]}>
      <View style={[styles.arch, { width: door, height: door * 1.05, borderRadius: door * 0.18 }]}>
        <View style={styles.bar} />
        <View style={[styles.knob, { right: door * 0.14, top: door * 0.42 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1.5,
    borderColor: chamber.gold,
    backgroundColor: chamber.bgSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arch: {
    borderWidth: 1.5,
    borderColor: chamber.goldDim,
    backgroundColor: chamber.panel,
  },
  bar: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    top: '22%',
    height: 2,
    backgroundColor: chamber.goldDim,
  },
  knob: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: chamber.gold,
  },
});
