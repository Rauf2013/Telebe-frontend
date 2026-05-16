import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, dashboardPath } from '../store/authStore';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const user = useAuthStore(s => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  // Already logged in — redirect to dashboard
  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const res = await login(email, password);
    if (!res.ok) {
      setErr(t(`auth.${res.error}`));
      return;
    }
    const user = useAuthStore.getState().user!;
    navigate(dashboardPath(user.role));
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('auth.loginTitle')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('auth.loginSubtitle')}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">{t('auth.email')}</label>
            <input className="input" type="email" required value={email}
                   onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">{t('auth.password')}</label>
              <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline font-medium">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <input className="input" type="password" required value={password}
                   onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </div>

          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          <button type="submit" className="btn-primary w-full">{t('auth.submit')}</button>
        </form>

        <p className="mt-5 text-sm text-slate-600 text-center">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
}
