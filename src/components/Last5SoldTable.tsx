import { StyleSheet, Text, View } from 'react-native';
import type { Last5Avg } from '@/src/models/comps';
import { formatAud } from '@/src/lib/money';
import { chamber } from '@/src/theme/chamber';
import { SoldRowsTable } from './SoldRowsTable';

export function Last5SoldTable({ avg }: { avg: Last5Avg }) {
  return (
    <View style={styles.card}>
      <SoldRowsTable solds={avg.solds} emptyLabel="No solds." />
      <View style={styles.avg}>
        <Text style={styles.avgLabel}>{avg.label}</Text>
        <Text style={styles.avgValue}>
          {avg.averageAud == null ? 'Unavailable' : formatAud(avg.averageAud)}
        </Text>
        <Text style={styles.n}>{avg.honestCountLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: chamber.panel,
    borderWidth: 1.5,
    borderColor: chamber.gold,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
  },
  avg: {
    marginTop: 12,
    gap: 2,
  },
  avgLabel: {
    color: chamber.gold,
    fontSize: 14,
    fontWeight: '800',
  },
  avgValue: {
    color: chamber.ink,
    fontSize: 22,
    fontWeight: '700',
  },
  n: {
    color: chamber.goldSoft,
    fontSize: 12,
  },
});
