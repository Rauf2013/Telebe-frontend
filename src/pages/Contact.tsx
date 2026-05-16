import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setForm({ name: '', email: '', subject: '', message: '' });
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">{t('contact.eyebrow')}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl">
            {t('contact.heroTitle')}
          </h1>
          <p className="mt-4 text-lg text-emerald-100 max-w-xl">{t('contact.heroDesc')}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact cards */}
          <div className="lg:col-span-1 space-y-4">
            <ContactCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              title={t('contact.email')}
              value="info@edugate.az"
              href="mailto:info@edugate.az"
              classes="bg-brand-100 text-brand-700"
            />
            <ContactCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.49a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.49 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" /></svg>}
              title={t('contact.phone')}
              value="+994 12 555 55 55"
              href="tel:+994125555555"
              classes="bg-indigo-100 text-indigo-700"
            />
            <ContactCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
              title={t('contact.whatsapp')}
              value="+994 50 555 55 55"
              href="https://wa.me/994505555555"
              classes="bg-emerald-100 text-emerald-700"
            />
            <ContactCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              title={t('contact.office')}
              value={t('contact.officeAddress')}
              classes="bg-amber-100 text-amber-700"
            />
          </div>

          {/* Form */}
          <div className="lg:col-span-2 card p-8">
            <h2 className="text-2xl font-bold text-slate-900">{t('contact.formTitle')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t('contact.formSubtitle')}</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('contact.name')}</label>
                  <input className="input" required value={form.name}
                         onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="label">{t('contact.emailLabel')}</label>
                  <input className="input" type="email" required value={form.email}
                         onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">{t('contact.subject')}</label>
                <input className="input" required value={form.subject}
                       onChange={e => setForm({...form, subject: e.target.value})} />
              </div>
              <div>
                <label className="label">{t('contact.message')}</label>
                <textarea className="input min-h-[140px]" required value={form.message}
                          onChange={e => setForm({...form, message: e.target.value})} />
              </div>

              {sent && (
                <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {t('contact.successMessage')}
                </div>
              )}

              <button type="submit" className="btn-primary w-full sm:w-auto">{t('contact.send')}</button>
            </form>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t('contact.faqTitle')}</h2>

          <div className="mt-8 space-y-3 max-w-3xl">
            {[1, 2, 3, 4].map((n) => (
              <details key={n} className="card p-5 cursor-pointer group">
                <summary className="font-medium text-slate-900 list-none flex items-center justify-between">
                  {t(`contact.faq${n}Q`)}
                  <svg className="w-5 h-5 text-slate-400 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{t(`contact.faq${n}A`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactCard({ icon, title, value, href, classes }: {
  icon: React.ReactNode; title: string; value: string; href?: string; classes: string;
}) {
  const inner = (
    <div className="card p-5 hover:shadow-md transition">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-3 ${classes}`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{title}</p>
      <p className="mt-1 text-slate-900 font-semibold text-sm">{value}</p>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noreferrer">{inner}</a> : inner;
}
