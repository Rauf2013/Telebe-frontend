import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="text-7xl font-bold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">{t('notFound.title')}</h1>
      <p className="mt-2 text-slate-600">{t('notFound.desc')}</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">{t('notFound.back')}</Link>
    </div>
  );
}
