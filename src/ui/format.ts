import { formatTimeAgo as formatAgo } from '../i18n/format';
import type { Locale } from '../i18n/translations';

export function formatTimeAgo(from: number, now: number, locale: Locale = 'vi'): string {
  return formatAgo(from, now, locale);
}
