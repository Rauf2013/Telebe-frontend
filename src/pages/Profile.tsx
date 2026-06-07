import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, dashboardPath } from '../store/authStore';
import { api, setToken } from '../api/client';
import type { User } from '../types';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user)!;
  const setUserState = (u: User) => useAuthStore.setState({ user: u });

  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(user.whatsapp ?? '');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [current, setCurrent] = useState('');
  const [nextPw, setNextPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await api<{ user: User; token: string }>('/api/auth/me', {
        method: 'PATCH', body: { fullName, phone, whatsapp },
      });
      setToken(r.token);
      setUserState(r.user);
      setMsg({ type: 'ok', text: t('profile.saved') });
    } catch {
      setMsg({ type: 'err', text: t('profile.error') });
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (nextPw.length < 6) {
      setPwMsg({ type: 'err', text: t('profile.weakPassword') });
      return;
    }
    try {
      await api('/api/auth/password', { body: { current, next: nextPw } });
      setPwMsg({ type: 'ok', text: t('profile.passwordChanged') });
      setCurrent(''); setNextPw('');
    } catch (e) {
      const code = (e as { code?: string }).code;
      setPwMsg({ type: 'err', text: code === 'wrong_password' ? t('profile.wrongPassword') : t('profile.error') });
    }
  }

  const roleLabel = user.role === 'student' ? t('auth.roleStudent')
                  : user.role === 'university' ? t('auth.roleUniversity')
                  : t('dashboard.moderator');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(dashboardPath(user.role))}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 mb-3">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {t('common.backToCabinet')}
      </button>

      <div className="card p-6 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
            <p className="text-sm text-slate-500">{user.email} · {roleLabel}</p>
            {user.role === 'student' && user.studentCode && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-100">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                  {t('profile.studentCode')}
                </span>
                <span className="font-mono font-bold text-brand-700 text-sm tabular-nums">
                  {user.studentCode}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 mb-5">
        <h2 className="font-bold text-slate-900 mb-1">{t('profile.personalInfo')}</h2>
        <p className="text-sm text-slate-500 mb-5">{t('profile.personalInfoHint')}</p>

        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="label">{t('auth.fullName')}</label>
            <input className="input" required value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('auth.email')}</label>
            <input className="input bg-slate-50 text-slate-500" value={user.email} disabled />
            <p className="text-[11px] text-slate-400 mt-1">{t('profile.emailCannotChange')}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('auth.phone')}</label>
              <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+994 ..." />
            </div>
            <div>
              <label className="label">{t('auth.whatsapp')}</label>
              <input className="input" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+994 ..." />
            </div>
          </div>

          {msg && (
            <div className={`text-sm rounded-lg px-3 py-2 border ${
              msg.type === 'ok'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-red-600 bg-red-50 border-red-200'
            }`}>{msg.text}</div>
          )}

          <button type="submit" className="btn-primary">{t('profile.save')}</button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-slate-900 mb-1">{t('profile.changePassword')}</h2>
        <p className="text-sm text-slate-500 mb-5">{t('profile.changePasswordHint')}</p>

        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="label">{t('profile.currentPassword')}</label>
            <input className="input" type="password" required value={current} onChange={e => setCurrent(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('profile.newPassword')}</label>
            <input className="input" type="password" required minLength={6} value={nextPw} onChange={e => setNextPw(e.target.value)} />
          </div>

          {pwMsg && (
            <div className={`text-sm rounded-lg px-3 py-2 border ${
              pwMsg.type === 'ok'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-red-600 bg-red-50 border-red-200'
            }`}>{pwMsg.text}</div>
          )}

          <button type="submit" className="btn-primary">{t('profile.changePassword')}</button>
        </form>
      </div>
    </div>
  );
}
