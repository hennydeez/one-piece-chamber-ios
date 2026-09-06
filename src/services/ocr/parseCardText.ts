import { CARD_TYPES, type CardType } from '../../models/card';

export interface OcrPrefill {
  cardCode: string;
  type: CardType | null;
  grade: string;
  certNumber: string;
  printNote: string;
  language: string;
}

export function emptyPrefill(): OcrPrefill {
  return {
    cardCode: '',
    type: null,
    grade: '',
    certNumber: '',
    printNote: '',
    language: '',
  };
}

const CODE_RE =
  /\b((?:OP|ST|EB|PRB)\s*-?\s*\d{1,2}\s*-\s*\d{3}|P\s*-\s*\d{3})\b/i;

const PRINT_PATTERNS: Array<{ re: RegExp; note: string }> = [
  { re: /\bmanga\b/i, note: 'Manga' },
  { re: /\balternate\s*art\b|\balt(?:ernate)?\s*art\b|\bAA\b/i, note: 'Alternate Art' },
  { re: /\bparallel\b|\bSP\b/i, note: 'Parallel' },
  { re: /\btreasure\s*rare\b|\bTR\b/i, note: 'Treasure Rare' },
  { re: /\bsecret\b|\bSEC\b/i, note: 'Secret' },
  { re: /\bwinner\b/i, note: 'Winner' },
  { re: /\bstarter\b/i, note: 'Starter' },
];

const LANGUAGE_PATTERNS: Array<{ re: RegExp; lang: string }> = [
  { re: /\b(?:japanese|japonais|jpn|jp)\b/i, lang: 'JP' },
  { re: /\b(?:korean|kr|kor)\b/i, lang: 'KR' },
  { re: /\b(?:chinese|chn|cn|zh)\b/i, lang: 'CN' },
  { re: /\b(?:italian|ita|it)\b/i, lang: 'IT' },
  { re: /\b(?:french|français|francais|fr)\b/i, lang: 'FR' },
  { re: /\b(?:german|de|ger)\b/i, lang: 'DE' },
  { re: /\b(?:spanish|es|esp)\b/i, lang: 'ES' },
  { re: /\b(?:english|eng|en)\b/i, lang: 'EN' },
];

function normalizeCode(raw: string): string {
  return raw.replace(/\s+/g, '').replace(/--+/g, '-').toUpperCase();
}

function detectType(text: string): CardType | null {
  if (/\bTAG\b/i.test(text)) return 'TAG';
  if (/\bBGS\b|\bbeckett\b/i.test(text)) return 'BGS';
  if (/\bPSA\b/i.test(text)) return 'PSA';
  if (/\bRAW\b/i.test(text)) return 'Raw';
  return null;
}

function detectGrade(text: string, type: CardType | null): string {
  if (/\bblack\s*label\b/i.test(text)) return 'Black Label';
  if (/\bgem\s*mt\s*10\b/i.test(text) || /\bgem\s*mint\s*10\b/i.test(text)) {
    return '10';
  }
  const slabGrade = text.match(/\b(?:PSA|BGS|TAG|beckett)\s*(10|9\.5|9|8\.5|8|7\.5|7|6|5|4|3|2|1)\b/i);
  if (slabGrade?.[1]) return slabGrade[1];
  if (type && type !== 'Raw') {
    const nearby = text.match(/\b(10|9\.5|9|8\.5|8|7\.5|7)\b/);
    if (nearby?.[1]) return nearby[1];
  }
  const condition = text.match(/\b(NM|LP|MP|HP|MINT|NEAR\s*MINT)\b/i);
  if (condition?.[1] && (!type || type === 'Raw')) {
    return condition[1].replace(/\s+/g, ' ').toUpperCase();
  }
  return '';
}

function detectCert(text: string): string {
  const labeled = text.match(
    /\b(?:cert(?:ificate)?(?:\s*(?:no|num|number|#))?|certification)\s*[:#]?\s*(\d{7,10})\b/i,
  );
  if (labeled?.[1]) return labeled[1];
  const afterCompany = text.match(/\b(?:PSA|BGS|TAG)\b[^\d]{0,24}(\d{7,10})\b/i);
  if (afterCompany?.[1]) return afterCompany[1];
  return '';
}

function detectPrint(text: string): string {
  for (const { re, note } of PRINT_PATTERNS) {
    if (re.test(text)) return note;
  }
  return '';
}

function detectLanguage(text: string): string {
  for (const { re, lang } of LANGUAGE_PATTERNS) {
    if (re.test(text)) return lang;
  }
  return '';
}

/** Best-effort field extraction from OCR text. Never treats guesses as confirmed. */
export function parseCardText(text: string): OcrPrefill {
  const prefill = emptyPrefill();
  if (!text.trim()) return prefill;

  const codeMatch = text.match(CODE_RE);
  if (codeMatch?.[1]) {
    prefill.cardCode = normalizeCode(codeMatch[1]);
  }

  prefill.type = detectType(text);
  if (prefill.type && !CARD_TYPES.includes(prefill.type)) {
    prefill.type = null;
  }
  prefill.grade = detectGrade(text, prefill.type);
  prefill.certNumber = detectCert(text);
  prefill.printNote = detectPrint(text);
  prefill.language = detectLanguage(text);
  return prefill;
}
