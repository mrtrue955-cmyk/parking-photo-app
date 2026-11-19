import { resolveLocale, translate } from '../src/i18n/translate';
import { translations } from '../src/i18n/translations';

const viKeys = Object.keys(translations.vi).sort();
const enKeys = Object.keys(translations.en).sort();

test('both locales expose exactly the same keys', () => {
  expect(enKeys).toEqual(viKeys);
});

test('no translation is left empty', () => {
  for (const locale of ['vi', 'en'] as const) {
    for (const [key, value] of Object.entries(translations[locale])) {
      const text = typeof value === 'string' ? value : `${value.one}${value.other}`;
      expect({ locale, key, empty: text.trim() === '' }).toEqual({
        locale,
        key,
        empty: false,
      });
    }
  }
});

test('interpolates parameters', () => {
  expect(translate('vi', 'spot.parkedFor', { ago: '5 phút trước' })).toBe('Đậu 5 phút trước');
  expect(translate('en', 'spot.parkedFor', { ago: '5 minutes ago' })).toBe('Parked 5 minutes ago');
});

test('picks the plural form from the count', () => {
  expect(translate('en', 'spot.daysLeft', { count: 1 })).toBe('1 day left');
  expect(translate('en', 'spot.daysLeft', { count: 5 })).toBe('5 days left');
  expect(translate('vi', 'spot.daysLeft', { count: 1 })).toBe('còn 1 ngày');
});

test('an unknown key never crashes and returns the key itself', () => {
  // @ts-expect-error deliberately unknown key
  expect(translate('en', 'does.not.exist')).toBe('does.not.exist');
});

test('resolveLocale follows the setting, then the device language', () => {
  expect(resolveLocale('vi', 'en-US')).toBe('vi');
  expect(resolveLocale('en', 'vi-VN')).toBe('en');
  expect(resolveLocale('system', 'vi-VN')).toBe('vi');
  expect(resolveLocale('system', 'en-GB')).toBe('en');
  expect(resolveLocale('system', null)).toBe('en');
});
