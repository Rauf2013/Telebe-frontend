import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useUsersStore, getCachedUser } from '../../store/usersStore';
import { useAppStore } from '../../store/applicationStore';
import { findFaculty, findUniversity, getFacultyName, getUniversityName, getCityName } from '../../data/universities';
import { fileUrl } from '../../api/client';
import DashboardHeader from '../../components/DashboardHeader';
import ApplicationTimeline from '../../components/ApplicationTimeline';
import ChatPanel from '../../components/ChatPanel';
import type { Application, FacultyChoice } from '../../types';

interface PendingItem {
  app: Application;
  choice: FacultyChoice;
}

export default function UniversityDashboard() {
  const { t } = useTranslation();
  const me = useAuthStore(s => s.user)!;
  const apps = useAppStore(s => s.applications);
  const setChoiceStatus = useAppStore(s => s.setChoiceStatus);
  useUsersStore(s => s.users);

  const myUni = me.universityId ? findUniversity(me.universityId) : undefined;

  // Sadece kendi üniversitesine gönderilmiş başvurular
  const items: PendingItem[] = useMemo(() => {
    if (!myUni) return [];
    const out: PendingItem[] = [];
    apps.forEach(a => {
      a.choices.forEach(c => {
        if (c.universityId === myUni.id &&
            (c.status === 'under_review' || c.status === 'sent_to_university'
             || c.status === 'approved' || c.status === 'rejected')) {
          out.push({ app: a, choice: c });
        }
      });
    });
    return out;
  }, [apps, myUni]);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = items.find(i => keyOf(i) === selectedKey) ?? items[0];

  function keyOf(i: PendingItem) { return `${i.app.id}:${i.choice.facultyId}`; }

  if (!myUni) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card p-6 text-sm text-slate-600">{t('university.noUniversity')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardHeader
        eyebrow={t('dashboard.university')}
        title={getUniversityName(t, myUni)}
        subtitle={`${getCityName(t, myUni.city)} · ${t('university.subtitle')}`}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1 space-y-2">
          {items.length === 0 && (
            <div className="card p-6 text-sm text-slate-500 text-center">{t('university.noPending')}</div>
          )}
          {items.map(i => {
            const student = getCachedUser(i.app.studentId);
            const faculty = findFaculty(i.choice.universityId, i.choice.facultyId);
            const active = keyOf(i) === (selected ? keyOf(selected) : '');
            return (
              <button key={keyOf(i)} onClick={() => setSelectedKey(keyOf(i))}
                className={`w-full text-left card p-4 transition ${
                  active ? 'border-brand-500 ring-2 ring-brand-100' : 'hover:border-brand-300'
                }`}>
                <p className="font-medium text-slate-900 text-sm">{student?.fullName ?? '—'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{getFacultyName(t, faculty)}</p>
                <div className="mt-2">
                  <StatusPill status={i.choice.status} />
                </div>
              </button>
            );
          })}
        </aside>

        <main className="lg:col-span-2">
          {selected ? (
            <DecisionPanel
              key={keyOf(selected)}
              item={selected}
              onSubmit={(decision) => {
                setChoiceStatus(selected.app.id, selected.choice.facultyId,
                  decision.approved ? 'approved' : 'rejected',
                  { tuitionFee: decision.tuitionFee, notes: decision.notes }
                );
              }}
            />
          ) : (
            <div className="card p-12 text-center text-slate-500 text-sm">
              {t('university.selectApp')}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function DecisionPanel({ item, onSubmit }: {
  item: PendingItem;
  onSubmit: (d: { approved: boolean; tuitionFee?: number; notes?: string }) => void;
}) {
  const { t } = useTranslation();
  const student = getCachedUser(item.app.studentId);
  const faculty = findFaculty(item.choice.universityId, item.choice.facultyId);

  const [tuitionFee, setTuitionFee] = useState<string>(
    item.choice.tuitionFee?.toString() ?? faculty?.tuitionFee?.toString() ?? ''
  );
  const [notes, setNotes] = useState<string>(item.choice.notes ?? '');

  const decided = item.choice.status === 'approved' || item.choice.status === 'rejected';
  const translatedDocs = item.app.documents.filter(d => d.translatedUrl);

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-slate-500">{t('moderator.studentInfo')}</p>
            <p className="font-semibold text-slate-900 mt-0.5">{student?.fullName}</p>
            <p className="text-xs text-slate-500">{student?.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t('university.facultyLabel')}</p>
            <p className="font-semibold text-slate-900 mt-0.5">{getFacultyName(t, faculty)}</p>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-3">{t('university.viewDocs')}</h3>
        {translatedDocs.length === 0 ? (
          <p className="text-sm text-slate-500">—</p>
        ) : (
          <ul className="space-y-2">
            {translatedDocs.map(d => (
              <li key={d.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-2.5">
                <span className="text-sm text-slate-900 capitalize">{d.type}</span>
                <a href={fileUrl(d.translatedUrl)} target="_blank" rel="noreferrer"
                   className="text-xs text-brand-600 hover:underline">{d.fileName}</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-3">{t('university.decisionTitle')}</h3>

        {decided ? (
          <div className={`p-4 rounded-lg ${
            item.choice.status === 'approved' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className="font-medium text-slate-900 mb-1">
              {item.choice.status === 'approved' ? t('university.approvedTitle') : t('university.rejectedTitle')}
            </p>
            {item.choice.tuitionFee != null && (
              <p className="text-sm text-slate-700">{t('university.tuitionFee')}: <strong>${item.choice.tuitionFee}</strong></p>
            )}
            {item.choice.notes && <p className="text-sm text-slate-700 mt-1">{item.choice.notes}</p>}
            <p className="text-xs text-slate-500 mt-2">{t('university.decided')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="label">{t('university.tuitionFee')}</label>
              <input className="input" type="number" min="0" value={tuitionFee}
                     onChange={e => setTuitionFee(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('university.notes')}</label>
              <textarea className="input min-h-[80px]" value={notes}
                        placeholder={t('university.notesPlaceholder')}
                        onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onSubmit({
                  approved: true,
                  tuitionFee: tuitionFee ? Number(tuitionFee) : undefined,
                  notes: notes || undefined,
                })}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 flex-1"
              >
                {t('university.approve')}
              </button>
              <button
                onClick={() => onSubmit({ approved: false, notes: notes || undefined })}
                className="btn-secondary flex-1 border-red-200 text-red-700 hover:bg-red-50"
              >
                {t('university.reject')}
              </button>
            </div>
          </div>
        )}
      </section>

      {item.choice.status === 'approved' && item.app.secondPaymentPaid && (
        <section>
          <h3 className="font-semibold text-slate-900 mb-3">{t('chat.title')}</h3>
          <ChatPanel applicationId={item.app.id} otherPartyName={student?.fullName} />
        </section>
      )}

      <ApplicationTimeline applicationId={item.app.id} />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    sent_to_university: 'bg-violet-100 text-violet-700',
    under_review: 'bg-cyan-100 text-cyan-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {t(`student.status.${status}`)}
    </span>
  );
}
