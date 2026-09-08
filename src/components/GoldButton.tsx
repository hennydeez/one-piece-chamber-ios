import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { chamber } from '@/src/theme/chamber';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'gold' | 'ghost' | 'danger';
}

export function GoldButton({ label, onPress, disabled, loading, tone = 'gold' }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        tone === 'gold' && styles.gold,
        tone === 'ghost' && styles.ghost,
        tone === 'danger' && styles.danger,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {loading ? <ActivityIndicator color={chamber.bg} /> : <Text style={[styles.text, tone !== 'gold' && styles.textGhost]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  gold: {
    backgroundColor: chamber.gold,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: chamber.panelEdge,
  },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: chamber.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: chamber.bg,
    fontWeight: '800',
    letterSpacing: 0.4,
    fontSize: 15,
  },
  textGhost: {
    color: chamber.goldSoft,
  },
});
