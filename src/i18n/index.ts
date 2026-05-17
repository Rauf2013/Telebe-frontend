import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import az from './locales/az.json';
import tr from './locales/tr.json';
import kk from './locales/kk.json';
import uz from './locales/uz.json';
import tg from './locales/tg.json';
import tk from './locales/tk.json';
import ky from './locales/ky.json';

export type LangCode = 'az' | 'tr' | 'kk' | 'uz' | 'tg' | 'tk' | 'ky';

export const SUPPORTED_LANGUAGES: { code: LangCode; name: string; nativeName: string; flag: string }[] = [
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan',  flag: 'AZ' },
  { code: 'tr', name: 'Turkish',     nativeName: 'Türkçe',      flag: 'TR' },
  { code: 'kk', name: 'Kazakh',      nativeName: 'Қазақ',       flag: 'KZ' },
  { code: 'uz', name: 'Uzbek',       nativeName: 'Oʻzbek',      flag: 'UZ' },
  { code: 'tg', name: 'Tajik',       nativeName: 'Тоҷикӣ',      flag: 'TJ' },
  { code: 'tk', name: 'Turkmen',     nativeName: 'Türkmen',     flag: 'TM' },
  { code: 'ky', name: 'Kyrgyz',      nativeName: 'Кыргыз',      flag: 'KG' },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      az: { translation: az },
      tr: { translation: tr },
      kk: { translation: kk },
      uz: { translation: uz },
      tg: { translation: tg },
      tk: { translation: tk },
      ky: { translation: ky },
    },
    fallbackLng: 'az',
    supportedLngs: ['az', 'tr', 'kk', 'uz', 'tg', 'tk', 'ky'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'app_lang',
    },
  });

export default i18n;
