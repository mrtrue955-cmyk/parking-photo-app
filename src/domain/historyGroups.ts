import { intlLocale, translate } from '../i18n/translate';
import type { Locale } from '../i18n/translations';
import { DAY_MS } from './expiry';
import type { ParkingRecord } from './types';

export type HistoryGroup = { key: string; label: string; data: ParkingRecord[] };

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayKey(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayLabel(day: number, today: number, locale: Locale): string {
  const diff = Math.round((today - day) / DAY_MS);
  if (diff === 0) return translate(locale, 'time.today');
  if (diff === 1) return translate(locale, 'time.yesterday');
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(day));
}

/** Groups records by the local calendar day they were taken, keeping the input order. */
export function groupHistoryByDay(
  records: ParkingRecord[],
  now: number,
  locale: Locale,
): HistoryGroup[] {
  const today = startOfDay(now);
  const groups = new Map<string, HistoryGroup>();
  for (const record of records) {
    const day = startOfDay(record.createdAt);
    const key = dayKey(day);
    const existing = groups.get(key);
    if (existing) {
      existing.data.push(record);
    } else {
      groups.set(key, { key, label: dayLabel(day, today, locale), data: [record] });
    }
  }
  return [...groups.values()];
}
