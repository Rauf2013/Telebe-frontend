import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, dashboardPath } from '../store/authStore';

export default function About() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const ctaUrl = user ? dashboardPath(user.role) : '/register';
  const ctaLabel = user ? t('home.goToCabinet') : t('about.ctaButton');

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <p className="text-brand-100 text-sm font-medium uppercase tracking-wider">{t('about.eyebrow')}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl">
            {t('about.heroTitle')}
          </h1>
          <p className="mt-5 text-lg text-brand-100 max-w-2xl">{t('about.heroDesc')}</p>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="card p-8">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t('about.missionTitle')}</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">{t('about.missionText')}</p>
          </div>

          <div className="card p-8">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t('about.visionTitle')}</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">{t('about.visionText')}</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {t('about.valuesTitle')}
          </h2>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl">{t('about.valuesSubtitle')}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {[
              { key: 'value1', classes: 'bg-emerald-100 text-emerald-700' },
              { key: 'value2', classes: 'bg-brand-100 text-brand-700' },
              { key: 'value3', classes: 'bg-indigo-100 text-indigo-700' },
              { key: 'value4', classes: 'bg-amber-100 text-amber-700' },
            ].map((v) => (
              <div key={v.key} className="card p-6">
                <div className={`w-10 h-10 rounded-lg ${v.classes} flex items-center justify-center font-bold text-lg mb-3`}>
                  ✓
                </div>
                <h3 className="font-semibold text-slate-900">{t(`about.${v.key}.title`)}</h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{t(`about.${v.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-5xl font-bold text-brand-700">7</p>
            <p className="mt-2 text-slate-600">{t('about.stat1Label')}</p>
          </div>
          <div>
            <p className="text-5xl font-bold text-brand-700">7</p>
            <p className="mt-2 text-slate-600">{t('about.stat2Label')}</p>
          </div>
          <div>
            <p className="text-5xl font-bold text-brand-700">100+</p>
            <p className="mt-2 text-slate-600">{t('about.stat3Label')}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-12 sm:px-12 sm:py-16 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('about.ctaTitle')}</h2>
          <p className="mt-3 text-brand-100 max-w-xl mx-auto">{t('about.ctaDesc')}</p>
          <Link to={ctaUrl} className="inline-flex items-center px-6 py-3 mt-6 rounded-lg bg-white text-brand-700 font-semibold hover:bg-brand-50 transition">
            {ctaLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
