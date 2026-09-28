import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language, TranslationKey, translations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isRTL: boolean;
  isFA: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const RTL_LANGUAGES: Language[] = ['fa'];

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('bmm_language');
    if (saved === 'fa' || saved === 'en') return saved;
    return 'en';
  });

  const isRTL = RTL_LANGUAGES.includes(language);
  const isFA = language === 'fa';

  useEffect(() => {
    const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bmm_language', lang);
  };

  const toggleLanguage = () => { setLanguage(language === 'en' ? 'fa' : 'en'); };

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      let text = (translations[language] as any)?.[key] ?? (translations['en'] as any)?.[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRTL, isFA }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};