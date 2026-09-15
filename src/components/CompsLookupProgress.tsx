import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatProgressPercent, progressPercent, timedProgressFraction } from '@/src/lib/timedProgress';
import { chamber } from '@/src/theme/chamber';

const TICK_MS = 100;
const FINISH_HOLD_MS = 350;

export function useCompsLookupProgress(loading: boolean) {
  const [fraction, setFraction] = useState(0);
  const [visible, setVisible] = useState(false);
  const wasLoading = useRef(false);

  useEffect(() => {
    if (loading) {
      wasLoading.current = true;
      setVisible(true);
      setFraction(0);
      const started = Date.now();
      const id = setInterval(() => {
        setFraction(timedProgressFraction(Date.now() - started));
      }, TICK_MS);
      return () => clearInterval(id);
    }

    if (wasLoading.current) {
      wasLoading.current = false;
      setFraction(1);
      const hide = setTimeout(() => {
        setVisible(false);
        setFraction(0);
      }, FINISH_HOLD_MS);
      return () => clearTimeout(hide);
    }
  }, [loading]);

  return { visible, fraction, percentLabel: formatProgressPercent(fraction) };
}

/** Determinate Get comps bar. Time-based only — never invents solds. */
export function CompsLookupProgress({ loading }: { loading: boolean }) {
  const { visible, fraction } = useCompsLookupProgress(loading);
  if (!visible) return null;

  const percent = progressPercent(fraction);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Fetching solds"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.copy}>Fetching solds…</Text>
        <Text style={styles.percent}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copy: {
    color: chamber.goldSoft,
    fontSize: 13,
  },
  percent: {
    color: chamber.gold,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: chamber.bgSunken,
    borderWidth: 1,
    borderColor: chamber.panelEdge,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: chamber.gold,
  },
});
