import { intlLocale, translate } from '../i18n/translate';
import type { Locale } from '../i18n/translations';
import { DEFAULT_LEVEL_STYLE, isLevelToken, type LevelStyle } from './levelStyle';
import type { ParkingRecord } from './types';

export type LevelCount = { level: string; count: number };
export type HourCount = { hour: number; count: number };
export type MonthCount = { key: string; label: string; count: number };

export type ParkingStats = {
  total: number;
  thisMonth: number;
  averageDurationMs: number | null;
  collectedCount: number;
  topLevels: LevelCount[];
  topHours: HourCount[];
  monthly: MonthCount[];
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function firstToken(note: string): string {
  const match = /^[^\s·,]+/.exec(note.trim());
  return match ? match[0] : '';
}

function topEntries(map: Map<string, number>, limit: number): LevelCount[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([level, count]) => ({ level, count }));
}

/** Rounds to whole minutes; anything under a minute reads as "<1". */
export function formatDuration(ms: number, locale: Locale): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return translate(locale, 'stats.durationUnderMinute');
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return translate(locale, 'stats.durationMinutes', { count: rest });
  if (rest === 0) return translate(locale, 'stats.durationHours', { count: hours });
  return translate(locale, 'stats.durationHoursMinutes', { hours, minutes: rest });
}

export function computeStats(
  records: ParkingRecord[],
  now: number,
  locale: Locale,
  options: { levelStyle?: LevelStyle; months?: number; limit?: number } = {},
): ParkingStats {
  const levelStyle = options.levelStyle ?? DEFAULT_LEVEL_STYLE;
  const months = options.months ?? 6;
  const limit = options.limit ?? 3;

  const nowDate = new Date(now);
  const currentKey = monthKey(nowDate);

  const levelCounts = new Map<string, number>();
  const hourCounts = new Map<number, number>();
  const monthly: MonthCount[] = [];
  const monthIndex = new Map<string, MonthCount>();

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(nowDate.getFullYear(), nowDate.getMonth() - offset, 1);
    const key = monthKey(date);
    const entry: MonthCount = {
      key,
      // A numeric month fits the narrow column; the year is implied by the six-month window.
      label: new Intl.DateTimeFormat(intlLocale(locale), { month: 'numeric' }).format(date),
      count: 0,
    };
    monthly.push(entry);
    monthIndex.set(key, entry);
  }

  let thisMonth = 0;
  let collectedCount = 0;
  let durationSum = 0;

  for (const record of records) {
    const created = new Date(record.createdAt);
    const key = monthKey(created);
    if (key === currentKey) thisMonth += 1;
    const bucket = monthIndex.get(key);
    if (bucket) bucket.count += 1;

    const token = firstToken(record.note);
    if (token !== '' && isLevelToken(token, levelStyle)) {
      const level = token.toUpperCase();
      levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1);
    }

    const hour = created.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);

    if (record.collectedAt !== null) {
      const duration = record.collectedAt - record.createdAt;
      if (duration > 0) {
        durationSum += duration;
        collectedCount += 1;
      }
    }
  }

  const topHours = [...hourCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, limit)
    .map(([hour, count]) => ({ hour, count }));

  return {
    total: records.length,
    thisMonth,
    averageDurationMs: collectedCount > 0 ? Math.round(durationSum / collectedCount) : null,
    collectedCount,
    topLevels: topEntries(levelCounts, limit),
    topHours,
    monthly,
  };
}
