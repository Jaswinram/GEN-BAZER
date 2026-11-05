import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, TranslationDictionary } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationDictionary) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('gen_baazar_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gen_baazar_lang', lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: keyof TranslationDictionary): string => {
    return translations[language][key] || translations.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

