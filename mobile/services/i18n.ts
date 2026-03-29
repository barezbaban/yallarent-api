import { I18n } from 'i18n-js';
import * as SecureStore from 'expo-secure-store';
import en from '../locales/en';
import ar from '../locales/ar';
import ku from '../locales/ku';

const i18n = new I18n({ en, ar, ku });

i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

const LANGUAGE_KEY = 'app_language';

export type Language = 'en' | 'ar' | 'ku';

export const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'ku', label: 'Kurdish', nativeLabel: 'کوردی' },
];

export function isRTL(): boolean {
  return i18n.locale === 'ar' || i18n.locale === 'ku';
}

export async function loadSavedLanguage(): Promise<Language> {
  try {
    const saved = await SecureStore.getItemAsync(LANGUAGE_KEY);
    if (saved && (saved === 'en' || saved === 'ar' || saved === 'ku')) {
      i18n.locale = saved;
      return saved;
    }
  } catch {}
  return 'en';
}

export async function setLanguage(lang: Language) {
  i18n.locale = lang;
  await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
}

export function t(key: string, options?: Record<string, any>): string {
  return i18n.t(key, options);
}

export default i18n;
