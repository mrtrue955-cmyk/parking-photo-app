import { getLocales } from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getParkingService } from '../container';
import { DEFAULT_SETTINGS, type Language } from '../domain/settings';
import { formatTimeAgo } from './format';
import { intlLocale, resolveLocale, translate, type TranslationParams } from './translate';
import type { Locale, TranslationKey } from './translations';

type I18nValue = {
  locale: Locale;
  language: Language;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  setLanguage: (language: Language) => Promise<void>;
  formatDate: (ts: number) => string;
  formatTimeAgo: (ts: number, now: number) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

function deviceLanguage(): string | null {
  try {
    return getLocales()[0]?.languageCode ?? null;
  } catch {
    return null;
  }
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

/** Locale for code that runs outside React (notification handlers, background tasks). */
export async function localeFromSettings(): Promise<Locale> {
  try {
    const settings = await (await getParkingService()).getSettings();
    return resolveLocale(settings.language, deviceLanguage());
  } catch {
    return 'vi';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_SETTINGS.language);

  useEffect(() => {
    let alive = true;
    getParkingService()
      .then((service) => service.getSettings())
      .then((settings) => {
        if (alive) setLanguageState(settings.language);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const locale = useMemo(() => resolveLocale(language, deviceLanguage()), [language]);

  const setLanguage = useCallback(async (next: Language) => {
    const service = await getParkingService();
    await service.updateSettings({ language: next });
    setLanguageState(next);
  }, []);

  const value = useMemo<I18nValue>(() => {
    const t = (key: TranslationKey, params?: TranslationParams) => translate(locale, key, params);
    const formatDate = (ts: number) =>
      new Intl.DateTimeFormat(intlLocale(locale), DATE_OPTIONS).format(new Date(ts));
    return {
      locale,
      language,
      t,
      setLanguage,
      formatDate,
      formatTimeAgo: (ts, now) => formatTimeAgo(ts, now, locale),
    };
  }, [locale, language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}

export type { Locale, TranslationKey };
export { translate, formatTimeAgo };
