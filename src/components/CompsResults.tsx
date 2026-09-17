import { StyleSheet, View } from 'react-native';
import type { CompsLookupMode, CompsResult } from '@/src/models/comps';
import { ChipRow } from './ChipRow';
import { Last5SoldTable } from './Last5SoldTable';
import { MonthlyAvgChart } from './MonthlyAvgChart';
import { MonthlySoldSections } from './MonthlySoldSections';

const VIEW_CHIPS = ['Quick', 'Last 6 months'] as const;
type ViewChip = (typeof VIEW_CHIPS)[number];

function chipFor(mode: CompsLookupMode): ViewChip {
  return mode === 'detailed' ? 'Last 6 months' : 'Quick';
}

export function CompsResults({
  result,
  view,
  onViewChange,
}: {
  result: CompsResult;
  view: CompsLookupMode;
  onViewChange: (view: CompsLookupMode) => void;
}) {
  return (
    <View style={styles.wrap}>
      <ChipRow
        label="View"
        values={VIEW_CHIPS}
        selected={chipFor(view)}
        onSelect={(value) => onViewChange(value === 'Last 6 months' ? 'detailed' : 'quick')}
      />
      {view === 'quick' ? (
        <Last5SoldTable avg={result.last5} />
      ) : (
        <View style={styles.detailed}>
          <MonthlyAvgChart months={result.months} />
          <MonthlySoldSections months={result.months} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  detailed: {
    gap: 12,
  },
});
