import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, setToken } from '../api/client';
import { useAuthStore, dashboardPath } from '../store/authStore';
import { UNIVERSITIES, getUniversityName } from '../data/universities';
import type { User } from '../types';

type Status = 'checking' | 'ok' | 'invalid' | 'used' | 'expired';
type Kind = 'moderator' | 'university';

interface InviteInfo {
  kind: Kind;
  expiresAt?: string;
  note?: string;
  targetEmail?: string;
  targetName?: string;
  universityId?: string;
}

/**
 * Hidden registration window — reached ONLY via an invite link sent by a moderator.
 *
 * Handles two kinds of invites:
 *   - `moderator`  → new moderator account
 *   - `university` → new university-representative account (universityId locked from invite)
 *
 * There are no public links to this page; the URL `/invite/:token` is unguessable.
 * Normal users can't see the form because they don't have a valid token.
 */
export default function AcceptInvite() {
  const { t } = useTranslation();
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('checking');
  const [info, setInfo] = useState<InviteInfo>({ kind: 'moderator' });

  // Pre-fill email when the moderator addressed the invite to a specific person.
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', whatsapp: '' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await api<{
          ok: boolean; kind: Kind; expiresAt: string; note?: string;
          targetEmail?: string; targetName?: string; universityId?: string;
        }>(`/api/invites/${token}`);
        setInfo({
          kind: r.kind, expiresAt: r.expiresAt, note: r.note,
          targetEmail: r.targetEmail, targetName: r.targetName, universityId: r.universityId,
        });
        // Lock the email + name fields to whatever the moderator set, since this is a personal invite.
        setForm(f => ({
          ...f,
          email: r.targetEmail ?? f.email,
          fullName: r.targetName ?? f.fullName,
        }));
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
      const r = await api<{ user: User; token: string; role: 'moderator' | 'university' }>(
        `/api/invites/${token}/accept`, { body: form },
      );
      setToken(r.token);
      useAuthStore.setState({ user: r.user });
      navigate(dashboardPath(r.role));
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

  const isUni = info.kind === 'university';
  const lockedUni = isUni && info.universityId
    ? UNIVERSITIES.find(u => u.id === info.universityId)
    : undefined;

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-14">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl ${
            isUni
              ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
              : 'bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-700'
          }`}>
            {isUni ? '🎓' : '✦'}
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
              {isUni ? t('auth.roleUniversity') : t('invite.eyebrow')}
            </p>
            <h1 className="text-xl font-bold text-slate-900">{t('invite.welcome')}</h1>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{t('invite.subtitle')}</p>

        {/* Show the moderator's note (e.g. "Hi Ali, you're the new Bishkek rep!") */}
        {info.note && (
          <div className="mt-4 p-3 bg-brand-50 border border-brand-100 rounded-lg">
            <p className="text-xs text-brand-700"><strong>{t('invite.noteLabel')}:</strong> {info.note}</p>
          </div>
        )}

        {/* University card — read-only, comes from the invite itself */}
        {isUni && lockedUni && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
              {t('university.title')}
            </p>
            <p className="font-bold text-slate-900">{getUniversityName(t, lockedUni)}</p>
            <p className="text-xs text-slate-600 mt-0.5">{lockedUni.city}</p>
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
            <input className="input" type="email" required
                   readOnly={!!info.targetEmail}
                   value={form.email}
                   onChange={e => setForm({ ...form, email: e.target.value })} />
            {info.targetEmail && (
              <p className="text-[11px] text-slate-400 mt-1">Email is fixed by the invite.</p>
            )}
          </div>
          <div>
            <label className="label">{t('auth.phone')}</label>
            <input className="input" type="tel" value={form.phone}
                   onChange={e => setForm({ ...form, phone: e.target.value })} placeholder={t('invite.phonePlaceholder')} />
          </div>
          {isUni && (
            <div>
              <label className="label">{t('auth.whatsapp')}</label>
              <input className="input" type="tel" value={form.whatsapp}
                     onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+994 ..." />
            </div>
          )}
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
