import { buildReminders, computeExpiresAt, DAY_MS, daysLeft, expiryFraction, isExpired, isExpiringSoon } from '../src/domain/expiry';
import type { ParkingRecord } from '../src/domain/types';

const base: ParkingRecord = {
  id: 'a', photoPath: 'a.jpg', lat: null, lng: null, note: '',
  createdAt: 0, collectedAt: null, expiresAt: 30 * DAY_MS,
};

test('computeExpiresAt adds 30 days', () => {
  // Given a capture time
  const createdAt = 1_000;
  // When computing expiry
  // Then it is exactly 30 days later
  expect(computeExpiresAt(createdAt)).toBe(createdAt + 30 * DAY_MS);
});

test('daysLeft rounds up and never goes below zero', () => {
  // Given an expiry 1.2 days away and one already passed
  // When asking how many days are left
  // Then a partial day counts as a full day, and past expiry is 0
  expect(daysLeft(1.2 * DAY_MS, 0)).toBe(2);
  expect(daysLeft(0, 5 * DAY_MS)).toBe(0);
});

test('isExpired is true only when expiresAt has passed', () => {
  // Given records that are expired, not yet expired, and kept forever
  // When checking each
  // Then only the passed one is expired; a kept record (null) never is
  expect(isExpired({ ...base, expiresAt: 10 }, 10)).toBe(true);
  expect(isExpired({ ...base, expiresAt: 11 }, 10)).toBe(false);
  expect(isExpired({ ...base, expiresAt: null }, 10 ** 15)).toBe(false);
});

function localId(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `reminder-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

test('buildReminders merges triggers on the same local day with a stable local-date id', () => {
  // Given two records whose reminder triggers fall on the same LOCAL day (00:30 and 23:30)
  const t1 = new Date(2026, 0, 10, 0, 30).getTime();
  const t2 = new Date(2026, 0, 10, 23, 30).getTime();
  const records: ParkingRecord[] = [
    { ...base, id: '1', expiresAt: t2 + DAY_MS },
    { ...base, id: '2', expiresAt: t1 + DAY_MS },
  ];
  // When building reminders well before both
  const result = buildReminders(records, new Date(2026, 0, 1).getTime());
  // Then they merge into one reminder at the earliest trigger, with the local-date id
  expect(result).toEqual([{ id: 'reminder-2026-01-10', triggerAt: t1, count: 2 }]);
  expect(result[0].id).toBe(localId(t1));
});

test('buildReminders keeps triggers just before and after local midnight separate', () => {
  // Given triggers at 23:59 on Jan 10 and 00:01 on Jan 11 (local)
  const before = new Date(2026, 0, 10, 23, 59).getTime();
  const after = new Date(2026, 0, 11, 0, 1).getTime();
  const records: ParkingRecord[] = [
    { ...base, id: '1', expiresAt: after + DAY_MS },
    { ...base, id: '2', expiresAt: before + DAY_MS },
  ];
  // When building reminders
  const result = buildReminders(records, new Date(2026, 0, 1).getTime());
  // Then they stay as two reminders, ordered by time, with distinct ids
  expect(result).toEqual([
    { id: 'reminder-2026-01-10', triggerAt: before, count: 1 },
    { id: 'reminder-2026-01-11', triggerAt: after, count: 1 },
  ]);
});

test('buildReminders skips kept records and triggers that already passed, ordered by time', () => {
  // Given a later record, an earlier record, a kept one, and one whose trigger is <= now
  const now = new Date(2026, 0, 1, 12, 0).getTime();
  const early = new Date(2026, 0, 5, 9, 0).getTime();
  const late = new Date(2026, 0, 20, 9, 0).getTime();
  const records: ParkingRecord[] = [
    { ...base, id: '1', expiresAt: late + DAY_MS },
    { ...base, id: '2', expiresAt: early + DAY_MS },
    { ...base, id: '3', expiresAt: null },
    { ...base, id: '4', expiresAt: now + DAY_MS },
  ];
  // When building reminders
  const result = buildReminders(records, now);
  // Then only the two future triggers remain, ascending
  expect(result).toEqual([
    { id: localId(early), triggerAt: early, count: 1 },
    { id: localId(late), triggerAt: late, count: 1 },
  ]);
});

test('expiryFraction is the share of the 30-day window that is left, clamped to 0..1', () => {
  // Given a photo that was just taken, one half-way through, one expired, and a clock set before capture
  const now = 1_000_000;
  // When computing the fraction left
  // Then it is 1, 0.5, 0 and 1 respectively (never outside 0..1)
  expect(expiryFraction(now + 30 * DAY_MS, now)).toBe(1);
  expect(expiryFraction(now + 15 * DAY_MS, now)).toBe(0.5);
  expect(expiryFraction(now - DAY_MS, now)).toBe(0);
  expect(expiryFraction(now + 40 * DAY_MS, now)).toBe(1);
});

test('isExpiringSoon is true only when fewer than 4 whole days are left', () => {
  // Given expiry times 5, 4, 3 and 0 days away
  const now = 1_000_000;
  // When checking each
  // Then only 3 days and 0 days count as expiring soon
  expect(isExpiringSoon(now + 5 * DAY_MS, now)).toBe(false);
  expect(isExpiringSoon(now + 4 * DAY_MS, now)).toBe(false);
  expect(isExpiringSoon(now + 3 * DAY_MS, now)).toBe(true);
  expect(isExpiringSoon(now, now)).toBe(true);
});
