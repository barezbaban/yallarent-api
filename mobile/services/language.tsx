import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { loadSavedLanguage, setLanguage as setI18nLanguage, isRTL, type Language } from './i18n';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => Promise<void>;
  isRTL: boolean;
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  changeLanguage: async () => {},
  isRTL: false,
  ready: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSavedLanguage().then((lang) => {
      setLanguage(lang);
      setReady(true);
    });
  }, []);

  const changeLanguage = useCallback(async (lang: Language) => {
    await setI18nLanguage(lang);
    setLanguage(lang);
    const rtl = lang === 'ar' || lang === 'ku';
    I18nManager.forceRTL(rtl);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isRTL: isRTL(), ready }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
