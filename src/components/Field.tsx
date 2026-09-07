import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { chamber } from '@/src/theme/chamber';

interface Props extends TextInputProps {
  label: string;
  hint?: string;
}

export function Field({ label, hint, style, ...inputProps }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={chamber.faint}
        style={[styles.input, style]}
        {...inputProps}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    color: chamber.goldSoft,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  input: {
    backgroundColor: chamber.bgSunken,
    borderWidth: 1,
    borderColor: chamber.panelEdge,
    color: chamber.ink,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  hint: {
    color: chamber.faint,
    fontSize: 12,
  },
});
