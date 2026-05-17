import type { University, Country } from '../types';

export const COUNTRIES: Country[] = [
  { code: 'TR', name: 'Türkiyə',     flag: 'TR' },
  { code: 'KZ', name: 'Qazaxıstan',  flag: 'KZ' },
  { code: 'UZ', name: 'Özbəkistan',  flag: 'UZ' },
  { code: 'TJ', name: 'Tacikistan',  flag: 'TJ' },
  { code: 'TM', name: 'Türkmənistan',flag: 'TM' },
  { code: 'AZ', name: 'Azərbaycan',  flag: 'AZ' },
];

export const UNIVERSITIES: University[] = [
  {
    id: 'u1', name: 'İstanbul Universiteti', countryCode: 'TR', city: 'İstanbul',
    faculties: [
      { id: 'u1-f1', key: 'medicine',    name: 'Tibb',         tuitionFee: 8500 },
      { id: 'u1-f2', key: 'law',         name: 'Hüquq',        tuitionFee: 4200 },
      { id: 'u1-f3', key: 'engineering', name: 'Mühəndislik',  tuitionFee: 5000 },
      { id: 'u1-f4', key: 'economics',   name: 'İqtisadiyyat', tuitionFee: 3800 },
    ],
  },
  {
    id: 'u2', name: 'Ankara Universiteti', countryCode: 'TR', city: 'Ankara',
    faculties: [
      { id: 'u2-f1', key: 'dentistry',         name: 'Diş həkimliyi', tuitionFee: 7200 },
      { id: 'u2-f2', key: 'political_science', name: 'Politologiya',  tuitionFee: 3500 },
      { id: 'u2-f3', key: 'informatics',       name: 'İnformatika',   tuitionFee: 4800 },
    ],
  },
  {
    id: 'u3', name: 'Al-Farabi KazNU', countryCode: 'KZ', city: 'Almatı',
    faculties: [
      { id: 'u3-f1', key: 'international_relations', name: 'Beynəlxalq əlaqələr', tuitionFee: 3000 },
      { id: 'u3-f2', key: 'philology',               name: 'Filologiya',          tuitionFee: 2500 },
      { id: 'u3-f3', key: 'mathematics',             name: 'Riyaziyyat',          tuitionFee: 2800 },
    ],
  },
  {
    id: 'u4', name: 'Nazarbayev Universiteti', countryCode: 'KZ', city: 'Astana',
    faculties: [
      { id: 'u4-f1', key: 'engineering',      name: 'Mühəndislik',  tuitionFee: 9000 },
      { id: 'u4-f2', key: 'business',         name: 'Biznes',       tuitionFee: 8000 },
      { id: 'u4-f3', key: 'natural_sciences', name: 'Təbii elmlər', tuitionFee: 7500 },
    ],
  },
  {
    id: 'u5', name: 'Daşkənd Dövlət Universiteti', countryCode: 'UZ', city: 'Daşkənd',
    faculties: [
      { id: 'u5-f1', key: 'history',          name: 'Tarix',         tuitionFee: 2200 },
      { id: 'u5-f2', key: 'oriental_studies', name: 'Şərqşünaslıq',  tuitionFee: 2400 },
      { id: 'u5-f3', key: 'chemistry',        name: 'Kimya',         tuitionFee: 2600 },
    ],
  },
  {
    id: 'u6', name: 'Səmərqənd Dövlət Universiteti', countryCode: 'UZ', city: 'Səmərqənd',
    faculties: [
      { id: 'u6-f1', key: 'architecture', name: 'Memarlıq',  tuitionFee: 3200 },
      { id: 'u6-f2', key: 'pedagogy',     name: 'Pedaqogika', tuitionFee: 1800 },
    ],
  },
  {
    id: 'u7', name: 'Dushanbe Texniki Universiteti', countryCode: 'TJ', city: 'Düşənbə',
    faculties: [
      { id: 'u7-f1', key: 'energy',     name: 'Energetika',     tuitionFee: 1900 },
      { id: 'u7-f2', key: 'automotive', name: 'Avtomobilçilik', tuitionFee: 2100 },
    ],
  },
  {
    id: 'u8', name: 'Magtymguly Türkmen Dövlət Universiteti', countryCode: 'TM', city: 'Aşqabad',
    faculties: [
      { id: 'u8-f1', key: 'turkmen_language', name: 'Türkmen dili', tuitionFee: 1500 },
      { id: 'u8-f2', key: 'geography',        name: 'Coğrafiya',    tuitionFee: 1700 },
    ],
  },
];

export function findUniversity(id: string) {
  return UNIVERSITIES.find(u => u.id === id);
}
export function findFaculty(uniId: string, facId: string) {
  return findUniversity(uniId)?.faculties.find(f => f.id === facId);
}

/* ---- i18n helpers ---- */
// Faculty name'i çevirir — varsa key'i, yoksa düz az name döner
export function getFacultyName(t: (k: string, opts?: { defaultValue?: string }) => string, faculty?: { key?: string; name: string }): string {
  if (!faculty) return '';
  if (faculty.key) return t(`faculty.${faculty.key}`, { defaultValue: faculty.name });
  return faculty.name;
}
// Country name'i çevirir
export function getCountryName(t: (k: string, opts?: { defaultValue?: string }) => string, c?: { code: string; name: string }): string {
  if (!c) return '';
  return t(`country.${c.code}`, { defaultValue: c.name });
}
// University name (proper noun ama isteğe bağlı çeviri olabilir)
export function getUniversityName(t: (k: string, opts?: { defaultValue?: string }) => string, u?: { id: string; name: string }): string {
  if (!u) return '';
  return t(`university.${u.id}`, { defaultValue: u.name });
}
// City
export function getCityName(t: (k: string, opts?: { defaultValue?: string }) => string, city: string): string {
  return t(`city.${city}`, { defaultValue: city });
}
