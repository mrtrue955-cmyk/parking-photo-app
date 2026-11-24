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
