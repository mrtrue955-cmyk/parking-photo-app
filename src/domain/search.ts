import type { Locale } from '../i18n/translations';
import type { ParkingRecord } from './types';

// Built by hand instead of String#normalize: Hermes ships without the full
// Unicode normalisation tables, so a table of Vietnamese letters is portable.
const BASE_LETTERS: [string, string][] = [
  ['a', 'àáạảãâầấậẩẫăằắặẳẵ'],
  ['e', 'èéẹẻẽêềếệểễ'],
  ['i', 'ìíịỉĩ'],
  ['o', 'òóọỏõôồốộổỗơờớợởỡ'],
  ['u', 'ùúụủũưừứựửữ'],
  ['y', 'ỳýỵỷỹ'],
  ['d', 'đ'],
];

const FOLDED: Record<string, string> = {};
for (const [base, letters] of BASE_LETTERS) {
  for (const letter of letters) {
    FOLDED[letter] = base;
    FOLDED[letter.toUpperCase()] = base.toUpperCase();
  }
}

/** Lowercases and strips Vietnamese diacritics so "cot 45" finds "Cột 45". */
export function normalizeText(value: string): string {
  let out = '';
  for (const char of value) out += FOLDED[char] ?? char;
  return out.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function matchesSearch(
  record: ParkingRecord,
  query: string,
  locale: Locale = 'vi',
): boolean {
  const needle = normalizeText(query);
  if (!needle) return true;
  const intlLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const at = new Date(record.createdAt);
  const haystack = [
    record.note,
    at.toLocaleDateString(intlLocale),
    at.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' }),
    String(at.getFullYear()),
  ];
  return haystack.some((value) => normalizeText(value).includes(needle));
}
