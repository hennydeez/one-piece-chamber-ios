import { isSlab, type CardType } from '@/src/models/card';
import { gradeChipOptions, gradeFieldHint } from '@/src/lib/grade';
import { ChipRow } from './ChipRow';

interface Props {
  type: CardType;
  value: string;
  onChange: (grade: string) => void;
  optional?: boolean;
}

/** Per-grader grade chips. Raw hides. Tap again to clear. */
export function GradeChips({ type, value, onChange, optional }: Props) {
  if (!isSlab(type)) return null;
  return (
    <ChipRow
      key={type}
      label="Grade"
      values={gradeChipOptions(type)}
      selected={value}
      onSelect={(next) => onChange(next === value ? '' : next)}
      hint={gradeFieldHint(type, { optional })}
    />
  );
}
