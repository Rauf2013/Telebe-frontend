import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { COUNTRIES, UNIVERSITIES, getFacultyName, getCountryName, getUniversityName, getCityName } from '../data/universities';
import { useAuthStore, dashboardPath } from '../store/authStore';

export default function Universities() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const ctaUrl = user ? dashboardPath(user.role) : '/register';
  const ctaLabel = user ? t('home.goToCabinet') : t('universities.applyNow');
  const [country, setCountry] = useState<string>('all');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    return UNIVERSITIES.filter(u => {
      if (country !== 'all' && u.countryCode !== country) return false;
      if (q) {
        const s = q.toLowerCase();
        const uName = getUniversityName(t, u).toLowerCase();
        const uCity = getCityName(t, u.city).toLowerCase();
        if (!uName.includes(s) && !uCity.includes(s)
            && !u.faculties.some(f => getFacultyName(t, f).toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [country, q, t]);

  const totalFaculties = list.reduce((acc, u) => acc + u.faculties.length, 0);
  const totalUniFaculties = UNIVERSITIES.reduce((a, u) => a + u.faculties.length, 0);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{t('nav.universities')}</h1>
          <p className="mt-3 text-lg text-brand-100 max-w-2xl">
            {t('universities.subtitle', { u: UNIVERSITIES.length, f: totalUniFaculties })}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="flex-1 relative">
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={t('universities.searchPlaceholder')}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters + list */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterChip active={country === 'all'} onClick={() => setCountry('all')}>
            {t('student.all')}
          </FilterChip>
          {COUNTRIES.map(c => (
            <FilterChip key={c.code} active={country === c.code} onClick={() => setCountry(c.code)}>
              {c.flag} {getCountryName(t, c)}
            </FilterChip>
          ))}
        </div>

        <p className="text-sm text-slate-500 mb-4">
          {t('universities.showing', { count: list.length, f: totalFaculties })}
        </p>

        {list.length === 0 ? (
          <div className="card p-12 text-center text-slate-500">{t('universities.noResults')}</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map(u => {
              const cc = COUNTRIES.find(c => c.code === u.countryCode);
              const uName = getUniversityName(t, u);
              return (
                <div key={u.id} className="card p-6 hover:shadow-lg hover:-translate-y-0.5 transition group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">
                      {uName.charAt(0)}
                    </div>
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                      {cc?.flag} {getCountryName(t, cc)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 transition">{uName}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{getCityName(t, u.city)}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      {t('universities.facultiesLabel')} ({u.faculties.length})
                    </p>
                    <ul className="space-y-1">
                      {u.faculties.slice(0, 3).map(f => (
                        <li key={f.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{getFacultyName(t, f)}</span>
                          {f.tuitionFee && (
                            <span className="text-xs text-slate-500">${f.tuitionFee}</span>
                          )}
                        </li>
                      ))}
                      {u.faculties.length > 3 && (
                        <li className="text-xs text-brand-600 font-medium">
                          {t('universities.more', { n: u.faculties.length - 3 })}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link to={ctaUrl} className="btn-primary inline-flex">
            {ctaLabel}
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
        active ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
      }`}>
      {children}
    </button>
  );
}
