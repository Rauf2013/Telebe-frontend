import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { COUNTRIES, UNIVERSITIES, getFacultyName, getCountryName, getUniversityName, getCityName } from '../data/universities';
import { useAuthStore, dashboardPath } from '../store/authStore';
import type { University } from '../types';

/* ----------------------------------------------------------------
   Flag — clean PNG icons from flagcdn (not emoji, works on Windows)
   ---------------------------------------------------------------- */
function Flag({ code, className = 'w-7 h-5' }: { code: string; className?: string }) {
  const lower = code.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w80/${lower}.png`}
      srcSet={`https://flagcdn.com/w160/${lower}.png 2x`}
      alt={code}
      className={`${className} object-cover rounded-sm shadow-sm border border-slate-200/60`}
      loading="lazy"
    />
  );
}

export default function Universities() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const ctaUrl = user ? dashboardPath(user.role) : '/register';
  const ctaLabel = user ? t('home.goToCabinet') : t('universities.applyNow');
  const [country, setCountry] = useState<string>('all');
  const [city, setCity] = useState<string>('all');
  const [q, setQ] = useState('');
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  // Cities of the currently selected country
  const cities = useMemo(() => {
    if (country === 'all') return [];
    const set = new Set(UNIVERSITIES.filter(u => u.countryCode === country).map(u => u.city));
    return Array.from(set);
  }, [country]);

  const list = useMemo(() => {
    return UNIVERSITIES.filter(u => {
      if (country !== 'all' && u.countryCode !== country) return false;
      if (city !== 'all' && u.city !== city) return false;
      if (q) {
        const s = q.toLowerCase();
        const uName = getUniversityName(t, u).toLowerCase();
        const uCity = getCityName(t, u.city).toLowerCase();
        if (!uName.includes(s) && !uCity.includes(s)
            && !u.faculties.some(f => getFacultyName(t, f).toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [country, city, q, t]);

  const totalFaculties = list.reduce((acc, u) => acc + u.faculties.length, 0);
  const totalUniFaculties = UNIVERSITIES.reduce((a, u) => a + u.faculties.length, 0);

  // Toggle: clicking the active country deactivates it (back to "all")
  function handleCountryClick(code: string) {
    if (country === code) {
      setCountry('all');
      setCity('all');
    } else {
      setCountry(code);
      setCity('all');
    }
  }

  // ESC closes the modal
  useEffect(() => {
    if (!selectedUni) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedUni(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedUni]);

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
        {/* Country tiles: flag on top, name below */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 mb-4">
          <CountryTile
            active={country === 'all'}
            onClick={() => { setCountry('all'); setCity('all'); }}
            label={t('student.all')}
            icon={
              <span className="w-7 h-5 rounded-sm bg-gradient-to-br from-brand-200 to-indigo-200 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
                </svg>
              </span>
            }
          />
          {COUNTRIES.map(c => (
            <CountryTile
              key={c.code}
              active={country === c.code}
              onClick={() => handleCountryClick(c.code)}
              label={getCountryName(t, c)}
              icon={<Flag code={c.code} />}
            />
          ))}
        </div>

        {/* City sub-filter — appears only when a country is selected */}
        {country !== 'all' && cities.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-[fadeIn_0.25s_ease-out]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
              {t('student.country')}:
            </span>
            <FilterChip active={city === 'all'} onClick={() => setCity('all')}>
              {t('student.all')}
            </FilterChip>
            {cities.map(c => (
              <FilterChip key={c} active={city === c} onClick={() => setCity(c === city ? 'all' : c)}>
                {getCityName(t, c)}
              </FilterChip>
            ))}
          </div>
        )}

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
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setSelectedUni(u)}
                  className="card text-left p-6 hover:shadow-lg hover:-translate-y-0.5 transition group cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    {/* Flag avatar (replaces the first-letter badge) */}
                    <div className="w-14 h-10 rounded-lg overflow-hidden shadow-sm border border-slate-200 flex-shrink-0 bg-slate-50">
                      <img
                        src={`https://flagcdn.com/w160/${u.countryCode.toLowerCase()}.png`}
                        alt={u.countryCode}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                      <Flag code={u.countryCode} className="w-4 h-3" />
                      {getCountryName(t, cc)}
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
                </button>
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

      {/* University detail modal */}
      {selectedUni && (
        <UniversityModal university={selectedUni} onClose={() => setSelectedUni(null)} ctaUrl={ctaUrl} />
      )}
    </div>
  );
}

/* ---- Country tile button (flag on top, label below) ---- */
function CountryTile({ active, onClick, label, icon }: {
  active: boolean; onClick: () => void; label: string; icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border transition ${
        active
          ? 'bg-brand-50 text-brand-700 border-brand-400 shadow ring-2 ring-brand-300/40'
          : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:shadow-sm'
      }`}
    >
      {icon}
      <span className="text-xs font-medium leading-tight text-center mt-0.5">{label}</span>
    </button>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} type="button"
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
        active ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
      }`}>
      {children}
    </button>
  );
}

/* ---- University detail modal ---- */
function UniversityModal({ university, onClose, ctaUrl }: {
  university: University; onClose: () => void; ctaUrl: string;
}) {
  const { t } = useTranslation();
  const cc = COUNTRIES.find(c => c.code === university.countryCode);
  const uName = getUniversityName(t, university);
  const totalFee = university.faculties.reduce((sum, f) => sum + (f.tuitionFee ?? 0), 0);
  const avgFee = university.faculties.length ? Math.round(totalFee / university.faculties.length) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={uName}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 hover:bg-slate-100 flex items-center justify-center text-slate-600 shadow-sm z-10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 text-white p-7 sm:p-8 rounded-t-2xl">
          <div className="flex items-start gap-4">
            <div className="w-20 h-14 rounded-lg overflow-hidden shadow-lg border-2 border-white/30 flex-shrink-0 bg-white/10">
              <img
                src={`https://flagcdn.com/w320/${university.countryCode.toLowerCase()}.png`}
                alt={university.countryCode}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-brand-100 text-xs font-medium uppercase tracking-wider">
                {getCountryName(t, cc)} · {getCityName(t, university.city)}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1 leading-tight">{uName}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/15">
              <p className="text-[11px] text-brand-100 uppercase tracking-wider font-semibold">
                {t('universities.facultiesLabel')}
              </p>
              <p className="text-2xl font-bold mt-0.5">{university.faculties.length}</p>
            </div>
            {avgFee > 0 && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/15">
                <p className="text-[11px] text-brand-100 uppercase tracking-wider font-semibold">
                  {t('student.tuition')}
                </p>
                <p className="text-2xl font-bold mt-0.5">~${avgFee}</p>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              {t('universities.facultiesLabel')} ({university.faculties.length})
            </h3>
            <ul className="space-y-2">
              {university.faculties.map(f => (
                <li key={f.id} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 transition rounded-xl">
                  <span className="text-sm font-medium text-slate-800">{getFacultyName(t, f)}</span>
                  {f.tuitionFee && (
                    <span className="text-sm text-brand-700 font-semibold whitespace-nowrap ml-3">
                      ${f.tuitionFee}<span className="text-xs text-slate-400 font-normal">/year</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <Link to={ctaUrl} className="btn-primary w-full justify-center text-base py-3" onClick={onClose}>
            {t('universities.applyNow')}
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
