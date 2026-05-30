import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useState } from 'react';
import { useAuthStore, dashboardPath } from '../store/authStore';

export default function Navbar() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  function onLogout() { logout(); navigate('/'); }

  const links = [
    { to: '/',              label: t('nav.home') },
    { to: '/universities',  label: t('nav.universities') },
    { to: '/about',         label: t('nav.about') },
    { to: '/contact',       label: t('nav.contact') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* logo — flat single-tone, no harsh gradient */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-ink-900 flex items-center justify-center group-hover:bg-brand-700 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="font-display font-bold text-ink-900 text-[17px] tracking-tight">EduGate</span>
          </Link>

          {/* desktop nav — quieter, refined active state */}
          <nav className="hidden md:flex items-center gap-0.5">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                    isActive ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* right side */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <>
                  <Link to={dashboardPath(user.role)} className="btn-secondary text-sm">
                    {t('nav.dashboard')}
                  </Link>
                  <button onClick={onLogout} className="btn-ghost text-sm">{t('nav.logout')}</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost text-sm">{t('nav.login')}</Link>
                  <Link to="/register" className="btn-primary text-sm">{t('nav.register')}</Link>
                </>
              )}
            </div>
            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'text-brand-700 bg-brand-50' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="pt-2 flex gap-2 sm:hidden">
              {user ? (
                <>
                  <Link to={dashboardPath(user.role)} onClick={() => setMenuOpen(false)} className="btn-secondary flex-1 text-sm">{t('nav.dashboard')}</Link>
                  <button onClick={() => { setMenuOpen(false); onLogout(); }} className="btn-ghost flex-1 text-sm">{t('nav.logout')}</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1 text-sm">{t('nav.login')}</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-sm">{t('nav.register')}</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
