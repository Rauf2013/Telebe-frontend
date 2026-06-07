import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/applicationStore';
import { COUNTRIES, UNIVERSITIES, findFaculty, findUniversity, getFacultyName, getCountryName, getUniversityName, getCityName } from '../../data/universities';
import DashboardHeader from '../../components/DashboardHeader';
import ApplicationTimeline from '../../components/ApplicationTimeline';
import CardPaymentForm from '../../components/CardPaymentForm';
import ChatPanel from '../../components/ChatPanel';
import { api } from '../../api/client';
import type { Application, FacultyChoice } from '../../types';

type Tab = 'choices' | 'documents' | 'payment' | 'tracking';

const REQUIRED_DOCS: { type: 'passport' | 'diploma' | 'transcript' | 'photo'; key: string }[] = [
  { type: 'passport',   key: 'student.docPassport' },
  { type: 'diploma',    key: 'student.docDiploma' },
  { type: 'transcript', key: 'student.docTranscript' },
  { type: 'photo',      key: 'student.docPhoto' },
];

const FIRST_PAYMENT = 150;
const SECOND_PAYMENT = 350;

export default function StudentDashboard() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user)!;
  const app = useAppStore(s => s.myApp);

  const labels: Tab[] = ['choices', 'documents', 'payment', 'tracking'];
  const stepLabels = [t('student.step1'), t('student.step2'), t('student.step3'), t('student.step4')];

  const choicesDone   = !!app && app.choices.length > 0;
  const documentsDone = !!app && REQUIRED_DOCS.every(rd => app.documents.some(d => d.type === rd.type));
  const paymentDone   = !!app && app.firstPaymentPaid;

  // Otomatik adım (yapılması gereken)
  const autoStep: Tab =
    !choicesDone   ? 'choices'
    : !documentsDone ? 'documents'
    : !paymentDone   ? 'payment'
    : 'tracking';

  // Manuel override (geri dönmek için)
  const [manualStep, setManualStep] = useState<Tab | null>(null);
  const current = manualStep ?? autoStep;

  // autoStep değişince (yeni adım tamamlanınca) manualStep'i temizle → otomatik ilerle
  const prevAuto = useRef(autoStep);
  useEffect(() => {
    if (prevAuto.current !== autoStep) {
      setManualStep(null);
      prevAuto.current = autoStep;
    }
  }, [autoStep]);

  const autoIdx = labels.indexOf(autoStep);

  // Tamamlanmış veya aktif olan adıma tıklanabilir, geleceğe değil
  function navigable(i: number): boolean {
    return i <= autoIdx;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardHeader
        eyebrow={t('dashboard.student')}
        title={`${t('dashboard.welcome')}, ${user.fullName}`}
      />

      {/* Steps — tamamlanmış adıma geri dönülebilir */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200">
        {labels.map((id, i) => {
          const done = i < autoIdx;
          const active = current === id;
          const clickable = navigable(i);
          return (
            <button
              key={id}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && setManualStep(id)}
              aria-current={active ? 'step' : undefined}
              className={`px-4 py-2.5 -mb-px border-b-2 text-sm font-medium select-none flex items-center gap-2 transition ${
                active ? 'border-brand-600 text-brand-700'
                : clickable ? 'border-transparent text-slate-600 hover:text-brand-700 hover:border-slate-300 cursor-pointer'
                : 'border-transparent text-slate-300 cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                done ? 'bg-emerald-500 text-white'
                : active ? 'bg-brand-600 text-white'
                : 'bg-slate-200 text-slate-400'
              }`}>{done ? '✓' : i + 1}</span>
              {stepLabels[i]}
            </button>
          );
        })}
      </div>

      {current === 'choices'   && <ChoicesTab />}
      {current === 'documents' && <DocumentsTab />}
      {current === 'payment'   && <PaymentTab />}
      {current === 'tracking'  && <TrackingTab />}
    </div>
  );
}

/* ---------------- Choices ---------------- */
function ChoicesTab() {
  const { t } = useTranslation();
  const app = useAppStore(s => s.myApp);
  const upsert = useAppStore(s => s.upsertChoices);
  const [country, setCountry] = useState<string>('all');

  const initial: FacultyChoice[] = app?.choices ?? [];
  const [picked, setPicked] = useState<FacultyChoice[]>(initial);

  const filtered = useMemo(
    () => country === 'all' ? UNIVERSITIES : UNIVERSITIES.filter(u => u.countryCode === country),
    [country]
  );

  const isPicked = (uId: string, fId: string) =>
    picked.some(p => p.universityId === uId && p.facultyId === fId);

  function toggle(uId: string, fId: string) {
    setPicked(prev => {
      const idx = prev.findIndex(p => p.universityId === uId && p.facultyId === fId);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      if (prev.length >= 5) return prev;
      return [...prev, { universityId: uId, facultyId: fId, status: 'draft' }];
    });
  }

  async function onSave() {
    await upsert(picked);
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900">{t('student.selectionTitle')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('student.selectionHint')}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setCountry('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                country === 'all' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-200'
              }`}>{t('student.all')}</button>
            {COUNTRIES.map(c => (
              <button key={c.code} onClick={() => setCountry(c.code)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  country === c.code ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-200'
                }`}>{c.flag} {getCountryName(t, c)}</button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map(u => (
            <div key={u.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{getUniversityName(t, u)}</h3>
                  <p className="text-xs text-slate-500">{getCityName(t, u.city)} · {getCountryName(t, COUNTRIES.find(c => c.code === u.countryCode))}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {u.faculties.map(f => {
                  const active = isPicked(u.id, f.id);
                  const disabled = !active && picked.length >= 5;
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggle(u.id, f.id)}
                      disabled={disabled}
                      className={`text-left p-3 rounded-lg border transition ${
                        active ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-brand-300'
                      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">{getFacultyName(t, f)}</span>
                        {active && <span className="text-brand-600 text-sm">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 self-start">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">{t('student.selected')}</h3>
            <span className="text-xs text-slate-500">{picked.length} / 5</span>
          </div>

          {picked.length === 0 && (
            <p className="text-sm text-slate-500">{t('student.noChoices')}</p>
          )}

          <ul className="space-y-2">
            {picked.map(p => {
              const u = findUniversity(p.universityId);
              const f = findFaculty(p.universityId, p.facultyId);
              return (
                <li key={p.facultyId} className="flex items-start justify-between gap-2 p-2 bg-slate-50 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">{getFacultyName(t, f)}</p>
                    <p className="text-xs text-slate-500">{getUniversityName(t, u)}</p>
                  </div>
                  <button onClick={() => setPicked(prev => prev.filter(x => x.facultyId !== p.facultyId))}
                          className="text-red-500 text-xs hover:underline">{t('student.remove')}</button>
                </li>
              );
            })}
          </ul>

          <button
            disabled={picked.length === 0}
            onClick={onSave}
            className="btn-primary w-full mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('student.saveContinue')}
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ---------------- Documents ---------------- */
function DocumentsTab() {
  const { t } = useTranslation();
  const app = useAppStore(s => s.myApp);
  const addDocument = useAppStore(s => s.addDocument);
  const removeDocument = useAppStore(s => s.removeDocument);

  if (!app) {
    return <div className="card p-6 text-sm text-slate-500">{t('student.selectFacultyFirst')}</div>;
  }

  function onUpload(type: 'passport' | 'diploma' | 'transcript' | 'photo', file: File) {
    addDocument(type, file);
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-900">{t('student.documentsTitle')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('student.documentsHint')}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {REQUIRED_DOCS.map(rd => {
          const doc = app.documents.find(d => d.type === rd.type);
          return (
            <div key={rd.type} className="card p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">{t(rd.key)}</p>
                {doc && <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">✓ {t('student.uploaded')}</span>}
              </div>
              {doc ? (
                <div className="mt-3 flex items-center justify-between bg-slate-50 rounded-lg p-2">
                  <span className="text-xs text-slate-700 truncate">{doc.fileName}</span>
                  <button onClick={() => removeDocument(doc.id)}
                          className="text-red-500 text-xs hover:underline ml-2">{t('student.remove')}</button>
                </div>
              ) : (
                <label className="mt-3 flex items-center justify-center gap-2 px-3 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-sm text-slate-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.9 5 5 0 019.9-1.1A4.5 4.5 0 0117 16M12 12v9m0-9l-3 3m3-3l3 3" />
                  </svg>
                  {t('student.uploadFile')}
                  <input type="file" className="hidden"
                         onChange={e => e.target.files?.[0] && onUpload(rd.type, e.target.files[0])} />
                </label>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

/* ---------------- Payment ---------------- */
function PaymentTab() {
  const { t } = useTranslation();
  const app = useAppStore(s => s.myApp);
  const setFirst = useAppStore(s => s.setFirstPayment);
  const setSecond = useAppStore(s => s.setSecondPayment);

  if (!app) return <div className="card p-6 text-sm text-slate-500">{t('student.selectFacultyFirst')}</div>;

  const anyApproved = app.choices.some(c => c.status === 'approved');

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card p-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('student.paymentTitle')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t('student.paymentHint')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{t('student.paymentAmount')}</p>
            <p className="text-3xl font-extrabold text-slate-900">${FIRST_PAYMENT}</p>
          </div>
        </div>

        {app.firstPaymentPaid ? (
          <div className="mt-5 flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {t('student.paymentDone')}
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-slate-900 mt-6 mb-4 pb-3 border-b border-slate-100">
              {t('student.card.title')}
            </h3>
            <CardPaymentForm amount={FIRST_PAYMENT} onPay={() => setFirst()} />
          </>
        )}
      </div>

      {anyApproved && (
        <div className="card p-6 border-2 border-amber-300">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('student.secondPaymentTitle')}</h2>
              <p className="text-sm text-slate-500 mt-1">{t('student.secondPaymentHint')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">{t('student.paymentAmount')}</p>
              <p className="text-3xl font-extrabold text-slate-900">${SECOND_PAYMENT}</p>
            </div>
          </div>

          {app.secondPaymentPaid ? (
            <div className="mt-5 flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t('student.paymentDone')}
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-slate-900 mt-6 mb-4 pb-3 border-b border-slate-100">
                {t('student.card.title')}
              </h3>
              <CardPaymentForm amount={SECOND_PAYMENT} onPay={() => setSecond()} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Tracking ---------------- */
function TrackingTab() {
  const { t } = useTranslation();
  const app = useAppStore(s => s.myApp);

  if (!app || app.choices.length === 0) {
    return <div className="card p-6 text-sm text-slate-500">{t('student.noChoices')}</div>;
  }

  const approvedChoice = app.choices.find(c => c.status === 'approved');
  const chatUnlocked   = !!approvedChoice && app.secondPaymentPaid;
  const allRejected    = app.choices.length > 0
    && app.choices.every(c => c.status === 'rejected' || c.status === 'approved');
  const hasAnyRejected = app.choices.some(c => c.status === 'rejected');

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">{t('student.trackingTitle')}</h2>
      {app.choices.map(c => {
        const u = findUniversity(c.universityId);
        const f = findFaculty(c.universityId, c.facultyId);
        return (
          <div key={c.facultyId} className="card p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-medium text-slate-900">{getFacultyName(t, f)}</p>
                <p className="text-xs text-slate-500">{getUniversityName(t, u)} · {getCityName(t, u?.city ?? '')}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
            {c.status === 'approved' && !app.secondPaymentPaid && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                {t('student.approvedHint')}
              </p>
            )}
            {c.status === 'approved' && app.secondPaymentPaid && (
              <>
                {c.tuitionFee != null && (
                  <p className="text-sm text-emerald-700 mt-3">
                    {t('student.tuition')}: <strong>${c.tuitionFee.toLocaleString()}</strong>
                  </p>
                )}
                {c.notes && <p className="text-sm text-slate-600 mt-2">{c.notes}</p>}
              </>
            )}
            {c.status === 'rejected' && c.notes && (
              <p className="text-sm text-red-600 mt-2">{c.notes}</p>
            )}
          </div>
        );
      })}

      {chatUnlocked && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">{t('chat.title')}</h2>
          <ChatPanel
            applicationId={app.id}
            otherPartyName={getUniversityName(t, findUniversity(approvedChoice.universityId))}
          />
        </div>
      )}

      {(hasAnyRejected || allRejected) && !chatUnlocked && (
        <ReapplyCard appId={app.id} />
      )}

      <ApplicationTimeline applicationId={app.id} />
    </div>
  );
}

/* ---------------- Reapply card ----------------
   Per spec: if the student isn't satisfied with admission results, they can
   ask the moderator to send their docs to other universities. Same language
   = no extra payment. Different country = a new translation fee.
------------------------------------------------ */
function ReapplyCard({ appId }: { appId: string }) {
  const { t } = useTranslation();
  const refresh = useAppStore(s => s.loadMine);
  const [open, setOpen] = useState(false);
  const [sameLanguage, setSameLanguage] = useState(true);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api<{ application: Application }>(`/api/applications/${appId}/reapply`, {
        body: { sameLanguage, reason },
      });
      setDone(true);
      await refresh?.();
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="card p-5 bg-emerald-50 border-emerald-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-900">{t('reapply.sentTitle')}</p>
            <p className="text-sm text-emerald-700 mt-1">{t('reapply.sentDesc')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 border-amber-300">
      <h3 className="font-bold text-slate-900 mb-1">{t('reapply.title')}</h3>
      <p className="text-sm text-slate-500 mb-4">{t('reapply.desc')}</p>

      {!open ? (
        <button className="btn-secondary" onClick={() => setOpen(true)}>
          {t('reapply.openButton')}
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" className="mt-1" checked={sameLanguage}
                     onChange={() => setSameLanguage(true)} />
              <div>
                <p className="font-semibold text-slate-900">{t('reapply.sameLanguageTitle')}</p>
                <p className="text-xs text-slate-600 mt-0.5">{t('reapply.sameLanguageDesc')}</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50">
              <input type="radio" className="mt-1" checked={!sameLanguage}
                     onChange={() => setSameLanguage(false)} />
              <div>
                <p className="font-semibold text-slate-900">{t('reapply.countryChangeTitle')}</p>
                <p className="text-xs text-slate-600 mt-0.5">{t('reapply.countryChangeDesc')}</p>
              </div>
            </label>
          </div>

          <div>
            <label className="label">{t('reapply.reasonLabel')}</label>
            <textarea
              className="input min-h-[80px]"
              placeholder={t('reapply.reasonPlaceholder')}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? t('common.saving') : t('reapply.submit')}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const colorMap: Record<string, string> = {
    draft:                  'bg-slate-100 text-slate-700',
    documents_uploaded:     'bg-blue-100 text-blue-700',
    first_payment_pending:  'bg-amber-100 text-amber-700',
    in_translation:         'bg-indigo-100 text-indigo-700',
    sent_to_university:     'bg-violet-100 text-violet-700',
    under_review:           'bg-cyan-100 text-cyan-700',
    approved:               'bg-emerald-100 text-emerald-700',
    rejected:               'bg-red-100 text-red-700',
    second_payment_pending: 'bg-amber-100 text-amber-700',
    completed:              'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colorMap[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {t(`student.status.${status}`)}
    </span>
  );
}
