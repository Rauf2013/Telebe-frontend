import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, dashboardPath } from '../store/authStore';
import { COUNTRIES, getCountryName } from '../data/universities';

/**
 * Public registration page — students ONLY.
 *
 * University representatives can no longer self-register here; they must be invited
 * by a moderator via a one-time email link (see ModeratorDashboard → uni invites,
 * and AcceptInvite.tsx for the hidden landing page).
 *
 * Flow:
 *   1. Student fills the form → POST /api/auth/register → server sends an SMS OTP
 *   2. Component swaps to the OTP screen → POST /api/auth/verify-otp creates the user
 */
export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register = useAuthStore(s => s.register);
  const verifyOtp = useAuthStore(s => s.verifyOtp);
  const resendOtp = useAuthStore(s => s.resendOtp);
  const user = useAuthStore(s => s.user);

  // Step 1 — registration form fields, in the exact order the brief specified:
  //   Ad Soyad → Ölkə → Şəhər → Email → Telefon → WhatsApp → Şifrə → Şifrə təsdiqi
  const [fullName, setFullName] = useState('');
  const [country, setCountry]   = useState('');
  const [city, setCity]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  // Step 2 — OTP entry
  const [otpPhone, setOtpPhone] = useState<string | null>(null);
  const [otpCode, setOtpCode]   = useState('');
  const [otpErr, setOtpErr]     = useState('');
  const [otpInfo, setOtpInfo]   = useState('');

  // Already logged in — redirect to dashboard
  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (password !== confirm) { setErr(t('auth.passwordMismatch')); return; }
    if (password.length < 6)  { setErr(t('auth.weakPassword'));    return; }
    setSubmitting(true);
    const res = await register({
      email, password, fullName, phone, whatsapp,
      country, city,
    });
    setSubmitting(false);
    if (!res.ok) {
      setErr(t(`auth.${res.error ?? 'unknownError'}`));
      return;
    }
    // Switch to OTP screen — verifyOtp will materialize the user and log them in.
    setOtpPhone(res.phone || phone);
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setOtpErr('');
    setOtpInfo('');
    setSubmitting(true);
    const res = await verifyOtp(otpPhone!, otpCode.trim());
    setSubmitting(false);
    if (!res.ok) {
      setOtpErr(t(`auth.${res.error ?? 'unknownError'}`));
      return;
    }
    navigate('/student');
  }

  async function onResend() {
    if (!otpPhone) return;
    setOtpErr('');
    const res = await resendOtp(otpPhone);
    if (res.ok) setOtpInfo(t('auth.resent'));
    else setOtpErr(t(`auth.${res.error ?? 'unknownError'}`));
  }

  /* ---------- OTP step ---------- */
  if (otpPhone) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white text-2xl">
              📱
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t('auth.otpTitle')}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{t('auth.otpSubtitle', { phone: otpPhone })}</p>
            </div>
          </div>

          <form onSubmit={onVerify} className="space-y-4">
            <div>
              <label className="label">{t('auth.otpCodeLabel')}</label>
              <input
                className="input text-center text-2xl tracking-[0.5em] font-bold"
                required maxLength={6} inputMode="numeric" pattern="\d{6}"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
              />
            </div>

            {otpInfo && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {otpInfo}
              </div>
            )}
            {otpErr && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {otpErr}
              </div>
            )}

            <button type="submit" disabled={submitting || otpCode.length !== 6}
                    className="btn-primary w-full disabled:opacity-50">
              {submitting ? t('common.loading') : t('auth.verifyOtp')}
            </button>

            <button type="button" onClick={onResend}
                    className="w-full text-sm text-brand-600 hover:underline">
              {t('auth.resendOtp')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ---------- Step 1: registration form ---------- */
  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('auth.registerTitle')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('auth.registerSubtitle')}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* 1. Ad Soyad */}
          <div>
            <label className="label">{t('auth.fullName')}</label>
            <input className="input" required value={fullName}
                   onChange={e => setFullName(e.target.value)} />
          </div>

          {/* 2. Ölkə */}
          <div>
            <label className="label">{t('auth.country')}</label>
            <select className="input" required value={country}
                    onChange={e => setCountry(e.target.value)}>
              <option value="" disabled>{t('auth.selectCountry')}</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{getCountryName(t, c)}</option>
              ))}
            </select>
          </div>

          {/* 3. Şəhər */}
          <div>
            <label className="label">{t('auth.city')}</label>
            <input className="input" required value={city}
                   onChange={e => setCity(e.target.value)} />
          </div>

          {/* 4. Email */}
          <div>
            <label className="label">{t('auth.email')}</label>
            <input className="input" type="email" required value={email}
                   onChange={e => setEmail(e.target.value)} />
          </div>

          {/* 5. Telefon — used for SMS OTP */}
          <div>
            <label className="label">{t('auth.phone')}</label>
            <input className="input" type="tel" required value={phone}
                   onChange={e => setPhone(e.target.value)} placeholder="+994 ..." />
          </div>

          {/* 6. WhatsApp */}
          <div>
            <label className="label">{t('auth.whatsapp')}</label>
            <input className="input" type="tel" required value={whatsapp}
                   onChange={e => setWhatsapp(e.target.value)} placeholder="+994 ..." />
          </div>

          {/* 7. Şifrə */}
          <div>
            <label className="label">{t('auth.password')}</label>
            <input className="input" type="password" required minLength={6} value={password}
                   onChange={e => setPassword(e.target.value)} />
          </div>

          {/* 8. Şifrə təsdiqi */}
          <div>
            <label className="label">{t('auth.passwordConfirm')}</label>
            <input className="input" type="password" required minLength={6} value={confirm}
                   onChange={e => setConfirm(e.target.value)} />
          </div>

          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? t('common.loading') : t('auth.submitRegister')}
          </button>
        </form>

        {/* University rep hint — points them to the moderator since self-signup is not allowed for them. */}
        <div className="mt-5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('auth.uniRepHint')}{' '}
            <Link to="/contact" className="text-brand-600 font-medium hover:underline">
              {t('auth.contactModerator')} →
            </Link>
          </p>
        </div>

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
