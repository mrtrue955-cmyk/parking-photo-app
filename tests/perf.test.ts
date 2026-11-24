import { historyOf } from '../src/domain/current';
import { filterHistory } from '../src/domain/history';
import { groupHistoryByDay } from '../src/domain/historyGroups';
import { computeStats } from '../src/domain/stats';
import type { ParkingRecord } from '../src/domain/types';

const now = new Date(2026, 10, 24, 10, 0, 0).getTime();

function makeRecords(count: number): ParkingRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `r${i}`,
    photoPath: `r${i}.jpg`,
    lat: 10.7,
    lng: 106.7,
    note: i % 3 === 0 ? 'B1 · Cột 45' : i % 3 === 1 ? 'B2 · Cột 12' : '1F · Cột 3',
    createdAt: now - i * 3_600_000,
    collectedAt: i % 2 === 0 ? now - i * 3_600_000 + 1_800_000 : null,
    expiresAt: i % 2 === 0 ? now + 20 * 86_400_000 : null,
  }));
}

function time(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

test('domain work stays cheap at 1.000 records', () => {
  const records = makeRecords(1000);
  const history = historyOf(records);

  const stats = time(() => computeStats(records, now, 'vi'));
  const grouped = time(() => groupHistoryByDay(history, now, 'vi'));
  const filtered = time(() => filterHistory(history, 'expiring', now));

  // Generous budgets: this guards against accidental O(n²), not micro-regressions.
  console.log(
    `perf(1000): stats=${stats.toFixed(1)}ms group=${grouped.toFixed(1)}ms filter=${filtered.toFixed(1)}ms`,
  );
  expect(stats).toBeLessThan(100);
  expect(grouped).toBeLessThan(50);
  expect(filtered).toBeLessThan(20);
});

test('domain work scales linearly to 5.000 records', () => {
  const records = makeRecords(5000);
  const history = historyOf(records);

  const stats = time(() => computeStats(records, now, 'vi'));
  const grouped = time(() => groupHistoryByDay(history, now, 'vi'));

  console.log(`perf(5000): stats=${stats.toFixed(1)}ms group=${grouped.toFixed(1)}ms`);
  expect(stats).toBeLessThan(400);
  expect(grouped).toBeLessThan(200);
});
