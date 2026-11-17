import type { ParkingRecord } from './types';

export const RETENTION_DAYS = 30;
export const DAY_MS = 86_400_000;

export function computeExpiresAt(createdAt: number): number {
  return createdAt + RETENTION_DAYS * DAY_MS;
}

export function daysLeft(expiresAt: number, now: number): number {
  return Math.max(0, Math.ceil((expiresAt - now) / DAY_MS));
}

export function isExpired(record: ParkingRecord, now: number): boolean {
  return record.expiresAt !== null && record.expiresAt <= now;
}

export type Reminder = { triggerAt: number; count: number };

// One reminder per calendar bucket: fires one day before the earliest expiry in
// the bucket, so a user is warned the day before photos are deleted.
export function buildReminders(records: ParkingRecord[], now: number): Reminder[] {
  const buckets = new Map<number, Reminder>();
  for (const r of records) {
    if (r.expiresAt === null) continue;
    const triggerAt = r.expiresAt - DAY_MS;
    if (triggerAt <= now) continue;
    const key = Math.floor(triggerAt / DAY_MS);
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      existing.triggerAt = Math.min(existing.triggerAt, triggerAt);
    } else {
      buckets.set(key, { triggerAt, count: 1 });
    }
  }
  return [...buckets.values()].sort((a, b) => a.triggerAt - b.triggerAt);
}
