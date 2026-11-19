import type { Language } from '../domain/settings';
import {
  translations,
  type Locale,
  type TranslationKey,
  type TranslationValue,
} from './translations';

export type TranslationParams = Record<string, string | number>;

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

function select(value: TranslationValue, params?: TranslationParams): string {
  if (typeof value === 'string') return interpolate(value, params);
  const count = Number(params?.count ?? 0);
  return interpolate(count === 1 ? value.one : value.other, params);
}

export function translate(locale: Locale, key: TranslationKey, params?: TranslationParams): string {
  const value = translations[locale]?.[key] ?? translations.vi[key];
  // A stale key (or an outdated notification payload) must never crash a screen.
  if (value === undefined) return String(key);
  return select(value, params);
}

/** Resolves the language setting against the device locale reported by the OS. */
export function resolveLocale(language: Language, deviceLanguage: string | null): Locale {
  if (language === 'vi' || language === 'en') return language;
  return deviceLanguage?.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

export function intlLocale(locale: Locale): string {
  return locale === 'vi' ? 'vi-VN' : 'en-US';
}
