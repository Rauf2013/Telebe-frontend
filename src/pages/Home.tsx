import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import ActivityFeed from '../components/ActivityFeed';
import { UNIVERSITIES, COUNTRIES, findFaculty, findUniversity, getFacultyName, getCountryName, getUniversityName, getCityName } from '../data/universities';
import { api } from '../api/client';
import { useAuthStore, dashboardPath } from '../store/authStore';
import { useAppStore } from '../store/applicationStore';
import type { User, Application } from '../types';

interface Notification {
  id: string; type: string; title: string; message: string;
  link?: string; readAt?: string; createdAt: string;
}

export default function Home() {
  const user = useAuthStore(s => s.user);
  return user ? <LoggedInHome user={user} /> : <GuestHome />;
}

/* ====================================================
   LOGGED-IN HOME — Tamamen kişiselleştirilmiş
   ==================================================== */
function LoggedInHome({ user }: { user: User }) {
  const { t } = useTranslation();
  const myApp = useAppStore(s => s.myApp);
  const apps = useAppStore(s => s.applications);
  const dashUrl = dashboardPath(user.role);

  const [notifs, setNotifs] = useState<Notification[]>([]);
  useEffect(() => {
    api<{ notifications: Notification[] }>('/api/notifications')
      .then(r => setNotifs(r.notifications.slice(0, 5)))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <PersonalHero user={user} myApp={myApp} apps={apps} dashUrl={dashUrl} />

      {/* QUICK ACCESS + ACTIVITY — tamamen ayrı bölüm, beyaz arka plan */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sol: Quick access + Liste */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('home.quickAccess')}</h2>
                <QuickActions user={user} myApp={myApp} apps={apps} />
              </div>

              {user.role === 'student' && myApp && <StudentApplications myApp={myApp} />}
              {user.role === 'moderator' && <ModeratorOverview apps={apps} />}
              {user.role === 'university' && <UniversityOverview user={user} apps={apps} />}
            </div>

            {/* Sağ: Recent activity + Tip */}
            <aside className="space-y-5">
              <div className="card p-5">
                <h3 className="font-bold text-slate-900 mb-3">{t('home.recentActivity')}</h3>
                {notifs.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">{t('home.noActivity')}</p>
                ) : (
                  <ul className="space-y-3">
                    {notifs.map(n => (
                      <li key={n.id} className="flex items-start gap-2.5">
                        {!n.readAt && <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />}
                        <div className={!n.readAt ? '' : 'pl-[14px]'}>
                          <p className="text-sm font-medium text-slate-900 leading-snug">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{timeAgo(n.createdAt, t)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card p-5 bg-gradient-to-br from-brand-50 to-indigo-50 border-brand-100">
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-slate-900 mt-0.5">{t('home.tipsTitle')}</h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {user.role === 'student' ? t('home.tipStudent')
                   : user.role === 'moderator' ? t('home.tipModerator')
                   : t('home.tipUniversity')}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---- Personal Hero ---- */
function PersonalHero({ user, myApp, apps, dashUrl }: {
  user: User; myApp: Application | null; apps: Application[]; dashUrl: string;
}) {
  const { t } = useTranslation();

  // Progress (student için)
  let progress = 0;
  if (user.role === 'student' && myApp) {
    const choices = (myApp.choices?.length ?? 0) > 0 ? 25 : 0;
    const docs = (myApp.documents?.length ?? 0) >= 4 ? 25 : 0;
    const pay1 = myApp.firstPaymentPaid ? 25 : 0;
    const pay2 = myApp.secondPaymentPaid ? 25 : 0;
    progress = choices + docs + pay1 + pay2;
  }

  // Role-based KPI
  let kpi = 0, kpiLabel = '';
  if (user.role === 'moderator') {
    kpi = apps.length;
    kpiLabel = t('moderator.title');
  } else if (user.role === 'university') {
    kpi = apps.flatMap(a => a.choices).filter(c =>
      c.universityId === user.universityId && (c.status === 'under_review' || c.status === 'sent_to_university')
    ).length;
    kpiLabel = t('home.pendingForYou');
  }

  const primaryLabel = user.role === 'student' && myApp ? t('home.continueApplication')
                     : user.role === 'student'           ? t('home.startApplication')
                     :                                     t('home.viewApplications');

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 text-white">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white rounded-full blur-3xl opacity-10" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white rounded-full blur-3xl opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid lg:grid-cols-5 gap-8 items-center">
          {/* Left: welcome */}
          <div className="lg:col-span-3">
            <p className="text-brand-100 text-xs font-medium uppercase tracking-wider mb-2">EduGate</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              {t('home.welcomeBack', { name: user.fullName.split(' ')[0] })}
            </h1>
            <p className="mt-4 text-base lg:text-lg text-brand-100 max-w-xl">
              {user.role === 'student'    ? t('home.studentLoggedInDesc')
               : user.role === 'university' ? t('home.universityLoggedInDesc')
               :                              t('home.moderatorLoggedInDesc')}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={dashUrl}
                    className="inline-flex items-center px-6 py-3 rounded-xl bg-white text-brand-700 font-semibold hover:bg-brand-50 transition shadow-lg">
                {primaryLabel}
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right: stat card */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white text-brand-700 flex items-center justify-center text-xl font-extrabold">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{user.fullName}</p>
                  <p className="text-xs text-brand-100 truncate">{user.email}</p>
                </div>
              </div>

              {user.role === 'student' ? (
                myApp ? (
                  <>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-brand-100">{t('home.continueApplication')}</span>
                        <span className="font-bold text-white">{progress}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-white rounded-full h-2 transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-brand-100">
                      {myApp.choices?.length ?? 0} / 5 · {(myApp.documents?.length ?? 0)}/4 sənəd
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-brand-100">{t('home.noApplicationYet')}</p>
                )
              ) : (
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                  <span className="text-xs text-brand-100">{kpiLabel}</span>
                  <span className="text-3xl font-extrabold text-white">{kpi}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- Icons (SVG) ---- */
const Icons = {
  application: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  university: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  list: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  translate: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  ),
  inbox: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3l-2 3h-6l-2-3H4" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

/* ---- Quick Action Cards ---- */
function QuickActions({ user, myApp, apps }: { user: User; myApp: Application | null; apps: Application[] }) {
  const { t } = useTranslation();

  if (user.role === 'student') {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <ActionCard
          to="/student" color="bg-brand-100 text-brand-700"
          title={myApp ? t('home.continueApplication') : t('home.startApplication')}
          subtitle={myApp ? `${myApp.choices.length}/5 fakultə` : '—'}
          icon={Icons.application}
        />
        <ActionCard to="/universities" color="bg-indigo-100 text-indigo-700"
          title={t('nav.universities')} subtitle={`${UNIVERSITIES.length} universitet`} icon={Icons.university} />
        <ActionCard to="/profile" color="bg-emerald-100 text-emerald-700"
          title={t('nav.dashboard')} subtitle={user.email} icon={Icons.profile} />
      </div>
    );
  }

  if (user.role === 'moderator') {
    const pending = apps.filter(a => a.firstPaymentPaid && !a.documents.every(d => d.translatedUrl)).length;
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <ActionCard to="/moderator" color="bg-brand-100 text-brand-700"
          title={t('moderator.title')} subtitle={`${apps.length} müraciət`} icon={Icons.list} />
        <ActionCard to="/moderator" color="bg-orange-100 text-orange-700"
          title={t('moderator.filterTranslation')} subtitle={`${pending} gözləyir`} icon={Icons.translate} />
        <ActionCard to="/profile" color="bg-emerald-100 text-emerald-700"
          title={t('nav.dashboard')} subtitle={user.email} icon={Icons.profile} />
      </div>
    );
  }

  // university
  const myChoices = apps.flatMap(a => a.choices).filter(c => c.universityId === user.universityId);
  const pending = myChoices.filter(c => c.status === 'under_review' || c.status === 'sent_to_university').length;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <ActionCard to="/university" color="bg-brand-100 text-brand-700"
        title={t('university.title')} subtitle={`${myChoices.length} cəmi`} icon={Icons.inbox} />
      <ActionCard to="/university" color="bg-orange-100 text-orange-700"
        title={t('home.pendingForYou')} subtitle={`${pending} gözləyir`} icon={Icons.clock} />
      <ActionCard to="/profile" color="bg-emerald-100 text-emerald-700"
        title={t('nav.dashboard')} subtitle={user.email} icon={Icons.profile} />
    </div>
  );
}

function ActionCard({ to, color, title, subtitle, icon }: {
  to: string; color: string; title: string; subtitle: string; icon: React.ReactNode;
}) {
  return (
    <Link to={to} className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{subtitle}</p>
      </div>
      <svg className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/* ---- Student: faculty list ---- */
function StudentApplications({ myApp }: { myApp: Application }) {
  const { t } = useTranslation();
  if (myApp.choices.length === 0) return null;

  const colorMap: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    in_translation: 'bg-indigo-100 text-indigo-700',
    sent_to_university: 'bg-violet-100 text-violet-700',
    under_review: 'bg-cyan-100 text-cyan-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-3">{t('home.yourApplications')}</h2>
      <div className="space-y-2">
        {myApp.choices.map(c => {
          const u = findUniversity(c.universityId);
          const f = findFaculty(c.universityId, c.facultyId);
          return (
            <div key={c.facultyId} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-700 text-white flex items-center justify-center font-bold flex-shrink-0">
                {getUniversityName(t, u).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{getFacultyName(t, f)}</p>
                <p className="text-xs text-slate-500 truncate">{getUniversityName(t, u)} · {getCityName(t, u?.city ?? '')}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colorMap[c.status] ?? 'bg-slate-100 text-slate-700'}`}>
                {t(`student.status.${c.status}`)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Moderator: overview ---- */
function ModeratorOverview({ apps }: { apps: Application[] }) {
  const { t } = useTranslation();
  const recent = apps.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-slate-500">
        {t('moderator.noApps')}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-3">{t('moderator.title')}</h2>
      <div className="space-y-2">
        {recent.map(a => (
          <Link key={a.id} to="/moderator" className="card p-4 flex items-center gap-3 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {a.choices.length}/5
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {a.choices.length} fakultə · {a.documents.length}/4 sənəd
              </p>
              <p className="text-xs text-slate-500">
                {a.firstPaymentPaid ? '✓ Ödəniş alındı' : 'Ödəniş gözlənilir'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---- University: pending ---- */
function UniversityOverview({ user, apps }: { user: User; apps: Application[] }) {
  const { t } = useTranslation();
  const myChoices = apps.flatMap(a => a.choices.map(c => ({ ...c, appId: a.id })))
    .filter(c => c.universityId === user.universityId)
    .slice(0, 5);

  if (myChoices.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-slate-500">
        {t('university.noPending')}
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    under_review: 'bg-cyan-100 text-cyan-700',
    sent_to_university: 'bg-violet-100 text-violet-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-3">{t('university.title')}</h2>
      <div className="space-y-2">
        {myChoices.map(c => {
          const f = findFaculty(c.universityId, c.facultyId);
          return (
            <Link key={c.facultyId + c.appId} to="/university" className="card p-4 flex items-center gap-3 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{getFacultyName(t, f)}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colorMap[c.status] ?? 'bg-slate-100 text-slate-700'}`}>
                {t(`student.status.${c.status}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ====================================================
   GUEST HOME — marketing
   ==================================================== */
function GuestHome() {
  const { t } = useTranslation();
  const universities = UNIVERSITIES.length;
  const faculties = UNIVERSITIES.reduce((acc, u) => acc + u.faculties.length, 0);
  const [applications, setApplications] = useState(0);
  const [accepted, setAccepted] = useState(0);

  useEffect(() => {
    api<{ applications: number; accepted: number }>('/api/stats')
      .then(r => { setApplications(r.applications); setAccepted(r.accepted); })
      .catch(() => {});
  }, []);

  /* Carousel: rotating sample students */
  const carouselUsers = [
    {
      initial: 'A', name: 'Aysel A.',
      gradient: 'from-brand-500 to-brand-700',
      topLabel: 'İstanbul Univ.',
      items: [
        { name: 'İstanbul Univ. — Tibb',           statusKey: 'approved',       cls: 'bg-emerald-100 text-emerald-700' },
        { name: 'Nazarbayev Univ.',                statusKey: 'under_review',   cls: 'bg-cyan-100 text-cyan-700' },
        { name: 'Daşkənd Dövlət Univ.',            statusKey: 'in_translation', cls: 'bg-indigo-100 text-indigo-700' },
      ],
    },
    {
      initial: 'L', name: 'Leyla S.',
      gradient: 'from-indigo-500 to-purple-700',
      topLabel: 'Al-Farabi KazNU',
      items: [
        { name: 'Al-Farabi KazNU — Riyaziyyat',    statusKey: 'approved',       cls: 'bg-emerald-100 text-emerald-700' },
        { name: 'Səmərqənd Dövlət Univ.',          statusKey: 'under_review',   cls: 'bg-cyan-100 text-cyan-700' },
        { name: 'Qırğız Milli Univ.',              statusKey: 'in_translation', cls: 'bg-indigo-100 text-indigo-700' },
      ],
    },
    {
      initial: 'T', name: 'Tural H.',
      gradient: 'from-emerald-500 to-teal-700',
      topLabel: 'Ankara Univ.',
      items: [
        { name: 'Ankara Univ. — Hüquq',            statusKey: 'approved',       cls: 'bg-emerald-100 text-emerald-700' },
        { name: 'Düşənbə Texniki Univ.',           statusKey: 'under_review',   cls: 'bg-cyan-100 text-cyan-700' },
        { name: 'Magtymguly Türkmen Univ.',        statusKey: 'in_translation', cls: 'bg-indigo-100 text-indigo-700' },
      ],
    },
    {
      initial: 'S', name: 'Səbinə Q.',
      gradient: 'from-orange-500 to-red-600',
      topLabel: 'Qırğız Milli Univ.',
      items: [
        { name: 'Qırğız Milli Univ. — Turizm',     statusKey: 'approved',       cls: 'bg-emerald-100 text-emerald-700' },
        { name: 'İstanbul Univ.',                  statusKey: 'under_review',   cls: 'bg-cyan-100 text-cyan-700' },
        { name: 'Al-Farabi KazNU',                 statusKey: 'in_translation', cls: 'bg-indigo-100 text-indigo-700' },
      ],
    },
  ];
  const [carouselIdx, setCarouselIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCarouselIdx(i => (i + 1) % carouselUsers.length), 3500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const currentUser = carouselUsers[carouselIdx];

  return (
    <div>
      {/* HERO — refined: clean grid, one subtle accent, no busy gradient circles */}
      <section className="relative overflow-hidden bg-white">
        {/* A single soft top wash — much calmer than the old double blob */}
        <div className="absolute inset-x-0 top-0 h-[420px] -z-10 bg-gradient-to-b from-brand-50/60 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-28">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left — title block. Wider than before, tighter spacing. */}
            <div className="relative lg:col-span-7">
              <div className="inline-flex items-center gap-2 bg-white border border-ink-200 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-7 shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulse-dot"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-ink-700 uppercase tracking-[0.12em]">{t('home.badge')}</span>
              </div>

              <h1 className="font-display text-[44px] sm:text-6xl lg:text-[76px] font-bold text-ink-900 leading-[0.98] tracking-[-0.025em]">
                {t('home.heroTitle')}
              </h1>
              <p className="mt-7 text-base lg:text-lg text-ink-700 leading-relaxed max-w-xl">
                {t('home.heroSubtitle')}
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/register" className="btn-primary text-base px-7 py-3.5">
                  {t('home.ctaApply')}
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link to="/universities" className="btn-secondary text-base px-7 py-3.5">
                  {t('home.ctaExplore')}
                </Link>
              </div>

              {/* Country chips — slimmer pill row */}
              <div className="mt-12 pt-7 border-t border-ink-100">
                <p className="eyebrow mb-3">{t('home.trustStrip')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {COUNTRIES.map(c => (
                    <span key={c.code} className="flex items-center gap-1.5 bg-white border border-ink-200 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-700">
                      <img
                        src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                        alt=""
                        className="w-4 h-3 object-cover rounded-sm"
                        loading="lazy"
                      />
                      {getCountryName(t, c)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — student carousel card. Softer, no harsh shadow, no orange badge. */}
            <div className="relative lg:col-span-5">
              <div className="relative bg-white rounded-3xl border border-ink-100 p-7 shadow-soft">
                <div key={currentUser.name} className="flex items-center gap-3 mb-6 animate-[fadeIn_0.4s_ease-out]">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${currentUser.gradient} flex items-center justify-center text-white text-base font-bold transition-colors duration-300`}>
                    {currentUser.initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-ink-500">{t('dashboard.student')}</p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t('home.feed.live')}
                  </span>
                </div>

                <div key={'items-' + currentUser.name} className="space-y-2.5 animate-[fadeIn_0.4s_ease-out]">
                  {currentUser.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-ink-50 rounded-xl border border-ink-100/60">
                      <span className="text-sm font-medium text-ink-800 truncate pr-2">{item.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${item.cls}`}>
                        {t(`student.status.${item.statusKey}`)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* carousel dots — slimmer */}
                <div className="mt-5 flex items-center justify-center gap-1.5">
                  {carouselUsers.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCarouselIdx(i)}
                      aria-label={`Slide ${i + 1}`}
                      className={`h-1 rounded-full transition-all ${i === carouselIdx ? 'w-5 bg-brand-600' : 'w-1 bg-ink-300 hover:bg-ink-500'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVITY FEED — the signature live stream */}
      <ActivityFeed />

      {/* STATS — uniform brand tone instead of the rainbow palette. Calmer, more cohesive. */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          <StatCard value={universities} label={t('home.stats.universities')} accent="from-brand-600 to-brand-800"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>} />
          <StatCard value={faculties} label={t('home.stats.faculties')} accent="from-brand-600 to-brand-800"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
          <StatCard value={applications} label={t('home.stats.applications')} accent="from-brand-600 to-brand-800"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
          <StatCard value={accepted} label={t('home.stats.accepted')} accent="from-accent-500 to-accent-700"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>} />
        </div>
      </section>

      {/* PROCESS — flat, monochromatic numbers on the brand. Less circus, more focus. */}
      <section className="bg-ink-50/40 border-y border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="max-w-2xl mb-12">
            <p className="eyebrow">{t('home.process.eyebrow')}</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 leading-[1.05] tracking-tight">
              {t('home.process.title')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            <div className="hidden lg:block absolute top-7 left-[10%] right-[10%] h-px bg-ink-200 -z-0" />
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card p-6 relative z-10 hover:shadow-lift transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-white border border-brand-200 text-brand-700 flex items-center justify-center font-display font-bold text-xl mb-5 shadow-soft">
                  {String(n).padStart(2, '0')}
                </div>
                <h3 className="font-display font-bold text-ink-900 text-lg">{t(`home.process.step${n}.title`)}</h3>
                <p className="text-sm text-ink-700 mt-1.5 leading-relaxed">{t(`home.process.step${n}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — uniform brand cards with single-tone icons. Quieter, more confident. */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-2xl mb-12">
          <p className="eyebrow">{t('home.features.eyebrow')}</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 leading-[1.05] tracking-tight">
            {t('home.features.title')}
          </h2>
          <p className="mt-4 text-base lg:text-lg text-ink-700 leading-relaxed">{t('home.features.subtitle')}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <FeatureCard title={t('home.features.multiUniversity.title')} desc={t('home.features.multiUniversity.desc')} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
          <FeatureCard title={t('home.features.online.title')}          desc={t('home.features.online.desc')}          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
          <FeatureCard title={t('home.features.tracking.title')}        desc={t('home.features.tracking.desc')}        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} />
          <FeatureCard title={t('home.features.support.title')}         desc={t('home.features.support.desc')}         icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} />
        </div>
      </section>

      {/* CTA — solid deep brand, no rainbow gradient. Clean and authoritative. */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="rounded-3xl bg-ink-900 px-6 py-14 sm:px-16 sm:py-20 relative overflow-hidden">
          {/* a single, very subtle brand-tinted radial glow */}
          <div className="absolute inset-0 -z-0 opacity-30 pointer-events-none">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-brand-500 blur-3xl" />
          </div>
          <div className="relative text-center">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl mx-auto leading-[1.1] text-white">
              {t('home.cta.title')}
            </h2>
            <p className="mt-5 text-base lg:text-lg text-ink-300 max-w-xl mx-auto leading-relaxed">{t('home.cta.desc')}</p>
            <div className="mt-9 flex flex-wrap gap-3 justify-center">
              <Link to="/register" className="inline-flex items-center px-7 py-3.5 rounded-xl bg-white text-ink-900 font-semibold hover:bg-ink-100 transition shadow-lg">
                {t('home.ctaApply')}
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link to="/universities" className="inline-flex items-center px-7 py-3.5 rounded-xl bg-white/5 backdrop-blur border border-white/15 text-white font-semibold hover:bg-white/10 transition">
                {t('home.ctaExplore')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* Feature card — uniform brand tone, monochromatic. Hover lifts gently. */
function FeatureCard({ title, desc, icon }: {
  title: string; desc: string; icon: React.ReactNode;
}) {
  return (
    <div className="card p-6 hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-brand-50 text-brand-700 border border-brand-100">
        {icon}
      </div>
      <h3 className="font-display font-bold text-ink-900 text-base mb-1.5">{title}</h3>
      <p className="text-sm text-ink-600 leading-relaxed">{desc}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function timeAgo(iso: string, t: any): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('time.now');
  if (min < 60) return t('time.minAgo', { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t('time.hourAgo', { n: h });
  const d = Math.floor(h / 24);
  if (d < 7) return t('time.dayAgo', { n: d });
  return new Date(iso).toLocaleDateString();
}
