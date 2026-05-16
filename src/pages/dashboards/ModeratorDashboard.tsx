import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useUsersStore, getCachedUser } from '../../store/usersStore';
import { useAppStore } from '../../store/applicationStore';
import { api, fileUrl } from '../../api/client';
import { findFaculty, findUniversity, getFacultyName, getUniversityName, getCityName } from '../../data/universities';
import DashboardHeader from '../../components/DashboardHeader';
import ApplicationTimeline from '../../components/ApplicationTimeline';
import type { Application, User } from '../../types';

type Filter = 'all' | 'translation' | 'ready' | 'review' | 'approved';

export default function ModeratorDashboard() {
  const { t } = useTranslation();
  const me = useAuthStore(s => s.user)!;
  const apps = useAppStore(s => s.applications);
  useUsersStore(s => s.users); // subscribe so list re-renders when users load
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const [tab, setTab] = useState<'apps' | 'admins'>('apps');

  const filtered = useMemo(() => {
    return apps.filter(a => {
      if (filter === 'all') return true;
      if (filter === 'translation') return a.firstPaymentPaid && !a.documents.every(d => d.translatedUrl);
      if (filter === 'ready') return a.firstPaymentPaid && a.documents.length > 0
        && a.documents.every(d => d.translatedUrl)
        && a.choices.some(c => c.status !== 'sent_to_university' && c.status !== 'under_review' && c.status !== 'approved');
      if (filter === 'review') return a.choices.some(c => c.status === 'under_review' || c.status === 'sent_to_university');
      if (filter === 'approved') return a.choices.some(c => c.status === 'approved');
      return true;
    });
  }, [apps, filter]);

  const selected = filtered.find(a => a.id === selectedId) ?? filtered[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardHeader
        eyebrow={t('dashboard.moderator')}
        title={t('moderator.title')}
        subtitle={`${t('moderator.subtitle')} — ${me.fullName}`}
      />

      {/* Sekmeler */}
      <div className="flex gap-1 mb-5 border-b border-slate-200">
        <button onClick={() => setTab('apps')}
          className={`px-4 py-2.5 -mb-px border-b-2 text-sm font-semibold transition ${
            tab === 'apps' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}>
          {t('moderator.tabApps')}
        </button>
        <button onClick={() => setTab('admins')}
          className={`px-4 py-2.5 -mb-px border-b-2 text-sm font-semibold transition ${
            tab === 'admins' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}>
          {t('moderator.tabMods')}
        </button>
      </div>

      {tab === 'admins' ? <AdminsPanel /> : <>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['all','translation','ready','review','approved'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              filter === f ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
            }`}>
            {t(`moderator.filter${f.charAt(0).toUpperCase()+f.slice(1)}`)}
            <span className="ml-1.5 opacity-70">
              ({apps.filter(a => {
                if (f === 'all') return true;
                if (f === 'translation') return a.firstPaymentPaid && !a.documents.every(d => d.translatedUrl);
                if (f === 'ready') return a.firstPaymentPaid && a.documents.length > 0 && a.documents.every(d => d.translatedUrl);
                if (f === 'review') return a.choices.some(c => c.status === 'under_review' || c.status === 'sent_to_university');
                if (f === 'approved') return a.choices.some(c => c.status === 'approved');
                return false;
              }).length})
            </span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* List */}
        <aside className="lg:col-span-1 space-y-2">
          {filtered.length === 0 && (
            <div className="card p-6 text-sm text-slate-500 text-center">{t('moderator.noApps')}</div>
          )}
          {filtered.map(a => {
            const student = getCachedUser(a.studentId);
            const isActive = selected?.id === a.id;
            return (
              <button key={a.id} onClick={() => setSelectedId(a.id)}
                className={`w-full text-left card p-4 transition ${
                  isActive ? 'border-brand-500 ring-2 ring-brand-100' : 'hover:border-brand-300'
                }`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900 text-sm">{student?.fullName ?? '—'}</p>
                  <span className="text-xs text-slate-400">{a.choices.length} fakultə</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{student?.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.firstPaymentPaid && <Tag color="emerald">$ ödəniş</Tag>}
                  {a.documents.length > 0 && !a.documents.every(d => d.translatedUrl) && (
                    <Tag color="indigo">tərcümə {a.documents.filter(d => d.translatedUrl).length}/{a.documents.length}</Tag>
                  )}
                  {a.choices.some(c => c.status === 'approved') && <Tag color="amber">təsdiq</Tag>}
                </div>
              </button>
            );
          })}
        </aside>

        {/* Detail */}
        <main className="lg:col-span-2">
          {selected ? <Detail app={selected} /> : (
            <div className="card p-12 text-center text-slate-500 text-sm">
              {t('moderator.selectApp')}
            </div>
          )}
        </main>
      </div>

      </>}
    </div>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700',
    indigo:  'bg-indigo-100 text-indigo-700',
    amber:   'bg-amber-100 text-amber-700',
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[color]}`}>{children}</span>;
}

function Detail({ app }: { app: Application }) {
  const { t } = useTranslation();
  const student = getCachedUser(app.studentId);
  const attachTranslation = useAppStore(s => s.attachTranslation);
  const setChoiceStatus   = useAppStore(s => s.setChoiceStatus);
  const [notified, setNotified] = useState<Record<string, boolean>>({});

  function onUploadTranslation(docId: string, file: File) {
    attachTranslation(app.id, docId, file);
  }

  function sendToUniversity(facultyId: string) {
    setChoiceStatus(app.id, facultyId, 'under_review');
  }

  function notify(name: string, facultyId: string) {
    const msg = t('moderator.whatsappMessage', { name });
    const phone = (student?.whatsapp ?? student?.phone ?? '').replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      alert(msg);
    }
    setNotified(s => ({ ...s, [facultyId]: true }));
  }

  const allTranslated = app.documents.length > 0 && app.documents.every(d => d.translatedUrl);

  return (
    <div className="space-y-4">
      {/* Student info */}
      <section className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-3">{t('moderator.studentInfo')}</h3>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Field label={t('auth.fullName')} value={student?.fullName} />
          <Field label={t('auth.email')}    value={student?.email} />
          <Field label={t('auth.phone')}    value={student?.phone} />
          <Field label={t('auth.whatsapp')} value={student?.whatsapp} />
        </dl>
      </section>

      {/* Documents */}
      <section className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-3">{t('moderator.documents')}</h3>
        {app.documents.length === 0 && (
          <p className="text-sm text-slate-500">—</p>
        )}
        <div className="space-y-2">
          {app.documents.map(d => (
            <div key={d.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm">
                  <p className="font-medium text-slate-900 capitalize">{d.type}</p>
                  <a href={fileUrl(d.url)} target="_blank" rel="noreferrer"
                     className="text-xs text-brand-600 hover:underline">{t('moderator.originalFile')}: {d.fileName}</a>
                </div>
                {d.translatedUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                      ✓ {t('moderator.translated')}
                    </span>
                    <a href={fileUrl(d.translatedUrl)} target="_blank" rel="noreferrer"
                       className="text-xs text-brand-600 hover:underline">{t('moderator.translation')}</a>
                  </div>
                ) : (
                  <label className="text-xs px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg cursor-pointer hover:bg-brand-100">
                    {t('moderator.uploadTranslation')}
                    <input type="file" className="hidden"
                           onChange={e => e.target.files?.[0] && onUploadTranslation(d.id, e.target.files[0])} />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Choices / Send / Notify */}
      <section className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-3">{t('moderator.choices')}</h3>
        <div className="space-y-3">
          {app.choices.map(c => {
            const u = findUniversity(c.universityId);
            const f = findFaculty(c.universityId, c.facultyId);
            const sent = c.status === 'under_review' || c.status === 'sent_to_university'
                      || c.status === 'approved' || c.status === 'rejected';
            return (
              <div key={c.facultyId} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{getFacultyName(t, f)}</p>
                    <p className="text-xs text-slate-500">{getUniversityName(t, u)} · {getCityName(t, u?.city ?? '')}</p>
                  </div>
                  <StatusPill status={c.status} />
                </div>

                {c.status === 'approved' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <strong>{t('moderator.tuitionFee')}:</strong> ${c.tuitionFee?.toLocaleString() ?? '—'}
                    </p>
                    {c.notes && <p className="text-xs text-slate-600 mt-1">{c.notes}</p>}
                  </div>
                )}

                <div className="mt-3 flex gap-2 flex-wrap">
                  {!sent && (
                    <button
                      disabled={!allTranslated}
                      onClick={() => sendToUniversity(c.facultyId)}
                      className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-700"
                    >
                      {t('moderator.sendToUniversity')}
                    </button>
                  )}
                  {c.status === 'approved' && (
                    <button
                      onClick={() => notify(student?.fullName ?? '', c.facultyId)}
                      className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      {notified[c.facultyId] ? `✓ ${t('moderator.notified')}` : t('moderator.notifyWhatsapp')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Timeline */}
      <ApplicationTimeline applicationId={app.id} />
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-slate-900 font-medium">{value ?? '—'}</dd>
    </div>
  );
}

interface Invite {
  token: string; note?: string; expiresAt: string;
  usedAt?: string; createdAt: string;
}

function AdminsPanel() {
  const { t } = useTranslation();
  const [mods, setMods] = useState<User[]>([]);
  const [inv, setInv] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [m, i] = await Promise.all([
        api<{ moderators: User[] }>('/api/admin/moderators'),
        api<{ invites: Invite[] }>('/api/admin/invites'),
      ]);
      setMods(m.moderators);
      setInv(i.invites);
    } catch { /* ignore */ }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function createInvite() {
    setCreating(true);
    try {
      const r = await api<{ invite: { token: string } }>('/api/admin/invites', { body: { note } });
      setJustCreated(r.invite.token);
      setNote('');
      await load();
    } catch { /* ignore */ }
    setCreating(false);
  }

  async function revokeInvite(token: string) {
    if (!confirm(t('moderator.admin.revokeConfirm'))) return;
    try { await api(`/api/admin/invites/${token}`, { method: 'DELETE' }); } catch {}
    if (justCreated === token) setJustCreated(null);
    await load();
  }

  function inviteUrl(token: string) {
    return `${window.location.origin}/invite/${token}`;
  }

  async function copyToClipboard(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  const activeInvites = inv.filter(x => !x.usedAt && new Date(x.expiresAt) > new Date());
  const usedInvites   = inv.filter(x => x.usedAt);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        {/* Moderatorlar listesi */}
        <div>
          <h2 className="font-bold text-slate-900 mb-3">{t('moderator.admin.currentMods')} ({mods.length})</h2>
          {loading ? (
            <div className="card p-6 text-sm text-slate-500">{t('common.loading')}</div>
          ) : (
            <div className="space-y-2">
              {mods.map(m => (
                <div key={m.id} className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 text-white flex items-center justify-center font-bold">
                    {m.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{m.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{m.email}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full font-medium">
                    Moderator
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aktif davetler */}
        <div>
          <h2 className="font-bold text-slate-900 mb-3">{t('moderator.admin.activeInvites')} ({activeInvites.length})</h2>
          {activeInvites.length === 0 ? (
            <div className="card p-6 text-sm text-slate-500">{t('moderator.admin.noActive')}</div>
          ) : (
            <div className="space-y-2">
              {activeInvites.map(i => (
                <div key={i.token} className={`card p-4 ${justCreated === i.token ? 'ring-2 ring-brand-400' : ''}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      {i.note && <p className="text-sm font-medium text-slate-900 mb-1">{i.note}</p>}
                      <p className="text-[11px] text-slate-500">
                        {t('moderator.admin.expiresAt')}: {new Date(i.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    <button onClick={() => revokeInvite(i.token)}
                            className="text-xs text-red-600 hover:underline">{t('moderator.admin.revoke')}</button>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                    <code className="flex-1 text-[11px] text-slate-700 truncate">{inviteUrl(i.token)}</code>
                    <button onClick={() => copyToClipboard(inviteUrl(i.token))}
                            className="text-xs px-2.5 py-1 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition flex-shrink-0">
                      {copied ? `✓ ${t('common.copied')}` : t('common.copy')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kullanılmış davetler */}
        {usedInvites.length > 0 && (
          <div>
            <h2 className="font-bold text-slate-900 mb-3 text-sm text-slate-500">{t('moderator.admin.usedInvites')}</h2>
            <div className="space-y-2">
              {usedInvites.slice(0, 5).map(i => (
                <div key={i.token} className="card p-3 opacity-60">
                  <p className="text-xs text-slate-600">
                    {i.note ? `${i.note} · ` : ''}
                    {t('moderator.admin.usedAt')}: {i.usedAt && new Date(i.usedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Yeni davet linki */}
      <aside className="lg:sticky lg:top-4 self-start">
        <div className="card p-5 bg-gradient-to-br from-brand-50 to-indigo-50 border-brand-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 text-white flex items-center justify-center">
              ✦
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{t('moderator.admin.newInvite')}</h3>
              <p className="text-[11px] text-slate-500">{t('moderator.admin.shareWarning')}</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-4">{t('moderator.admin.inviteDesc')}</p>

          <div className="mb-3">
            <label className="label text-xs">{t('moderator.admin.noteLabel')}</label>
            <input className="input text-sm" placeholder={t('moderator.admin.notePlaceholder')}
                   value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <button onClick={createInvite} disabled={creating}
                  className="btn-primary w-full disabled:opacity-50">
            {creating ? t('moderator.admin.creating') : `✦ ${t('moderator.admin.createInvite')}`}
          </button>

          <p className="text-[10px] text-slate-500 text-center mt-3">{t('moderator.admin.linkValidity')}</p>
        </div>
      </aside>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    in_translation: 'bg-indigo-100 text-indigo-700',
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
