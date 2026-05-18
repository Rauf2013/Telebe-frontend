import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';

/**
 * Forgot password — link-based flow.
 *
 * Step 1 (this page): user enters their email → backend emails a one-time link.
 * Step 2 (separate page `/reset-password/:token`): user clicks the link in the
 * email and lands on the new-password form.
 *
 * There are no 6-digit codes anywhere in this flow — losing the email simply
 * means starting again.
 */
export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      await api('/api/auth/forgot-password', { body: { email } });
      // Server returns OK even if the email doesn't exist — never leak account presence.
      setSent(true);
    } catch (e) {
      const c = (e as { code?: string }).code;
      setErr(t(`auth.${c ?? 'unknownError'}`, { defaultValue: t('auth.unknownError') }));
    }
    setSubmitting(false);
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('auth.resetLinkSentTitle')}</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {t('auth.resetLinkSentDesc', { email })}
          </p>
          <p className="mt-4 text-xs text-slate-400">
            {t('auth.resetLinkHint')}
          </p>
          <Link to="/login" className="btn-secondary w-full mt-6 inline-flex">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('auth.forgotTitle')}</h1>
            <p className="text-xs text-slate-500">{t('auth.forgotLinkSubtitle')}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">{t('auth.email')}</label>
            <input className="input" type="email" required value={email}
                   onChange={e => setEmail(e.target.value)} autoFocus
                   placeholder="email@example.com" />
          </div>

          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>
          )}

          <button type="submit" disabled={submitting || !email}
                  className="btn-primary w-full disabled:opacity-50">
            {submitting ? t('auth.sending') : t('auth.sendResetLink')}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600 text-center">
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
