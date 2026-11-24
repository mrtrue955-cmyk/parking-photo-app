import { DAY_MS } from '../src/domain/expiry';
import { filterHistory, historyStatus } from '../src/domain/history';
import type { ParkingRecord } from '../src/domain/types';

const now = 1_000_000_000_000;

const rec = (id: string, expiresAt: number | null): ParkingRecord => ({
  id,
  photoPath: `${id}.jpg`,
  lat: null,
  lng: null,
  note: '',
  createdAt: now - DAY_MS,
  collectedAt: now - DAY_MS / 2,
  expiresAt,
  parkedUntil: null,
});

const records = [
  rec('fresh', now + 20 * DAY_MS),
  rec('boundary', now + 4 * DAY_MS),
  rec('soon', now + 3 * DAY_MS),
  rec('today', now + DAY_MS / 2),
  rec('kept', null),
];

test('filterHistory "all" returns every record unchanged', () => {
  // Given a mix of fresh, expiring and kept records
  // When filtering with "all"
  // Then every record is returned in the same order
  expect(filterHistory(records, 'all', now).map((r) => r.id)).toEqual([
    'fresh',
    'boundary',
    'soon',
    'today',
    'kept',
  ]);
});

test('filterHistory "expiring" returns records with fewer than 4 days left, never kept ones', () => {
  // Given records 20, 4, 3 and under 1 days from expiry, and a kept one
  // When filtering with "expiring"
  // Then only the 3-day and the under-1-day records match; 4 days is not "soon"
  expect(filterHistory(records, 'expiring', now).map((r) => r.id)).toEqual(['soon', 'today']);
});

test('filterHistory "kept" returns only records that never expire', () => {
  // Given the same records
  // When filtering with "kept"
  // Then only the record with expiresAt null remains
  expect(filterHistory(records, 'kept', now).map((r) => r.id)).toEqual(['kept']);
});

test('filterHistory returns an empty array for an empty input', () => {
  // Given no records
  // When filtering with each filter
  // Then the result is empty and the input is not mutated
  const empty: ParkingRecord[] = [];
  expect(filterHistory(empty, 'all', now)).toEqual([]);
  expect(filterHistory(empty, 'expiring', now)).toEqual([]);
  expect(filterHistory(empty, 'kept', now)).toEqual([]);
  expect(empty).toEqual([]);
});

test('historyStatus describes kept, expiring and normal records', () => {
  // Given a kept record, one with 3 days left, one with 21 days left
  // When computing their status
  // Then kept is neutral, under 4 days is a danger "Sắp hết hạn", and the rest shows the day count
  expect(historyStatus(null, now)).toEqual({
    labelKey: 'status.kept',
    count: null,
    tone: 'neutral',
  });
  expect(historyStatus(now + 3 * DAY_MS, now)).toEqual({
    labelKey: 'status.expiring',
    count: null,
    tone: 'danger',
  });
  expect(historyStatus(now + 21 * DAY_MS, now)).toEqual({
    labelKey: 'status.daysLeft',
    count: 21,
    tone: 'primary',
  });
});
