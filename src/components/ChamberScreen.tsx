import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chamber } from '@/src/theme/chamber';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
}

export function ChamberScreen({ title, subtitle, children, scroll = true, footer }: Props) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fill}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.kicker}>ONE PIECE CHAMBER</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {body}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: chamber.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: chamber.panelEdge,
  },
  kicker: {
    color: chamber.gold,
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    color: chamber.ink,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: chamber.muted,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  fill: {
    flex: 1,
    padding: 20,
  },
});
