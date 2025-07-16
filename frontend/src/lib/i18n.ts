import { useState, useEffect } from 'react';

import koCommon from '@/locales/ko/common.json';
import enCommon from '@/locales/en/common.json';

export type Language = 'ko' | 'en';

const translations = {
  ko: { common: koCommon },
  en: { common: enCommon },
};

export function useTranslation(namespace: 'common' = 'common') {
  const [language, setLanguage] = useState<Language>('ko');

  useEffect(() => {
    // Check localStorage for saved language preference
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['ko', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // Default to Korean
      setLanguage('ko');
      localStorage.setItem('language', 'ko');
    }
  }, []);

  const toggleLanguage = () => {
    const newLanguage = language === 'ko' ? 'en' : 'ko';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translations[language][namespace];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      return key; // Return key if translation not found
    }
    
    // Replace parameters in the translation
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  };

  return { t, language, toggleLanguage };
}