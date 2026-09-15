import { StyleSheet, Text, View } from 'react-native';
import type { MonthBucket } from '@/src/models/comps';
import { formatAud } from '@/src/lib/money';
import { chamber } from '@/src/theme/chamber';
import { SoldRowsTable } from './SoldRowsTable';

export function MonthlySoldSections({ months }: { months: MonthBucket[] }) {
  return (
    <View style={styles.wrap}>
      {months.map((month) => (
        <View key={month.key} style={styles.card}>
          <Text style={styles.month}>{month.label}</Text>
          <Text style={styles.meta}>
            n={month.n}
            {' · '}
            {month.averageAud == null ? 'Unavailable' : `${formatAud(month.averageAud)} avg`}
          </Text>
          <SoldRowsTable solds={month.solds} emptyLabel="No solds." />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  card: {
    backgroundColor: chamber.panel,
    borderWidth: 1,
    borderColor: chamber.goldDim,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 4,
  },
  month: {
    color: chamber.gold,
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    color: chamber.goldSoft,
    fontSize: 13,
    marginBottom: 8,
  },
});
