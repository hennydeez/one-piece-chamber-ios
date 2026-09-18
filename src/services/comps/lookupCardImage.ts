import { isSlab, type CardType } from '../../models/card';
import { imageUrlFromPayload, readImageUrl } from './imageUrl';

/** Same baked-in Chamber comps.php as createCompsService — imageUrl only. */
const DEFAULT_COMPS_IMAGE_ENDPOINT =
  'https://whitesmoke-woodpecker-609130.hostingersite.com/api/comps.php';

export const LIMITLESS_CDN = 'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece';
export const OFFICIAL_EN_CARD_DIR = 'https://en.onepiece-cardgame.com/images/cardlist/card';

/** Short timeout — comps solds can take 10–60s; we only want an imageUrl if one is already there. */
export const CARD_IMAGE_COMPS_TIMEOUT_MS = 4_000;

export type CardImageSource = 'comps' | 'limitless' | 'official';

export interface CardImageLookup {
  imageUrl: string | null;
  kind: 'slab' | 'raw' | null;
  source: CardImageSource | null;
  message: string;
}

export interface CardImageQuery {
  cardCode: string;
  type: CardType;
  grade?: string | null;
  language?: string | null;
  printNote?: string | null;
}

export interface ParsedOpCardCode {
  /** Canonical code, e.g. OP01-001 or OP01-001_p1. */
  code: string;
  set: string;
  /** Base code without a _pN suffix. */
  baseCode: string;
}

const OP_CODE = /^([A-Z]{1,6}\d{0,3})-(\d{2,4})(?:_P(\d+))?$/i;

export function parseOpCardCode(raw: string): ParsedOpCardCode | null {
  const trimmed = raw.trim().toUpperCase();
  const match = trimmed.match(OP_CODE);
  if (!match) return null;
  const set = match[1].toUpperCase();
  const number = match[2];
  const parallel = match[3] ? `_p${match[3]}` : '';
  const baseCode = `${set}-${number}`;
  return { code: `${baseCode}${parallel}`, set, baseCode };
}

export function isOpCardCode(raw: string): boolean {
  return parseOpCardCode(raw) != null;
}

function wantsParallelArt(printNote: string | null | undefined): boolean {
  return /alt|para|manga|\baa\b|_p\d/i.test(printNote ?? '');
}

function catalogLanguage(language: string | null | undefined): 'EN' | 'JP' {
  return (language ?? 'EN').trim().toUpperCase() === 'JP' ? 'JP' : 'EN';
}

/**
 * Candidate raw/card-art URLs, preference order.
 * These are not confirmed — callers must HEAD/GET before using one.
 */
export function catalogRawImageCandidates(
  cardCode: string,
  language?: string | null,
  printNote?: string | null,
): string[] {
  const parsed = parseOpCardCode(cardCode);
  if (!parsed) return [];

  const lang = catalogLanguage(language);
  const variants: string[] = [];
  if (parsed.code !== parsed.baseCode) {
    variants.push(parsed.code);
  } else if (wantsParallelArt(printNote)) {
    variants.push(`${parsed.baseCode}_p1`, `${parsed.baseCode}_p2`, parsed.baseCode);
  } else {
    variants.push(parsed.baseCode);
  }

  const urls: string[] = [];
  const seen = new Set<string>();
  const add = (url: string) => {
    if (seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };

  for (const variant of variants) {
    add(`${LIMITLESS_CDN}/${parsed.set}/${variant}_${lang}.webp`);
    if (lang !== 'EN') add(`${LIMITLESS_CDN}/${parsed.set}/${variant}_EN.webp`);
    add(`${OFFICIAL_EN_CARD_DIR}/${variant}.png`);
  }

  return urls;
}

function isImageContentType(value: string | null): boolean {
  return (value ?? '').toLowerCase().startsWith('image/');
}

/**
 * Confirm a URL is a real image. Never returns an unconfirmed / invented URL.
 */
export async function confirmImageUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const safe = readImageUrl(url);
  if (!safe || !/^https?:\/\//i.test(safe)) return null;

  const headers = {
    Accept: 'image/*',
    Referer: 'https://en.onepiece-cardgame.com/',
  };

  try {
    const head = await fetchImpl(safe, { method: 'HEAD', headers });
    if (head.ok && isImageContentType(head.headers.get('content-type'))) return safe;
  } catch {
    // Some hosts reject HEAD — try GET.
  }

  try {
    const get = await fetchImpl(safe, { method: 'GET', headers });
    if (get.ok && isImageContentType(get.headers.get('content-type'))) return safe;
  } catch {
    return null;
  }

  return null;
}

export async function firstConfirmedImageUrl(
  urls: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<{ url: string; source: CardImageSource } | null> {
  for (const url of urls) {
    const confirmed = await confirmImageUrl(url, fetchImpl);
    if (!confirmed) continue;
    return {
      url: confirmed,
      source: confirmed.includes('limitlesstcg') ? 'limitless' : 'official',
    };
  }
  return null;
}

function abortAfter(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/**
 * Ask the already-used Chamber comps.php for an imageUrl only.
 * Does not invent solds or a URL. Times out quickly so Add Card stays usable.
 */
export async function imageUrlFromComps(
  query: CardImageQuery,
  options: {
    endpoint?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<string | null> {
  const parsed = parseOpCardCode(query.cardCode);
  if (!parsed) return null;

  const endpoint = options.endpoint ?? DEFAULT_COMPS_IMAGE_ENDPOINT;
  const timeoutMs = options.timeoutMs ?? CARD_IMAGE_COMPS_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const url = new URL(endpoint);
    url.searchParams.set('cardCode', parsed.baseCode);
    url.searchParams.set('language', catalogLanguage(query.language));
    url.searchParams.set('type', query.type);
    const grade = query.grade?.trim();
    if (grade) url.searchParams.set('grade', grade);
    const printNote = query.printNote?.trim();
    if (printNote) url.searchParams.set('printNote', printNote);
    url.searchParams.set('completed', 'true');

    const response = await fetchImpl(url.toString(), { signal: abortAfter(timeoutMs) });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    return imageUrlFromPayload(payload);
  } catch {
    return null;
  }
}

function noneResult(message: string): CardImageLookup {
  return { imageUrl: null, kind: null, source: null, message };
}

/**
 * Look up a picture by OP card code.
 * Raw → verified card-art (Limitless, then official Bandai).
 * Slab → comps.php imageUrl when the API sent a real listing photo; otherwise
 * an honest raw-art fallback or no image. Never invents a URL or solds.
 */
export async function lookupCardImage(
  query: CardImageQuery,
  options: {
    endpoint?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<CardImageLookup> {
  const parsed = parseOpCardCode(query.cardCode);
  if (!parsed) return noneResult('No photo for this code.');

  const fetchImpl = options.fetchImpl ?? fetch;
  const slab = isSlab(query.type);

  if (slab) {
    const compsUrl = await imageUrlFromComps(query, options);
    if (compsUrl) {
      return {
        imageUrl: compsUrl,
        kind: 'slab',
        source: 'comps',
        message: `Slab photo for ${parsed.baseCode}.`,
      };
    }
  }

  const catalog = await firstConfirmedImageUrl(
    catalogRawImageCandidates(query.cardCode, query.language, query.printNote),
    fetchImpl,
  );
  if (catalog) {
    return {
      imageUrl: catalog.url,
      kind: 'raw',
      source: catalog.source,
      message: slab ? 'No slab photo — using card art.' : `Card art for ${parsed.baseCode}.`,
    };
  }

  if (!slab) {
    const compsUrl = await imageUrlFromComps({ ...query, type: 'Raw' }, options);
    if (compsUrl) {
      return {
        imageUrl: compsUrl,
        kind: 'raw',
        source: 'comps',
        message: `Card art for ${parsed.baseCode}.`,
      };
    }
  }

  return noneResult('No photo for this code.');
}
