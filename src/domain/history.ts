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

export type HistoryStatus = { label: string; tone: 'primary' | 'danger' | 'neutral' };

export function historyStatus(expiresAt: number | null, now: number): HistoryStatus {
  if (expiresAt === null) return { label: 'Đã giữ lại', tone: 'neutral' };
  if (isExpiringSoon(expiresAt, now)) return { label: 'Sắp hết hạn', tone: 'danger' };
  return { label: `còn ${daysLeft(expiresAt, now)} ngày`, tone: 'primary' };
}
