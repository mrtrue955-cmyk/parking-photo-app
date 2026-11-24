import type { ParkingRecord } from '../src/domain/types';
import {
  buildSessionReminders,
  formatSessionRemaining,
  isSessionOver,
  SESSION_WARN_LEAD_MS,
  sessionEnd,
} from '../src/domain/session';

const now = 1_000_000_000_000;
const MIN = 60_000;

const rec = (id: string, parkedUntil: number | null): ParkingRecord => ({
  id,
  photoPath: `${id}.jpg`,
  lat: null,
  lng: null,
  note: 'B1 · Cột 45',
  createdAt: now - 10 * MIN,
  collectedAt: null,
  expiresAt: now + 30 * 86_400_000,
  parkedUntil,
});

test('sessionEnd adds the chosen minutes', () => {
  expect(sessionEnd(now, 60)).toBe(now + 60 * MIN);
});

test('a session is over once the limit passes', () => {
  expect(isSessionOver(now + MIN, now)).toBe(false);
  expect(isSessionOver(now, now)).toBe(true);
  expect(isSessionOver(null, now)).toBe(false);
});

test('remaining time is written in minutes and hours', () => {
  expect(formatSessionRemaining(42 * MIN, 'vi')).toBe('còn 42 phút');
  expect(formatSessionRemaining(2 * 60 * MIN, 'vi')).toBe('còn 2 giờ');
  expect(formatSessionRemaining(2 * 60 * MIN + 15 * MIN, 'vi')).toBe('còn 2 giờ 15 phút');
  expect(formatSessionRemaining(0, 'vi')).toBe('Hết giờ đỗ');
  expect(formatSessionRemaining(-5 * MIN, 'vi')).toBe('Hết giờ đỗ');
  expect(formatSessionRemaining(42 * MIN, 'en')).toBe('42 min left');
});

test('a limited session produces a warning and an end reminder', () => {
  const reminders = buildSessionReminders([rec('a', now + 60 * MIN)], now);
  expect(reminders.map((r) => r.kind)).toEqual(['warn', 'end']);
  expect(reminders[0].triggerAt).toBe(now + 60 * MIN - SESSION_WARN_LEAD_MS);
  expect(reminders[1].triggerAt).toBe(now + 60 * MIN);
});

test('sessions without a limit produce nothing', () => {
  expect(buildSessionReminders([rec('a', null)], now)).toEqual([]);
});

test('a session shorter than the warning lead only gets the end reminder', () => {
  const reminders = buildSessionReminders([rec('a', now + 5 * MIN)], now);
  expect(reminders).toHaveLength(1);
  expect(reminders[0].kind).toBe('end');
});

test('past sessions are skipped entirely', () => {
  expect(buildSessionReminders([rec('a', now - MIN)], now)).toEqual([]);
});
