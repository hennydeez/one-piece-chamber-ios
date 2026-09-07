import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CollectionCard } from '@/src/models/card';
import { isSlab } from '@/src/models/card';
import { chamber } from '@/src/theme/chamber';
import { ChamberMark } from './ChamberMark';

const typeColor: Record<CollectionCard['type'], string> = {
  Raw: chamber.raw,
  PSA: chamber.psa,
  BGS: chamber.bgs,
  TAG: chamber.tag,
};

export function CardTile({ card, onPress }: { card: CollectionCard; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <View style={styles.photo}>
        {card.photoUri ? (
          <Image source={{ uri: card.photoUri }} style={styles.image} />
        ) : (
          <ChamberMark size={56} />
        )}
      </View>
      <Text style={styles.code} numberOfLines={1}>
        {card.cardCode}
      </Text>
      <Text style={[styles.meta, { color: typeColor[card.type] }]} numberOfLines={1}>
        {card.type}
        {card.grade ? ` ${card.grade}` : isSlab(card.type) ? '' : ''}
        {card.language ? ` · ${card.language}` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: chamber.panel,
    borderColor: chamber.panelEdge,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    minHeight: 196,
  },
  pressed: {
    opacity: 0.85,
  },
  photo: {
    height: 120,
    borderRadius: 10,
    backgroundColor: chamber.bgSunken,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  code: {
    color: chamber.ink,
    fontWeight: '700',
    fontSize: 15,
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
});
