import { matchesSearch, normalizeText } from '../src/domain/search';
import type { ParkingRecord } from '../src/domain/types';

const record: ParkingRecord = {
  id: 'a',
  photoPath: 'a.jpg',
  lat: 10.7,
  lng: 106.7,
  note: 'Cột 45 · Đỗ xe tầng B1',
  createdAt: new Date(2026, 10, 24, 14, 30).getTime(),
  collectedAt: null,
  expiresAt: null,
  parkedUntil: null,
};

test('normalising strips Vietnamese diacritics', () => {
  expect(normalizeText('Cột 45')).toBe('cot 45');
  expect(normalizeText('ĐỖ XE')).toBe('do xe');
  expect(normalizeText('  Tầng   B1 ')).toBe('tang b1');
});

test('search ignores case and diacritics', () => {
  expect(matchesSearch(record, 'cot 45')).toBe(true);
  expect(matchesSearch(record, 'CỘT')).toBe(true);
  expect(matchesSearch(record, 'do xe')).toBe(true);
  expect(matchesSearch(record, 'tang b1')).toBe(true);
});

test('search also matches the parked date and time', () => {
  expect(matchesSearch(record, '24/11')).toBe(true);
  expect(matchesSearch(record, '14:30')).toBe(true);
});

test('an empty query matches everything and junk matches nothing', () => {
  expect(matchesSearch(record, '   ')).toBe(true);
  expect(matchesSearch(record, 'xe đạp')).toBe(false);
});
