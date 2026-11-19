import type { ParkingRecord } from '../src/domain/types';
import { computeStats, formatDuration } from '../src/domain/stats';

const now = new Date(2026, 10, 19, 10, 0, 0).getTime(); // 19 Nov 2026, 10:00 local

const rec = (
  id: string,
  note: string,
  createdAt: number,
  collectedAt: number | null = null,
): ParkingRecord => ({
  id,
  photoPath: `${id}.jpg`,
  lat: null,
  lng: null,
  note,
  createdAt,
  collectedAt,
  expiresAt: createdAt + 30 * 86_400_000,
});

const at = (month: number, day: number, hour: number) =>
  new Date(2026, month, day, hour, 0, 0).getTime();

test('counts the total and the current month', () => {
  const stats = computeStats(
    [
      rec('a', 'B1 · cột 1', at(10, 2, 9)),
      rec('b', 'B2 · cột 2', at(10, 18, 18)),
      rec('c', 'B1 · cột 3', at(9, 5, 9)),
    ],
    now,
    'vi',
  );
  expect(stats.total).toBe(3);
  expect(stats.thisMonth).toBe(2);
});

test('averages only the sessions that were collected', () => {
  const stats = computeStats(
    [
      rec('a', 'B1 · cột 1', at(10, 2, 9), at(10, 2, 11)), // 2h
      rec('b', 'B1 · cột 2', at(10, 3, 9), at(10, 3, 10)), // 1h
      rec('c', 'B1 · cột 3', at(10, 4, 9)), // still parked
      rec('d', 'B1 · cột 4', at(10, 5, 9), at(10, 5, 9)), // zero length
    ],
    now,
    'vi',
  );
  expect(stats.collectedCount).toBe(2);
  expect(stats.averageDurationMs).toBe(90 * 60_000);
});

test('ranks the floors that are used the most', () => {
  const stats = computeStats(
    [
      rec('a', 'B1 · cột 1', at(10, 2, 9)),
      rec('b', 'B1 · cột 2', at(10, 3, 9)),
      rec('c', 'B2 · cột 3', at(10, 4, 9)),
      rec('d', '2F · cột 4', at(10, 5, 9)),
    ],
    now,
    'vi',
  );
  expect(stats.topLevels[0]).toEqual({ level: 'B1', count: 2 });
  expect(stats.topLevels.map((entry) => entry.level)).toContain('B2');
});

test('ranks the most common hours', () => {
  const stats = computeStats(
    [
      rec('a', 'cột 1', at(10, 2, 9)),
      rec('b', 'cột 2', at(10, 3, 9)),
      rec('c', 'cột 3', at(10, 4, 18)),
    ],
    now,
    'vi',
  );
  expect(stats.topHours[0]).toEqual({ hour: 9, count: 2 });
});

test('builds six monthly buckets ending with the current month', () => {
  const stats = computeStats(
    [
      rec('a', 'cột 1', at(10, 2, 9)),
      rec('b', 'cột 2', at(8, 5, 9)),
      rec('c', 'cột 3', at(1, 5, 9)),
    ],
    now,
    'vi',
  );
  expect(stats.monthly).toHaveLength(6);
  expect(stats.monthly[5].key).toBe('2026-11');
  expect(stats.monthly[5].count).toBe(1);
  expect(stats.monthly[0].key).toBe('2026-06');
  // January is outside the six-month window and is not counted anywhere
  expect(stats.monthly.reduce((sum, month) => sum + month.count, 0)).toBe(2);
});

test('an empty history reports zeros and no average', () => {
  const stats = computeStats([], now, 'vi');
  expect(stats.total).toBe(0);
  expect(stats.averageDurationMs).toBeNull();
  expect(stats.monthly.every((month) => month.count === 0)).toBe(true);
});

test('formatDuration speaks both languages', () => {
  expect(formatDuration(20_000, 'vi')).toBe('<1 phút');
  expect(formatDuration(15 * 60_000, 'vi')).toBe('15 phút');
  expect(formatDuration(2 * 3_600_000, 'vi')).toBe('2 giờ');
  expect(formatDuration(2 * 3_600_000 + 15 * 60_000, 'vi')).toBe('2 giờ 15 phút');
  expect(formatDuration(2 * 3_600_000 + 15 * 60_000, 'en')).toBe('2 h 15 min');
});
