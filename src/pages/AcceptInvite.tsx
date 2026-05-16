import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, setToken } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

type Status = 'checking' | 'ok' | 'invalid' | 'used' | 'expired';

export default function AcceptInvite() {
  const { t } = useTranslation();
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('checking');
  const [info, setInfo] = useState<{ expiresAt?: string; note?: string }>({});

  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await api<{ ok: boolean; expiresAt: string; note?: string }>(`/api/invites/${token}`);
        setInfo({ expiresAt: r.expiresAt, note: r.note });
        setStatus('ok');
      } catch (e) {
        const code = (e as { code?: string }).code;
        setStatus(code === 'already_used' ? 'used' : code === 'expired' ? 'expired' : 'invalid');
      }
    })();
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (form.password.length < 6) { setErr(t('auth.weakPassword')); return; }
    setSubmitting(true);
    try {
      const r = await api<{ user: User; token: string }>(`/api/invites/${token}/accept`, { body: form });
      setToken(r.token);
      useAuthStore.setState({ user: r.user });
      navigate('/moderator');
    } catch (e) {
      const code = (e as { code?: string }).code;
      setErr(
        code === 'email_exists' ? t('auth.emailExists')
        : code === 'expired' ? t('invite.expiredError')
        : code === 'already_used' ? t('invite.alreadyUsedError')
        : t('common.error')
      );
    }
    setSubmitting(false);
  }

  if (status === 'checking') {
    return <CenterCard><p className="text-slate-500">{t('invite.checking')}</p></CenterCard>;
  }
  if (status === 'invalid') {
    return <CenterCard icon="✗" title={t('invite.invalidTitle')} desc={t('invite.invalidDesc')} />;
  }
  if (status === 'used') {
    return <CenterCard icon="✓" title={t('invite.usedTitle')} desc={t('invite.usedDesc')} />;
  }
  if (status === 'expired') {
    return <CenterCard icon="⏱" title={t('invite.expiredTitle')} desc={t('invite.expiredDesc')} />;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-14">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-700 flex items-center justify-center text-white text-xl">
            ✦
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{t('invite.eyebrow')}</p>
            <h1 className="text-xl font-bold text-slate-900">{t('invite.welcome')}</h1>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{t('invite.subtitle')}</p>

        {info.note && (
          <div className="mt-4 p-3 bg-brand-50 border border-brand-100 rounded-lg">
            <p className="text-xs text-brand-700"><strong>{t('invite.noteLabel')}:</strong> {info.note}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">{t('auth.fullName')}</label>
            <input className="input" required value={form.fullName}
                   onChange={e => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('auth.email')}</label>
            <input className="input" type="email" required value={form.email}
                   onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('auth.phone')}</label>
            <input className="input" type="tel" value={form.phone}
                   onChange={e => setForm({ ...form, phone: e.target.value })} placeholder={t('invite.phonePlaceholder')} />
          </div>
          <div>
            <label className="label">{t('auth.password')}</label>
            <input className="input" type="password" required minLength={6} value={form.password}
                   onChange={e => setForm({ ...form, password: e.target.value })} />
            <p className="text-[11px] text-slate-400 mt-1">{t('invite.passwordHint')}</p>
          </div>

          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? t('invite.submitting') : t('invite.submit')}
          </button>
        </form>

        {info.expiresAt && (
          <p className="text-[11px] text-slate-400 text-center mt-5">
            {t('invite.validUntil')}: {new Date(info.expiresAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

function CenterCard({ icon, title, desc, children }: {
  icon?: string; title?: string; desc?: string; children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="card p-8 text-center">
        {icon && (
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-3xl mb-4">
            {icon}
          </div>
        )}
        {title && <h1 className="text-xl font-bold text-slate-900">{title}</h1>}
        {desc && <p className="text-sm text-slate-600 mt-2">{desc}</p>}
        {children}
        <Link to="/" className="btn-secondary mt-6 inline-flex">{t('nav.home')}</Link>
      </div>
    </div>
  );
}
