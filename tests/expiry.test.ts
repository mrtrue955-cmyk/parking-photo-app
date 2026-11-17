import { buildReminders, computeExpiresAt, DAY_MS, daysLeft, isExpired } from '../src/domain/expiry';
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

test('buildReminders groups records expiring the same day and skips past or kept ones', () => {
  // Given two records expiring on day 10, one on day 20, one kept, one whose reminder time already passed
  const records: ParkingRecord[] = [
    { ...base, id: '1', expiresAt: 10 * DAY_MS + 1000 },
    { ...base, id: '2', expiresAt: 10 * DAY_MS + 2000 },
    { ...base, id: '3', expiresAt: 20 * DAY_MS },
    { ...base, id: '4', expiresAt: null },
    { ...base, id: '5', expiresAt: DAY_MS / 2 },
  ];
  // When building reminders at time 0
  const result = buildReminders(records, 0);
  // Then same-day records are merged (earliest trigger time), ordered by time
  expect(result).toEqual([
    { triggerAt: 9 * DAY_MS + 1000, count: 2 },
    { triggerAt: 19 * DAY_MS, count: 1 },
  ]);
});
