import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, dashboardPath } from '../store/authStore';
import { UNIVERSITIES } from '../data/universities';
import type { UserRole } from '../types';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register = useAuthStore(s => s.register);
  const user = useAuthStore(s => s.user);

  const [role, setRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [universityId, setUniversityId] = useState(UNIVERSITIES[0].id);
  const [err, setErr] = useState('');

  // Already logged in — redirect to dashboard
  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const res = await register({
      email, password, fullName, role, phone, whatsapp,
      universityId: role === 'university' ? universityId : undefined,
    });
    if (!res.ok) {
      setErr(t(`auth.${res.error}`));
      return;
    }
    navigate(dashboardPath(role));
  }

  // Moderator hesabları yalnız sistem admini tərəfindən yaradılır
  const roles: { value: UserRole; label: string }[] = [
    { value: 'student',    label: t('auth.roleStudent') },
    { value: 'university', label: t('auth.roleUniversity') },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('auth.registerTitle')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('auth.registerSubtitle')}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">{t('auth.role')}</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition ${
                    role === r.value
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">{t('auth.fullName')}</label>
            <input className="input" required value={fullName}
                   onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('auth.email')}</label>
            <input className="input" type="email" required value={email}
                   onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('auth.password')}</label>
            <input className="input" type="password" required minLength={6} value={password}
                   onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('auth.phone')}</label>
            <input className="input" type="tel" value={phone}
                   onChange={e => setPhone(e.target.value)} placeholder="+994 ..." />
          </div>
          {role === 'student' && (
            <div>
              <label className="label">{t('auth.whatsapp')}</label>
              <input className="input" type="tel" value={whatsapp}
                     onChange={e => setWhatsapp(e.target.value)} placeholder="+994 ..." />
            </div>
          )}
          {role === 'university' && (
            <div>
              <label className="label">{t('university.selectUni')}</label>
              <select className="input" value={universityId}
                      onChange={e => setUniversityId(e.target.value)}>
                {UNIVERSITIES.map(u => (
                  <option key={u.id} value={u.id}>{u.name} — {u.city}</option>
                ))}
              </select>
            </div>
          )}

          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          <button type="submit" className="btn-primary w-full">{t('auth.submitRegister')}</button>
        </form>

        <p className="mt-5 text-sm text-slate-600 text-center">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
