import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';

type Status = 'checking' | 'ok' | 'invalid' | 'expired' | 'done';

/**
 * Landing page for the reset link emailed to the user.
 *
 * URL: /reset-password/:token
 *
 * On mount we GET /api/auth/verify-reset-token/:token to confirm the token
 * is still valid before showing the new-password form. If the token is
 * expired or unknown, we render a friendly explanation + a link back to
 * /forgot-password so they can request a fresh one.
 */
export default function ResetPassword() {
  const { t } = useTranslation();
  const { token = '' } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>('checking');
  const [maskedEmail, setMaskedEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await api<{ ok: boolean; email: string; expiresAt: string }>(
          `/api/auth/verify-reset-token/${token}`,
        );
        setMaskedEmail(r.email);
        setStatus('ok');
      } catch (e) {
        const code = (e as { code?: string }).code;
        setStatus(code === 'expired_token' ? 'expired' : 'invalid');
      }
    })();
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (password !== confirm) { setErr(t('auth.passwordMismatch')); return; }
    if (password.length < 6)  { setErr(t('auth.weakPassword'));    return; }
    setSubmitting(true);
    try {
      await api('/api/auth/reset-password', { body: { token, newPassword: password } });
      setStatus('done');
      // Auto-redirect after a moment so the success state stays visible briefly.
      setTimeout(() => navigate('/login'), 2200);
    } catch (e) {
      const c = (e as { code?: string }).code;
      if (c === 'expired_token') setStatus('expired');
      else if (c === 'invalid_token') setStatus('invalid');
      else setErr(t(`auth.${c ?? 'unknownError'}`, { defaultValue: t('auth.unknownError') }));
    }
    setSubmitting(false);
  }

  if (status === 'checking') {
    return <CenterCard><p className="text-slate-500">{t('common.loading')}</p></CenterCard>;
  }

  if (status === 'invalid' || status === 'expired') {
    return (
      <CenterCard
        icon={status === 'expired' ? '⏱' : '✗'}
        title={t(status === 'expired' ? 'auth.resetExpiredTitle' : 'auth.resetInvalidTitle')}
        desc={t(status === 'expired' ? 'auth.resetExpiredDesc' : 'auth.resetInvalidDesc')}
      >
        <Link to="/forgot-password" className="btn-primary mt-6 inline-flex">
          {t('auth.requestNewLink')}
        </Link>
      </CenterCard>
    );
  }

  if (status === 'done') {
    return (
      <CenterCard
        icon="✓"
        title={t('auth.resetPassword')}
        desc={t('auth.resetSuccess')}
      >
        <Link to="/login" className="btn-primary mt-6 inline-flex">
          {t('auth.backToLogin')}
        </Link>
      </CenterCard>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('auth.newPasswordLabel')}</h1>
            <p className="text-xs text-slate-500">{maskedEmail}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">{t('auth.newPasswordLabel')}</label>
            <input className="input" type="password" required minLength={6}
                   value={password} onChange={e => setPassword(e.target.value)}
                   autoFocus placeholder="••••••" />
            <p className="text-[11px] text-slate-400 mt-1">{t('invite.passwordHint')}</p>
          </div>

          <div>
            <label className="label">{t('auth.passwordConfirm')}</label>
            <input className="input" type="password" required minLength={6}
                   value={confirm} onChange={e => setConfirm(e.target.value)}
                   placeholder="••••••" />
          </div>

          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>
          )}

          <button type="submit" disabled={submitting || !password || !confirm}
                  className="btn-primary w-full disabled:opacity-50">
            {submitting ? t('common.saving') : t('auth.resetPassword')}
          </button>
        </form>
      </div>
    </div>
  );
}

function CenterCard({ icon, title, desc, children }: {
  icon?: string; title?: string; desc?: string; children?: React.ReactNode;
}) {
  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="card p-8 text-center">
        {icon && (
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-3xl mb-4">
            {icon}
          </div>
        )}
        {title && <h1 className="text-xl font-bold text-slate-900">{title}</h1>}
        {desc && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{desc}</p>}
        {children}
      </div>
    </div>
  );
}
