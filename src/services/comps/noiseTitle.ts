/**
 * Last-5 noise titles from live solds. Only inspects API `title`.
 * Never invents a title. Missing / blank title is not noise — keep the row.
 */

const NOISE_PHRASES = ['playset', 'lot of'] as const;

export function isNoiseTitle(title: string | null | undefined): boolean {
  if (title == null) return false;
  const value = title.trim().toLowerCase();
  if (!value) return false;
  if (NOISE_PHRASES.some((phrase) => value.includes(phrase))) return true;
  if (/\bbundle\b/.test(value)) return true;
  if (/\bx4\b/.test(value)) return true;
  return false;
}

/** Drop obvious lot / playset / bundle titles. Untitled rows stay. */
export function withoutNoiseTitles<T extends { title?: string | null }>(solds: T[]): T[] {
  return solds.filter((sold) => !isNoiseTitle(sold.title));
}
