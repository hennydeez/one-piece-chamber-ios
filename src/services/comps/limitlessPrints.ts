export interface CatalogPrint {
  /** Limitless `?v=` index. 0 is the base / current print. */
  index: number;
  label: string;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Read print names + variant indices from a Limitless card page.
 * Does not invent prints — empty when the table is missing.
 */
export function parseLimitlessPrints(html: string, cardCode: string): CatalogPrint[] {
  const code = cardCode.trim().toUpperCase();
  if (!code) return [];

  const table = html.match(/<table class="card-prints-versions">([\s\S]*?)<\/table>/i);
  if (!table) return [];

  const prints: CatalogPrint[] = [];
  const seen = new Set<number>();
  const rows = table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);

  for (const row of rows) {
    const body = row[1];
    if (/<th\b/i.test(body)) continue;

    const firstLink = body.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i);
    if (!firstLink) continue;

    const suffix = (firstLink[1].match(
      /<span class="prints-table-card-number">\s*([^<]*)<\/span>/i,
    )?.[1] ?? '').trim();
    const name = stripTags(firstLink[1]);
    if (!name) continue;
    const label = suffix && !new RegExp(`\\b${suffix}\\b`, 'i').test(name) ? `${name} ${suffix}` : name;

    const href = body.match(new RegExp(`href="[^"]*${code}(?:\\?v=(\\d+))?"`, 'i'));
    const index = href?.[1] ? Number(href[1]) : 0;
    if (!Number.isFinite(index) || seen.has(index)) continue;

    seen.add(index);
    prints.push({ index, label });
  }

  return prints.sort((a, b) => a.index - b.index);
}

export function printVariantCode(baseCode: string, index: number): string {
  return index <= 0 ? baseCode : `${baseCode}_p${index}`;
}

export function fallbackPrintSlots(): CatalogPrint[] {
  return [
    { index: 0, label: 'Base' },
    ...Array.from({ length: 8 }, (_, i) => ({ index: i + 1, label: `p${i + 1}` })),
  ];
}
