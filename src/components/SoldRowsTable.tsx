import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CompSold } from '@/src/models/comps';
import { formatDisplayDate } from '@/src/lib/dates';
import { formatAud } from '@/src/lib/money';
import { openExternalUrl } from '@/src/lib/openUrl';
import { isSampleSold, resolveSourceUrl } from '@/src/services/comps/sourceLink';
import { chamber } from '@/src/theme/chamber';

function channelCell(sold: CompSold): 'BIN' | 'Auc' {
  return sold.channel === 'auction' ? 'Auc' : 'BIN';
}

export function SoldRowsTable({
  solds,
  emptyLabel = 'No solds.',
}: {
  solds: CompSold[];
  emptyLabel?: string;
}) {
  const rows = solds.filter((row) => !isSampleSold(row));

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.head, styles.dateCol]}>Date</Text>
        <Text style={[styles.head, styles.audCol]}>AUD</Text>
        <Text style={[styles.head, styles.chCol]}>BIN/Auc</Text>
        <Text style={[styles.head, styles.linkCol]}>eBay</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        rows.map((sold) => {
          const url = resolveSourceUrl(sold);
          const title = sold.title?.trim();
          return (
            <View key={sold.id} style={styles.row}>
              <View style={styles.dateCol}>
                <Text style={styles.date}>{formatDisplayDate(sold.soldAt)}</Text>
                {title ? (
                  <Text style={styles.title} numberOfLines={2}>
                    {title}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.cell, styles.audCol]}>{formatAud(sold.priceAud)}</Text>
              <Text style={[styles.cell, styles.chCol]}>{channelCell(sold)}</Text>
              {url ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="eBay"
                  onPress={() => void openExternalUrl(url)}
                  style={styles.linkHit}>
                  <Text style={styles.link}>eBay</Text>
                </Pressable>
              ) : (
                <Text style={[styles.noLink, styles.linkCol]}>—</Text>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: chamber.panelEdge,
    gap: 6,
  },
  head: {
    color: chamber.faint,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: chamber.panelEdge,
    gap: 6,
  },
  dateCol: {
    flex: 1.5,
    minWidth: 0,
  },
  audCol: {
    width: 72,
    textAlign: 'right',
  },
  chCol: {
    width: 52,
    textAlign: 'center',
  },
  linkCol: {
    width: 40,
    textAlign: 'right',
  },
  date: {
    color: chamber.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    color: chamber.muted,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  cell: {
    color: chamber.ink,
    fontSize: 13,
    fontWeight: '600',
    paddingTop: 1,
  },
  linkHit: {
    width: 40,
    minHeight: 32,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 1,
  },
  link: {
    color: chamber.gold,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  noLink: {
    color: chamber.faint,
    fontSize: 13,
    paddingTop: 1,
  },
  empty: {
    color: chamber.muted,
    fontSize: 13,
    paddingVertical: 10,
  },
});
