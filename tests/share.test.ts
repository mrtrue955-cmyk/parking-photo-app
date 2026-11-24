import { mapsLink, shareMessage } from '../src/domain/share';
import type { ParkingRecord } from '../src/domain/types';

const base: ParkingRecord = {
  id: 'a',
  photoPath: 'a.jpg',
  lat: 10.7769,
  lng: 106.7009,
  note: 'B1 · Cột 45',
  createdAt: new Date(2026, 10, 24, 14, 30).getTime(),
  collectedAt: null,
  expiresAt: null,
  parkedUntil: null,
};

test('the link carries the coordinates for both maps apps', () => {
  expect(mapsLink(10.5, 106.5)).toBe('https://maps.apple.com/?ll=10.5,106.5&q=10.5,106.5');
});

test('the share text names the spot, the time and the link', () => {
  const message = shareMessage(base, 'vi');
  expect(message).toContain('Vị trí xe: B1 · Cột 45');
  expect(message).toContain('Đỗ lúc');
  expect(message).toContain('https://maps.apple.com/?ll=10.7769,106.7009');
});

test('an empty note still reads well', () => {
  expect(shareMessage({ ...base, note: '' }, 'vi')).toContain('Vị trí xe: Chưa có ghi chú');
  expect(shareMessage({ ...base, note: '  ' }, 'en')).toContain('Parked at: No note yet');
});

test('no coordinates means no map link', () => {
  const message = shareMessage({ ...base, lat: null, lng: null }, 'vi');
  expect(message).not.toContain('http');
});
