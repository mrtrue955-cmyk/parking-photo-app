import type { TranslationKey } from '../i18n/translations';
import { daysLeft, isExpiringSoon } from './expiry';
import type { ParkingRecord } from './types';

export type HistoryFilter = 'all' | 'expiring' | 'kept';

export function filterHistory(
  records: ParkingRecord[],
  filter: HistoryFilter,
  now: number,
): ParkingRecord[] {
  switch (filter) {
    case 'all':
      return records;
    case 'kept':
      return records.filter((r) => r.expiresAt === null);
    case 'expiring':
      return records.filter((r) => r.expiresAt !== null && isExpiringSoon(r.expiresAt, now));
  }
}

export type HistoryStatus = {
  labelKey: TranslationKey;
  /** Present when the label needs a day count. */
  count: number | null;
  tone: 'primary' | 'danger' | 'neutral';
};

export function historyStatus(expiresAt: number | null, now: number): HistoryStatus {
  if (expiresAt === null) return { labelKey: 'status.kept', count: null, tone: 'neutral' };
  if (isExpiringSoon(expiresAt, now))
    return { labelKey: 'status.expiring', count: null, tone: 'danger' };
  return { labelKey: 'status.daysLeft', count: daysLeft(expiresAt, now), tone: 'primary' };
}
