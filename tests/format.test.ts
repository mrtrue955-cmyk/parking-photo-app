import { formatTimeAgo } from '../src/ui/format';

const MINUTE = 60_000;
// Fixed clock so the assertions never depend on the machine time.
const now = 10_000_000_000;

test('formatTimeAgo picks the right unit in Vietnamese', () => {
  // Given times 20 seconds, 5 minutes, 3 hours and 2 days earlier
  // Then the label names the largest whole unit
  expect(formatTimeAgo(now - 20_000, now)).toBe('vừa xong');
  expect(formatTimeAgo(now - 5 * MINUTE, now)).toBe('5 phút trước');
  expect(formatTimeAgo(now - 3 * 60 * MINUTE, now)).toBe('3 giờ trước');
  expect(formatTimeAgo(now - 2 * 24 * 60 * MINUTE, now)).toBe('2 ngày trước');
});

test('formatTimeAgo follows the requested locale', () => {
  expect(formatTimeAgo(now - 20_000, now, 'en')).toBe('just now');
  expect(formatTimeAgo(now - 5 * MINUTE, now, 'en')).toBe('5 minutes ago');
  expect(formatTimeAgo(now - 3 * 60 * MINUTE, now, 'en')).toBe('3 hours ago');
  expect(formatTimeAgo(now - 1 * 24 * 60 * MINUTE, now, 'en')).toBe('1 day ago');
});
