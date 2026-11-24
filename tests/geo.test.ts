import { distanceMeters, formatDistance, initialBearing, normalizeAngle } from '../src/domain/geo';

const here = { lat: 10.7769, lng: 106.7009 };

test('distance measures about 1.1 km for 0.01 degrees of latitude', () => {
  const there = { lat: here.lat + 0.01, lng: here.lng };
  expect(Math.abs(distanceMeters(here, there) - 1112)).toBeLessThan(15);
});

test('distance is symmetric and zero for the same point', () => {
  const there = { lat: 10.7869, lng: 106.7123 };
  expect(distanceMeters(here, there)).toBe(distanceMeters(there, here));
  expect(distanceMeters(here, here)).toBe(0);
});

test('bearing points north and east', () => {
  expect(initialBearing(here, { lat: here.lat + 0.01, lng: here.lng })).toBeCloseTo(0, 0);
  expect(initialBearing(here, { lat: here.lat, lng: here.lng + 0.01 })).toBeCloseTo(90, 0);
});

test('distance is short in metres and decimal in kilometres', () => {
  expect(formatDistance(45, 'vi')).toBe('45 m');
  expect(formatDistance(999, 'en')).toBe('999 m');
  expect(formatDistance(1200, 'vi')).toBe('1,2 km');
  expect(formatDistance(1200, 'en')).toBe('1.2 km');
});

test('angles fold into the short way round', () => {
  expect(normalizeAngle(350)).toBe(-10);
  expect(normalizeAngle(190)).toBe(-170);
  expect(normalizeAngle(-190)).toBe(170);
  expect(normalizeAngle(0)).toBe(0);
});
