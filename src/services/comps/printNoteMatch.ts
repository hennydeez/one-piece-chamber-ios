/** Token helpers so a typed print note can match a catalog print label. */

const STOP = new Set([
  'a',
  'an',
  'and',
  'art',
  'card',
  'for',
  'in',
  'of',
  'print',
  'printing',
  'the',
  'to',
  'version',
  'vol',
]);

const SYNONYMS: Record<string, string[]> = {
  aa: ['aa', 'alt', 'alternate'],
  alt: ['aa', 'alt', 'alternate'],
  alternate: ['aa', 'alt', 'alternate'],
  championship: ['championship', 'cs'],
  cs: ['championship', 'cs'],
  fa: ['fa', 'full'],
  full: ['fa', 'full'],
  manga: ['manga'],
  para: ['para', 'parallel'],
  parallel: ['para', 'parallel'],
  sp: ['sp', 'special'],
  special: ['sp', 'special'],
};

export function printTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[–—−]/g, '-')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function expandToken(token: string): string[] {
  return SYNONYMS[token] ?? [token];
}

export function printTokenSet(value: string): Set<string> {
  const out = new Set<string>();
  for (const token of printTokens(value)) {
    for (const syn of expandToken(token)) out.add(syn);
  }
  return out;
}

/**
 * True when every meaningful print-note token appears on the catalog label.
 * Blank note matches anything (caller decides whether to filter).
 */
export function printNoteMatchesLabel(printNote: string | null | undefined, label: string): boolean {
  const required = printTokens(printNote ?? '').filter((token) => !STOP.has(token));
  if (required.length === 0) return true;
  const labels = printTokenSet(label);
  return required.every((token) => expandToken(token).some((syn) => labels.has(syn)));
}
