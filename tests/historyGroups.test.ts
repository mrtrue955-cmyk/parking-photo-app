import { DAY_MS } from '../src/domain/expiry';
import { groupHistoryByDay } from '../src/domain/historyGroups';
import type { ParkingRecord } from '../src/domain/types';

// 2026-11-19 10:00 local time.
const now = new Date(2026, 10, 19, 10, 0, 0).getTime();

const rec = (id: string, createdAt: number): ParkingRecord => ({
  id,
  photoPath: `${id}.jpg`,
  lat: null,
  lng: null,
  note: '',
  createdAt,
  collectedAt: createdAt + 1000,
  expiresAt: null,
  parkedUntil: null,
});

test('groups records by local calendar day', () => {
  const groups = groupHistoryByDay(
    [
      rec('today-a', new Date(2026, 10, 19, 9, 0, 0).getTime()),
      rec('today-b', new Date(2026, 10, 19, 1, 0, 0).getTime()),
      rec('yesterday', new Date(2026, 10, 18, 23, 0, 0).getTime()),
      rec('older', new Date(2026, 10, 2, 8, 0, 0).getTime()),
    ],
    now,
    'vi',
  );
  expect(groups.map((g) => g.label)).toEqual(['Hôm nay', 'Hôm qua', '02/11/2026']);
  expect(groups[0].data.map((r) => r.id)).toEqual(['today-a', 'today-b']);
});

test('midnight boundary stays in the correct day', () => {
  const groups = groupHistoryByDay(
    [rec('late', new Date(2026, 10, 19, 0, 0, 0).getTime()), rec('prev', now - DAY_MS * 1)],
    now,
    'vi',
  );
  expect(groups[0].label).toBe('Hôm nay');
  expect(groups[1].label).toBe('Hôm qua');
});

test('empty history yields no groups', () => {
  expect(groupHistoryByDay([], now, 'vi')).toEqual([]);
});

test('a single group omits nothing and preserves order', () => {
  const groups = groupHistoryByDay([rec('a', now - 1000), rec('b', now - 2000)], now, 'vi');
  expect(groups).toHaveLength(1);
  expect(groups[0].data.map((r) => r.id)).toEqual(['a', 'b']);
});

test('labels follow the requested locale', () => {
  const groups = groupHistoryByDay(
    [rec('today', new Date(2026, 10, 19, 9, 0, 0).getTime()), rec('older', now - DAY_MS * 3)],
    now,
    'en',
  );
  expect(groups[0].label).toBe('Today');
  expect(groups[1].label).toMatch(/\d{2}\/\d{2}\/2026/);
});
