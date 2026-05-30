import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
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
   GUEST HOME — completely new layout. Center-first, asymmetric,
   marquee + bento grid + testimonial. Different SHAPE entirely.
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

  return (
    <div className="bg-white">
      {/* =====================================================
         HERO — center-aligned, oversized typography, no side card.
         Below the title: a curated trio of recent acceptances.
         ===================================================== */}
      <section className="relative overflow-hidden">
        {/* a radial accent behind the title — very subtle */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[1200px] h-[700px] -translate-y-1/3 bg-gradient-to-b from-brand-100/60 via-brand-50/40 to-transparent rounded-[50%] blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-ink-100" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-28 pb-12 text-center">
          {/* tiny live badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-ink-200 px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulse-dot"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-ink-700 uppercase tracking-[0.14em]">{t('home.badge')}</span>
          </div>

          {/* MASSIVE display headline */}
          <h1 className="mt-8 font-display text-[44px] sm:text-7xl lg:text-[92px] xl:text-[104px] font-bold text-ink-900 leading-[0.94] tracking-[-0.035em]">
            {t('home.heroTitle')}
          </h1>

          <p className="mt-7 text-base lg:text-xl text-ink-600 leading-relaxed max-w-2xl mx-auto">
            {t('home.heroSubtitle')}
          </p>

          <div className="mt-10 flex flex-wrap gap-3 justify-center">
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

          {/* country flags row — centered, minimal */}
          <div className="mt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500 mb-4">
              {t('home.trustStrip')}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-7 gap-y-3">
              {COUNTRIES.map(c => (
                <div key={c.code} className="flex items-center gap-2 group">
                  <img
                    src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                    alt=""
                    className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                    loading="lazy"
                  />
                  <span className="text-xs font-medium text-ink-700 group-hover:text-ink-900 transition">
                    {getCountryName(t, c)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
         UNIVERSITY MARQUEE — Stripe-customer-row style.
         Infinite horizontal scroll of all universities.
         ===================================================== */}
      <section className="relative py-12 lg:py-16 border-y border-ink-100 bg-ink-50/40 overflow-hidden">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500 mb-8">
          {t('home.marquee.eyebrow')}
        </p>

        <div className="relative">
          {/* edge fades to make the loop feel infinite */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-ink-50 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-ink-50 to-transparent z-10" />

          {/* the scrolling row */}
          <div className="flex animate-marquee" style={{ width: 'max-content' }}>
            {[...UNIVERSITIES, ...UNIVERSITIES].map((u, i) => (
              <div key={`${u.id}-${i}`} className="flex items-center gap-3 px-7 py-3 flex-shrink-0">
                <img
                  src={`https://flagcdn.com/w40/${u.countryCode.toLowerCase()}.png`}
                  alt=""
                  className="w-7 h-5 object-cover rounded-sm shadow-sm"
                  loading="lazy"
                />
                <div className="leading-tight">
                  <p className="font-display font-bold text-ink-900 text-base whitespace-nowrap">
                    {getUniversityName(t, u)}
                  </p>
                  <p className="text-[11px] text-ink-500 whitespace-nowrap">
                    {getCityName(t, u.city)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
         INLINE STATS BAR — big numbers, thin separators.
         No cards, no shadows, just raw confidence.
         ===================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 lg:divide-x lg:divide-ink-200">
          <StatBar value={universities} label={t('home.stats.universities')} />
          <StatBar value={faculties}    label={t('home.stats.faculties')} />
          <StatBar value={applications} label={t('home.stats.applications')} />
          <StatBar value={accepted}     label={t('home.stats.accepted')} accent />
        </div>
      </section>

      {/* =====================================================
         FEATURES — BENTO GRID. 1 large + 3 small.
         Asymmetric, more interesting than 4 equal columns.
         ===================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-28">
        <div className="max-w-2xl mb-14">
          <p className="eyebrow">{t('home.features.eyebrow')}</p>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold text-ink-900 leading-[1.02] tracking-tight">
            {t('home.features.title')}
          </h2>
          <p className="mt-4 text-base lg:text-lg text-ink-600 leading-relaxed">{t('home.features.subtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Big hero card — multi-university (the headline feature). Spans 7 cols on lg. */}
          <article className="lg:col-span-7 lg:row-span-2 relative overflow-hidden rounded-3xl bg-ink-900 p-8 lg:p-10 text-white min-h-[320px] flex flex-col justify-between">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-brand-500 blur-3xl" />
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-display text-2xl lg:text-3xl font-bold leading-tight">{t('home.features.multiUniversity.title')}</h3>
              <p className="mt-4 text-base text-ink-300 leading-relaxed max-w-md">{t('home.features.multiUniversity.desc')}</p>
            </div>
            <div className="relative mt-8 flex items-center gap-2">
              {[1,2,3,4,5].map(n => (
                <div key={n} className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xs font-bold font-display">
                  {n}
                </div>
              ))}
              <span className="ml-2 text-xs text-ink-400">{t('home.features.multiUniversity.simul')}</span>
            </div>
          </article>

          {/* Top-right card */}
          <BentoCard
            colSpan={5}
            title={t('home.features.online.title')}
            desc={t('home.features.online.desc')}
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          />

          {/* Bottom-right pair — split into 2 narrower cards */}
          <BentoCard
            colSpan={5}
            title={t('home.features.tracking.title')}
            desc={t('home.features.tracking.desc')}
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
          />

          {/* Full-width row below — WhatsApp support */}
          <BentoCard
            colSpan={12}
            title={t('home.features.support.title')}
            desc={t('home.features.support.desc')}
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
            horizontal
          />
        </div>
      </section>

      {/* =====================================================
         ACTIVITY FEED — signature live stream
         ===================================================== */}
      <ActivityFeed />

      {/* =====================================================
         PROCESS — vertical timeline with connecting line.
         Different rhythm from the 4-column grid.
         ===================================================== */}
      <section className="bg-ink-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full bg-brand-600 blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">{t('home.process.eyebrow')}</p>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold text-white leading-[1.02] tracking-tight">
              {t('home.process.title')}
            </h2>
          </div>

          <ol className="relative space-y-10 lg:space-y-14">
            {/* the connecting vertical line */}
            <div className="absolute left-7 lg:left-9 top-2 bottom-2 w-px bg-white/15" />

            {[1, 2, 3, 4].map(n => (
              <li key={n} className="relative pl-20 lg:pl-24">
                {/* numbered node on the line */}
                <div className="absolute left-0 top-0 w-14 lg:w-[72px] h-14 lg:h-[72px] rounded-2xl bg-white text-ink-900 flex items-center justify-center font-display font-bold text-xl shadow-lift">
                  {String(n).padStart(2, '0')}
                </div>
                <h3 className="font-display text-xl lg:text-2xl font-bold pt-2">{t(`home.process.step${n}.title`)}</h3>
                <p className="mt-2 text-base text-ink-300 leading-relaxed max-w-xl">{t(`home.process.step${n}.desc`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* =====================================================
         TESTIMONIAL — single oversized pull-quote.
         A different visual rhythm than cards.
         ===================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <figure className="relative">
          <svg className="absolute -top-4 -left-2 w-16 h-16 text-brand-100" viewBox="0 0 32 32" fill="currentColor">
            <path d="M9.4 8C5.3 8 2 11.3 2 15.4v1.4C2 22 6.5 27 12.4 27v-3.6c-3.4 0-5.4-2.3-5.6-5h2.6V12.6L9.4 8zm15.4 0c-4.1 0-7.4 3.3-7.4 7.4v1.4c0 5.2 4.5 10.2 10.4 10.2v-3.6c-3.4 0-5.4-2.3-5.6-5h2.6V12.6L24.8 8z" />
          </svg>
          <blockquote className="relative">
            <p className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-ink-900 leading-[1.12] tracking-tight">
              {t('home.testimonial.quote')}
            </p>
          </blockquote>
          <figcaption className="mt-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-display font-bold text-xl">
              A
            </div>
            <div>
              <p className="font-display font-bold text-ink-900 text-lg">Aysel A.</p>
              <p className="text-sm text-ink-500 flex items-center gap-1.5">
                <img src="https://flagcdn.com/w40/tr.png" alt="" className="w-4 h-3 object-cover rounded-sm" />
                {t('home.testimonial.role')}
              </p>
            </div>
          </figcaption>
        </figure>
      </section>

      {/* =====================================================
         CTA — dark with a bright brand glow. Confident close.
         ===================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-24">
        <div className="rounded-3xl bg-ink-900 px-6 py-16 sm:px-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 -z-0 opacity-40 pointer-events-none">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-brand-500 blur-3xl" />
          </div>
          <div className="relative text-center max-w-3xl mx-auto">
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.04] text-white">
              {t('home.cta.title')}
            </h2>
            <p className="mt-6 text-lg text-ink-300 max-w-xl mx-auto leading-relaxed">{t('home.cta.desc')}</p>
            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <Link to="/register" className="inline-flex items-center px-8 py-4 rounded-xl bg-white text-ink-900 font-semibold hover:bg-ink-100 transition shadow-lift">
                {t('home.ctaApply')}
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link to="/universities" className="inline-flex items-center px-8 py-4 rounded-xl bg-white/5 backdrop-blur border border-white/15 text-white font-semibold hover:bg-white/10 transition">
                {t('home.ctaExplore')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ====================================================
   Sub-components for the new layout
   ==================================================== */

/* Inline stat — big number, thin separator. No card. */
function StatBar({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !animated.current) {
          animated.current = true;
          const start = performance.now(); const duration = 1400;
          function tick(now: number) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.floor(value * eased));
            if (t < 1) requestAnimationFrame(tick); else setDisplay(value);
          }
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.3 });
    io.observe(el); return () => io.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="px-4 lg:px-8 text-center">
      <p className={`font-display text-4xl sm:text-5xl lg:text-6xl font-bold tabular-nums leading-none ${accent ? 'text-brand-700' : 'text-ink-900'}`}>
        {display.toLocaleString()}
        {accent && <span className="text-accent-500">+</span>}
      </p>
      <p className="mt-3 text-xs lg:text-sm font-medium text-ink-500 uppercase tracking-[0.1em]">{label}</p>
    </div>
  );
}

/* Bento card — uses inline gridColumn instead of dynamic lg:col-span-* so Tailwind JIT doesn't choke. */
function BentoCard({ title, desc, icon, colSpan, horizontal }: {
  title: string; desc: string; icon: React.ReactNode; colSpan: number; horizontal?: boolean;
}) {
  return (
    <article
      style={{ gridColumn: `span ${colSpan} / span ${colSpan}` }}
      className={`card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300 ${horizontal ? 'p-7 lg:p-8 lg:flex lg:items-start lg:gap-7' : 'p-7'}`}
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-brand-50 text-brand-700 border border-brand-100 ${horizontal ? 'flex-shrink-0' : 'mb-5'}`}>
        {icon}
      </div>
      <div className={horizontal ? 'mt-4 lg:mt-0' : ''}>
        <h3 className="font-display font-bold text-ink-900 text-lg leading-tight">{title}</h3>
        <p className="mt-2 text-sm text-ink-600 leading-relaxed">{desc}</p>
      </div>
    </article>
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
