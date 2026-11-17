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
