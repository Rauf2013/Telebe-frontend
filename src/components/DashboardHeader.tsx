import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationBell from './NotificationBell';

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

export default function DashboardHeader({ eyebrow, title, subtitle }: Props) {
  const { t } = useTranslation();
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('common.backToHome')}
        </Link>

        <div className="flex items-center gap-1">
          <NotificationBell />
          <Link to="/profile" className="p-2 rounded-lg hover:bg-slate-100 transition" aria-label="Profil">
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </div>

      <p className="text-sm text-brand-600 font-medium">{eyebrow}</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
