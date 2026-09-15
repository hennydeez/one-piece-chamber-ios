import { StyleSheet, View } from 'react-native';
import { viewfinderRect, type FrameKind } from '@/src/lib/cardFrame';
import { chamber } from '@/src/theme/chamber';

interface Props {
  width: number;
  height: number;
  kind: FrameKind;
}

export function CardViewfinder({ width, height, kind }: Props) {
  const frame = viewfinderRect({ width, height }, kind);
  if (!frame) return null;

  const right = Math.max(0, width - frame.x - frame.width);
  const bottom = Math.max(0, height - frame.y - frame.height);

  return (
    <View style={styles.root} pointerEvents="none">
      <View style={[styles.dim, { height: frame.y }]} />
      <View style={[styles.mid, { height: frame.height }]}>
        <View style={[styles.dim, { width: frame.x }]} />
        <View style={[styles.hole, { width: frame.width, height: frame.height }]}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <View style={[styles.dim, { width: right }]} />
      </View>
      <View style={[styles.dim, { height: bottom }]} />
    </View>
  );
}

const CORNER = 22;
const THICK = 3;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
  },
  dim: {
    backgroundColor: 'rgba(10, 9, 8, 0.62)',
  },
  mid: {
    flexDirection: 'row',
  },
  hole: {
    borderWidth: 1,
    borderColor: chamber.gold,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: chamber.gold,
  },
  tl: {
    top: -1,
    left: -1,
    borderTopWidth: THICK,
    borderLeftWidth: THICK,
  },
  tr: {
    top: -1,
    right: -1,
    borderTopWidth: THICK,
    borderRightWidth: THICK,
  },
  bl: {
    bottom: -1,
    left: -1,
    borderBottomWidth: THICK,
    borderLeftWidth: THICK,
  },
  br: {
    bottom: -1,
    right: -1,
    borderBottomWidth: THICK,
    borderRightWidth: THICK,
  },
});
