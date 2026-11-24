import { DEFAULT_SETTINGS, parseSettings } from '../src/domain/settings';

test('the intro is unseen by default', () => {
  expect(DEFAULT_SETTINGS.onboarded).toBe(false);
  expect(parseSettings({}).onboarded).toBe(false);
});

test('a seen intro survives a round trip and junk falls back', () => {
  expect(parseSettings({ onboarded: true }).onboarded).toBe(true);
  expect(parseSettings({ onboarded: 'yes' }).onboarded).toBe(false);
  expect(parseSettings({ onboarded: null }).onboarded).toBe(false);
});

test('the save counter tolerates junk and never goes negative', () => {
  expect(parseSettings({}).captureCount).toBe(0);
  expect(parseSettings({ captureCount: 4.7 }).captureCount).toBe(4);
  expect(parseSettings({ captureCount: -3 }).captureCount).toBe(0);
  expect(parseSettings({ captureCount: 'x' }).captureCount).toBe(0);
  expect(parseSettings({ reviewAsked: true }).reviewAsked).toBe(true);
  expect(parseSettings({ reviewAsked: 'yes' }).reviewAsked).toBe(false);
});
