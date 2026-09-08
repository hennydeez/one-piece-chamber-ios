export const COMP_LANGUAGES = ['Global', 'Jap'] as const;
export type CompLanguage = (typeof COMP_LANGUAGES)[number];

/** Global = EN / worldwide tape. Jap = Japanese tape. Never mix. */
export function languageCodeFromComp(option: CompLanguage): 'EN' | 'JP' {
  return option === 'Jap' ? 'JP' : 'EN';
}

export function compLanguageFromCode(language: string): CompLanguage {
  return language.trim().toUpperCase() === 'JP' ? 'Jap' : 'Global';
}
