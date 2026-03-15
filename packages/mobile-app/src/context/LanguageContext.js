import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import '../i18n';

const defaultValue = {
  lang: 'en',
  changeLang: () => {},
  t: (key) => key,
};

const LanguageContext = createContext(defaultValue);

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('appLang').then(saved => {
      if (saved === 'ta' || saved === 'en') {
        setLang(saved);
        i18n.changeLanguage(saved);
      }
    }).catch(() => {});
  }, []);

  const changeLang = async (newLang) => {
    setLang(newLang);
    await i18n.changeLanguage(newLang);
    try { await AsyncStorage.setItem('appLang', newLang); } catch {}
  };

  const t = (key) => i18n.t(key);

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  return ctx || defaultValue;
};