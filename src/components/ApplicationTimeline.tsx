import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';

interface AppEvent {
  id: string;
  applicationId: string;
  actorId?: string;
  actorRole?: 'student' | 'university' | 'moderator';
  type: string;
  message: string;
  createdAt: string;
}

const typeMeta: Record<string, { icon: string; color: string }> = {
  created:               { icon: '✦', color: 'bg-brand-100 text-brand-700' },
  choices_updated:       { icon: '↻', color: 'bg-slate-100 text-slate-700' },
  document_uploaded:     { icon: '📄', color: 'bg-blue-100 text-blue-700' },
  first_payment:         { icon: '💳', color: 'bg-emerald-100 text-emerald-700' },
  second_payment:        { icon: '💳', color: 'bg-emerald-100 text-emerald-700' },
  translation_uploaded:  { icon: '🌐', color: 'bg-indigo-100 text-indigo-700' },
  status_under_review:   { icon: '📨', color: 'bg-violet-100 text-violet-700' },
  status_sent_to_university: { icon: '📨', color: 'bg-violet-100 text-violet-700' },
  status_in_translation: { icon: '🌐', color: 'bg-indigo-100 text-indigo-700' },
  status_approved:       { icon: '✓', color: 'bg-emerald-100 text-emerald-700' },
  status_rejected:       { icon: '✗', color: 'bg-red-100 text-red-700' },
};

export default function ApplicationTimeline({ applicationId }: { applicationId: string }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState<AppEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEvents(null);
    (async () => {
      try {
        const r = await api<{ events: AppEvent[] }>(`/api/applications/${applicationId}/events`);
        if (!cancelled) setEvents(r.events);
      } catch {
        if (!cancelled) setEvents([]);
      }
    })();
    return () => { cancelled = true; };
  }, [applicationId]);

  if (events === null) {
    return <div className="card p-5 text-sm text-slate-500">{t('timeline.loading')}</div>;
  }

  if (events.length === 0) {
    return <div className="card p-5 text-sm text-slate-500 text-center">{t('timeline.empty')}</div>;
  }

  const sorted = [...events].reverse();

  function timeAgo(iso: string): string {
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

  // Try to translate the event via timeline.events.<type> — fallback to backend message
  function eventLabel(e: AppEvent): string {
    const key = `timeline.events.${e.type}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return e.message;
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">{t('timeline.title')}</h3>
        <span className="text-xs text-slate-500">{t('timeline.count', { n: events.length })}</span>
      </div>

      <ol className="relative space-y-4 ml-3">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />

        {sorted.map((e) => {
          const meta = typeMeta[e.type] ?? { icon: '·', color: 'bg-slate-100 text-slate-700' };
          return (
            <li key={e.id} className="relative pl-10">
              <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${meta.color}`}>
                {meta.icon}
              </div>
              <div>
                <p className="text-sm text-slate-900 font-medium leading-snug">{eventLabel(e)}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {e.actorRole && <span className="font-medium">{t(`timeline.roles.${e.actorRole}`)}</span>}
                  {e.actorRole && ' · '}
                  {timeAgo(e.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
