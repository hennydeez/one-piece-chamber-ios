import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { CardTile } from '@/src/components/CardTile';
import { ChamberMark } from '@/src/components/ChamberMark';
import { ChamberScreen } from '@/src/components/ChamberScreen';
import { GoldButton } from '@/src/components/GoldButton';
import { useChamber } from '@/src/context/ChamberContext';
import { chamber } from '@/src/theme/chamber';

export default function CollectionsScreen() {
  const { cards, ready } = useChamber();

  if (!ready) {
    return (
      <ChamberScreen title="Collections" subtitle="Loading…">
        <Text style={styles.muted}>Loading…</Text>
      </ChamberScreen>
    );
  }

  if (cards.length === 0) {
    return (
      <ChamberScreen
        title="Collections"
        subtitle="Cards you own.">
        <View style={styles.empty}>
          <ChamberMark size={88} />
          <Text style={styles.emptyTitle}>No cards yet. Add one.</Text>
          <GoldButton label="Add a card" onPress={() => router.push('/(tabs)/add')} />
        </View>
      </ChamberScreen>
    );
  }

  return (
    <ChamberScreen title="Collections" subtitle={`${cards.length} card${cards.length === 1 ? '' : 's'}`} scroll={false}>
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <CardTile card={item} onPress={() => router.push(`/card/${item.id}`)} />
          </View>
        )}
      />
    </ChamberScreen>
  );
}

const styles = StyleSheet.create({
  muted: {
    color: chamber.muted,
    lineHeight: 20,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 24,
  },
  emptyTitle: {
    color: chamber.ink,
    fontSize: 20,
    fontWeight: '700',
  },
  grid: {
    paddingBottom: 24,
    gap: 12,
  },
  row: {
    gap: 12,
  },
  cell: {
    flex: 1,
  },
});
