import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';

type Step = 'email' | 'code' | 'password' | 'done';

const errorMap: Record<string, string> = {
  invalid_code: 'invalidCode',
  expired_code: 'expiredCode',
  too_many_attempts: 'tooManyAttempts',
  weak_password: 'weakPassword',
  network_error: 'networkError',
};

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  function setErrorFrom(e: unknown) {
    const c = (e as { code?: string }).code;
    setErr(t(`auth.${c && errorMap[c] ? errorMap[c] : 'unknownError'}`));
  }

  // STEP 1 → send code
  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setSubmitting(true);
    try {
      await api('/api/auth/forgot-password', { body: { email } });
      setStep('code');
    } catch (e) { setErrorFrom(e); }
    setSubmitting(false);
  }

  // STEP 2 → verify code (don't consume yet)
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (code.length !== 6) { setErr(t('auth.invalidCode')); return; }
    setSubmitting(true);
    try {
      await api('/api/auth/verify-reset-code', { body: { email, code } });
      setStep('password');
    } catch (e) { setErrorFrom(e); }
    setSubmitting(false);
  }

  // STEP 3 → submit new password
  async function resetPwd(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (newPassword.length < 6) { setErr(t('auth.weakPassword')); return; }
    setSubmitting(true);
    try {
      await api('/api/auth/reset-password', { body: { email, code, newPassword } });
      setStep('done');
      setTimeout(() => navigate('/login'), 2500);
    } catch (e) {
      setErrorFrom(e);
      // Kod hatası → kod adımına geri dön
      const c = (e as { code?: string }).code;
      if (c === 'invalid_code' || c === 'expired_code' || c === 'too_many_attempts') {
        setStep('code');
        setCode('');
      }
    }
    setSubmitting(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="card p-8">
        {/* DONE STATE */}
        {step === 'done' ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{t('auth.resetPassword')}</h1>
            <p className="mt-3 text-sm text-slate-600">{t('auth.resetSuccess')}</p>
            <Link to="/login" className="btn-primary w-full mt-6 inline-flex">{t('auth.backToLogin')}</Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{t('auth.forgotTitle')}</h1>
                <p className="text-xs text-slate-500">{t('auth.forgotSubtitle')}</p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              <StepDot active={step === 'email'} done={step !== 'email'} n={1} label="Email" />
              <div className="flex-1 h-px bg-slate-200" />
              <StepDot active={step === 'code'} done={step === 'password'} n={2} label={t('auth.codeLabel')} />
              <div className="flex-1 h-px bg-slate-200" />
              <StepDot active={step === 'password'} done={false} n={3} label={t('auth.newPasswordLabel')} />
            </div>

            {/* STEP 1: email */}
            {step === 'email' && (
              <form onSubmit={sendCode} className="space-y-4">
                <div>
                  <label className="label">{t('auth.email')}</label>
                  <input className="input" type="email" required value={email}
                         onChange={e => setEmail(e.target.value)} autoFocus />
                </div>

                {err && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>
                )}

                <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                  {submitting ? t('auth.sending') : t('auth.sendCode')}
                </button>
              </form>
            )}

            {/* STEP 2: code */}
            {step === 'code' && (
              <>
                <div className="mb-5 p-3 bg-brand-50 border border-brand-100 rounded-lg">
                  <p className="text-xs text-brand-800">{t('auth.codeSentDesc', { email })}</p>
                </div>

                <form onSubmit={verifyCode} className="space-y-4">
                  <div>
                    <label className="label">{t('auth.codeLabel')}</label>
                    <input className="input text-center text-2xl font-bold tracking-[0.5em]"
                           inputMode="numeric" maxLength={6} pattern="[0-9]{6}"
                           required value={code}
                           onChange={e => setCode(e.target.value.replace(/\D/g, ''))} autoFocus
                           placeholder="000000" />
                  </div>

                  {err && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>
                  )}

                  <button type="submit" disabled={submitting || code.length !== 6}
                          className="btn-primary w-full disabled:opacity-50">
                    {submitting ? t('common.loading') : t('common.next')}
                  </button>

                  <button type="button" onClick={() => { setStep('email'); setCode(''); setErr(''); }}
                          className="w-full text-xs text-slate-500 hover:text-brand-600 transition">
                    ← {t('common.back')}
                  </button>
                </form>
              </>
            )}

            {/* STEP 3: new password */}
            {step === 'password' && (
              <>
                <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xs text-emerald-800 font-medium">{t('auth.codeLabel')} ✓</p>
                </div>

                <form onSubmit={resetPwd} className="space-y-4">
                  <div>
                    <label className="label">{t('auth.newPasswordLabel')}</label>
                    <input className="input" type="password" required minLength={6}
                           value={newPassword}
                           onChange={e => setNewPassword(e.target.value)} autoFocus
                           placeholder="••••••" />
                    <p className="text-[11px] text-slate-400 mt-1">{t('invite.passwordHint')}</p>
                  </div>

                  {err && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>
                  )}

                  <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                    {submitting ? t('common.saving') : t('auth.resetPassword')}
                  </button>
                </form>
              </>
            )}

            <p className="mt-5 text-sm text-slate-600 text-center">
              <Link to="/login" className="text-brand-600 font-medium hover:underline">
                {t('auth.backToLogin')}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function StepDot({ active, done, n, label }: { active: boolean; done: boolean; n: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
        done ? 'bg-emerald-500 text-white'
        : active ? 'bg-brand-600 text-white ring-4 ring-brand-100'
        : 'bg-slate-100 text-slate-400'
      }`}>
        {done ? '✓' : n}
      </div>
      <span className={`text-[10px] mt-1 font-medium ${active ? 'text-brand-700' : 'text-slate-400'}`}>
        {label.split(' ')[0]}
      </span>
    </div>
  );
}
