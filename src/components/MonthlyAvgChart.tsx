import { StyleSheet, Text, View } from 'react-native';
import type { MonthBucket } from '@/src/models/comps';
import { chartBarsFromMonths } from '@/src/services/comps/monthBuckets';
import { chamber } from '@/src/theme/chamber';

const BAR_MAX_HEIGHT = 112;

export function MonthlyAvgChart({ months }: { months: MonthBucket[] }) {
  const bars = chartBarsFromMonths(months);
  const summary = bars
    .map((bar) => `${bar.fullLabel} ${bar.n === 0 ? 'empty' : bar.valueLabel}`)
    .join(', ');

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Monthly avg AUD. ${summary}`}
      style={styles.card}>
      <Text style={styles.title}>Monthly avg (AUD)</Text>
      <View style={styles.plot}>
        {bars.map((bar) => {
          const height = Math.round(bar.heightRatio * BAR_MAX_HEIGHT);
          return (
            <View key={bar.key} style={styles.col}>
              <Text style={styles.value} numberOfLines={1}>
                {bar.valueLabel}
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(height, bar.n === 0 ? 3 : 6),
                      backgroundColor: bar.n === 0 ? chamber.panelEdge : chamber.gold,
                    },
                  ]}
                />
              </View>
              <Text style={styles.tick} numberOfLines={1}>
                {bar.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: chamber.panel,
    borderWidth: 1,
    borderColor: chamber.goldDim,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  title: {
    color: chamber.gold,
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 2,
  },
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    minHeight: BAR_MAX_HEIGHT + 44,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  value: {
    color: chamber.goldSoft,
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: BAR_MAX_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    maxWidth: 28,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  tick: {
    color: chamber.faint,
    fontSize: 10,
    fontWeight: '600',
  },
});
