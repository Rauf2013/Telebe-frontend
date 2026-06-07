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

/* Map ISO country codes (from browser locale region) to our supported app
   language. This is how the spec's "lokasiyaya uyğun dildə yüklənəcək" works:
   we read the user's browser locale and route them to the matching language. */
const COUNTRY_TO_LANG: Record<string, LangCode> = {
  AZ: 'az', TR: 'tr', KZ: 'kk', UZ: 'uz',
  TJ: 'tg', TM: 'tk', KG: 'ky',
};

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
    load: 'languageOnly', // strip region: "tr-TR" → "tr"
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'app_lang',
    },
  });

// Secondary pass: if the browser locale has a region we can map to one of our
// languages but the user's primary language tag (e.g. ru, en) isn't supported,
// pick the regional match before falling back to 'az'.
if (typeof window !== 'undefined' && !localStorage.getItem('app_lang')) {
  const langs = (navigator.languages || [navigator.language || '']).map(l => l.split('-'));
  for (const [primary, region] of langs) {
    const supported = ['az', 'tr', 'kk', 'uz', 'tg', 'tk', 'ky'];
    if (primary && supported.includes(primary.toLowerCase())) break; // detector already handled
    if (region) {
      const mapped = COUNTRY_TO_LANG[region.toUpperCase()];
      if (mapped) { i18n.changeLanguage(mapped); break; }
    }
  }
}

export default i18n;
