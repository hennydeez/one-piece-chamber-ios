import { StyleSheet, Text, View } from 'react-native';
import type { Last5Avg } from '@/src/models/comps';
import { formatAud } from '@/src/lib/money';
import { formatDisplayDate } from '@/src/lib/dates';
import { chamber } from '@/src/theme/chamber';

export function Last5AvgStamp({ avg }: { avg: Last5Avg }) {
  return (
    <View style={styles.card}>
      <Text style={styles.channel}>{avg.channel === 'auction' ? 'Auctions' : 'Fixed / BIN solds'}</Text>
      <Text style={styles.label}>{avg.label}</Text>
      <Text style={styles.value}>
        {avg.averageAud == null ? 'Unavailable' : formatAud(avg.averageAud)}
      </Text>
      <Text style={styles.n}>{avg.honestCountLabel}</Text>
      {avg.solds.length === 0 ? (
        <Text style={styles.empty}>No completed solds in this channel. Nothing was invented.</Text>
      ) : (
        avg.solds.map((sold) => (
          <View key={sold.id} style={styles.row}>
            <Text style={styles.soldPrice}>{formatAud(sold.priceAud)}</Text>
            <Text style={styles.soldMeta}>
              {formatDisplayDate(sold.soldAt)}
              {sold.currencyOriginal !== 'AUD' && sold.fxRateToAud != null
                ? ` · FX ${sold.fxRateToAud} @ ${formatDisplayDate(sold.fxStampedAt)}`
                : ' · AUD'}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: chamber.panel,
    borderWidth: 1,
    borderColor: chamber.goldDim,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  channel: {
    color: chamber.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  label: {
    color: chamber.gold,
    fontSize: 16,
    fontWeight: '800',
  },
  value: {
    color: chamber.ink,
    fontSize: 28,
    fontWeight: '700',
  },
  n: {
    color: chamber.goldSoft,
    fontSize: 13,
    marginBottom: 6,
  },
  empty: {
    color: chamber.faint,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: chamber.panelEdge,
    paddingTop: 8,
    marginTop: 4,
  },
  soldPrice: {
    color: chamber.ink,
    fontWeight: '600',
  },
  soldMeta: {
    color: chamber.muted,
    fontSize: 12,
    marginTop: 2,
  },
});
