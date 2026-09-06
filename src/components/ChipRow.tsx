import { Pressable, StyleSheet, Text, View } from 'react-native';
import { chamber } from '@/src/theme/chamber';

interface Props<T extends string> {
  label: string;
  values: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
}

export function ChipRow<T extends string>({ label, values, selected, onSelect }: Props<T>) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {values.map((value) => {
          const active = value === selected;
          return (
            <Pressable
              key={value}
              onPress={() => onSelect(value)}
              style={[styles.chip, active && styles.chipOn]}>
              <Text style={[styles.chipText, active && styles.chipTextOn]}>{value}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: chamber.goldSoft,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: chamber.panelEdge,
    backgroundColor: chamber.bgSunken,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipOn: {
    borderColor: chamber.gold,
    backgroundColor: '#2A2314',
  },
  chipText: {
    color: chamber.muted,
    fontWeight: '600',
  },
  chipTextOn: {
    color: chamber.goldSoft,
  },
});
