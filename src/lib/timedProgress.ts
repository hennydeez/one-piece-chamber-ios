/** In-flight ceiling so the bar never claims “done” before the fetch returns. */
export const TIMED_PROGRESS_CEILING = 0.9;

/** Typical SoldComps wait. Ease toward the ceiling over this window. */
export const TIMED_PROGRESS_ESTIMATE_MS = 25_000;

/**
 * Determinate fraction from elapsed time: ease-out cubic toward `ceiling`.
 * Caps at the ceiling until the caller marks the fetch complete (1).
 * Does not invent solds or fetch state — time only.
 */
export function timedProgressFraction(
  elapsedMs: number,
  options?: { estimateMs?: number; ceiling?: number },
): number {
  const estimateMs = options?.estimateMs ?? TIMED_PROGRESS_ESTIMATE_MS;
  const ceiling = options?.ceiling ?? TIMED_PROGRESS_CEILING;
  if (elapsedMs <= 0 || estimateMs <= 0 || ceiling <= 0) return 0;
  const t = Math.min(1, elapsedMs / estimateMs);
  const eased = 1 - (1 - t) ** 3;
  return Math.min(ceiling, eased * ceiling);
}

export function clampProgressFraction(fraction: number): number {
  if (!Number.isFinite(fraction)) return 0;
  return Math.min(1, Math.max(0, fraction));
}

export function progressPercent(fraction: number): number {
  return Math.round(clampProgressFraction(fraction) * 100);
}

export function formatProgressPercent(fraction: number): string {
  return `${progressPercent(fraction)}%`;
}
