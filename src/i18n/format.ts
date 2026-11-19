import { translate } from './translate';
import type { Locale } from './translations';

export function formatTimeAgo(from: number, now: number, locale: Locale): string {
  const minutes = Math.floor((now - from) / 60_000);
  if (minutes < 1) return translate(locale, 'time.justNow');
  if (minutes < 60) return translate(locale, 'time.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate(locale, 'time.hoursAgo', { count: hours });
  return translate(locale, 'time.daysAgo', { count: Math.floor(hours / 24) });
}
