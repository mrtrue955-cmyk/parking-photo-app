import type { ParkingRecord } from './types';

export const RETENTION_DAYS = 30;
export const DAY_MS = 86_400_000;

export function computeExpiresAt(
  createdAt: number,
  retentionDays: number = RETENTION_DAYS,
): number {
  return createdAt + retentionDays * DAY_MS;
}

export function daysLeft(expiresAt: number, now: number): number {
  return Math.max(0, Math.ceil((expiresAt - now) / DAY_MS));
}

export function isExpired(record: ParkingRecord, now: number): boolean {
  return record.expiresAt !== null && record.expiresAt <= now;
}

export type Reminder = { id: string; triggerAt: number; count: number };

function localDateKey(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `reminder-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// One reminder per LOCAL calendar day of the trigger time: fires one day before
// the earliest expiry in the bucket, so a user is warned the day before photos
// are deleted. The id is stable per local date so rescheduling replaces it.
export function buildReminders(records: ParkingRecord[], now: number): Reminder[] {
  const buckets = new Map<string, Reminder>();
  for (const r of records) {
    if (r.expiresAt === null) continue;
    const triggerAt = r.expiresAt - DAY_MS;
    if (triggerAt <= now) continue;
    const id = localDateKey(triggerAt);
    const existing = buckets.get(id);
    if (existing) {
      existing.count += 1;
      existing.triggerAt = Math.min(existing.triggerAt, triggerAt);
    } else {
      buckets.set(id, { id, triggerAt, count: 1 });
    }
  }
  return [...buckets.values()].sort((a, b) => a.triggerAt - b.triggerAt);
}

export const EXPIRY_WARN_DAYS = 4;

/** Share of the retention window that is left, from 0 (expired) to 1 (just taken). */
export function expiryFraction(expiresAt: number, now: number): number {
  const fraction = (expiresAt - now) / (RETENTION_DAYS * DAY_MS);
  return Math.min(1, Math.max(0, fraction));
}

export function isExpiringSoon(expiresAt: number, now: number): boolean {
  return daysLeft(expiresAt, now) < EXPIRY_WARN_DAYS;
}
