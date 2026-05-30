import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-100 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ink-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <p className="font-display text-sm font-bold text-ink-900 leading-tight">EduGate</p>
              <p className="text-[11px] text-ink-500">{t('footer.tagline')}</p>
            </div>
          </Link>

          <nav className="flex items-center gap-5 text-sm text-ink-500">
            <Link to="/universities" className="hover:text-ink-900 transition">{t('nav.universities')}</Link>
            <Link to="/about"        className="hover:text-ink-900 transition">{t('nav.about')}</Link>
            <Link to="/contact"      className="hover:text-ink-900 transition">{t('nav.contact')}</Link>
          </nav>

          <p className="text-xs text-ink-500">
            © {year} EduGate · {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
