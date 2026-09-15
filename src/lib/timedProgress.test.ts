import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  TIMED_PROGRESS_CEILING,
  TIMED_PROGRESS_ESTIMATE_MS,
  formatProgressPercent,
  progressPercent,
  timedProgressFraction,
} from './timedProgress';

describe('timedProgressFraction', () => {
  it('starts at 0', () => {
    assert.equal(timedProgressFraction(0), 0);
    assert.equal(timedProgressFraction(-10), 0);
  });

  it('eases toward the ceiling over the estimate, never past it', () => {
    const mid = timedProgressFraction(TIMED_PROGRESS_ESTIMATE_MS / 2);
    const late = timedProgressFraction(TIMED_PROGRESS_ESTIMATE_MS);
    const after = timedProgressFraction(TIMED_PROGRESS_ESTIMATE_MS * 3);
    assert.ok(mid > 0.5 && mid < TIMED_PROGRESS_CEILING);
    assert.equal(late, TIMED_PROGRESS_CEILING);
    assert.equal(after, TIMED_PROGRESS_CEILING);
  });

  it('moves quickly at first (ease-out), then slows', () => {
    const first = timedProgressFraction(1_000);
    const second = timedProgressFraction(2_000);
    const lastTick = timedProgressFraction(24_000);
    const done = timedProgressFraction(25_000);
    assert.ok(second - first < first);
    assert.ok(done - lastTick < first);
  });

  it('accepts a custom estimate and ceiling', () => {
    assert.equal(timedProgressFraction(1_000, { estimateMs: 1_000, ceiling: 0.5 }), 0.5);
    assert.equal(timedProgressFraction(0, { estimateMs: 1_000, ceiling: 0.5 }), 0);
  });
});

describe('progressPercent', () => {
  it('rounds a clamped 0–100 label', () => {
    assert.equal(progressPercent(0), 0);
    assert.equal(progressPercent(0.904), 90);
    assert.equal(progressPercent(1), 100);
    assert.equal(progressPercent(1.4), 100);
    assert.equal(progressPercent(Number.NaN), 0);
    assert.equal(formatProgressPercent(1), '100%');
  });
});
