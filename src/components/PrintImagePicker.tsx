import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CardImageOption } from '@/src/services/comps/lookupCardImage';
import { chamber } from '@/src/theme/chamber';
import { GoldButton } from './GoldButton';

interface Props {
  options: CardImageOption[];
  selected: CardImageOption | null;
  onSelect: (option: CardImageOption) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PrintImagePicker({ options, selected, onSelect, onConfirm, onCancel }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>Pick a printing</Text>
      <View style={styles.list}>
        {options.map((option) => {
          const active = selected?.imageUrl === option.imageUrl;
          return (
            <Pressable
              key={option.imageUrl}
              onPress={() => onSelect(option)}
              style={[styles.row, active && styles.rowActive]}>
              <Image source={{ uri: option.imageUrl }} style={styles.thumb} resizeMode="contain" />
              <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {selected ? (
        <View style={styles.actions}>
          <View style={styles.action}>
            <GoldButton label="Use" onPress={onConfirm} />
          </View>
          <View style={styles.action}>
            <GoldButton label="Cancel" tone="ghost" onPress={onCancel} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  hint: {
    color: chamber.muted,
    fontSize: 13,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: chamber.panelEdge,
    backgroundColor: chamber.bgElevated,
  },
  rowActive: {
    borderColor: chamber.gold,
    backgroundColor: chamber.goldWash,
  },
  thumb: {
    width: 52,
    height: 72,
    borderRadius: 6,
    backgroundColor: chamber.bgSunken,
  },
  label: {
    flex: 1,
    color: chamber.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: chamber.goldSoft,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
  },
});
