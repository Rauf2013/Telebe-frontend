import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { ChatMessage } from '../types';

/**
 * Direct chat between the student and the approved university rep.
 * Per spec: only available after the choice is approved AND the second payment
 * is paid — that's enforced server-side; the parent component should also hide
 * this panel when the chat is locked, but the API will return chat_locked on
 * load if the user tries to peek too early.
 */
export default function ChatPanel({ applicationId, otherPartyName }: {
  applicationId: string;
  otherPartyName?: string;
}) {
  const { t } = useTranslation();
  const me = useAuthStore(s => s.user)!;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [locked, setLocked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const r = await api<{ messages: ChatMessage[] }>(`/api/applications/${applicationId}/messages`);
      setMessages(r.messages);
      setLocked(false);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'chat_locked') setLocked(true);
    }
  }

  useEffect(() => {
    load();
    // Light-touch polling: every 6s while the panel is open. Cheap, simple,
    // good enough until we wire up WebSocket / SSE.
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const r = await api<{ message: ChatMessage }>(`/api/applications/${applicationId}/messages`, {
        body: { content: text },
      });
      setMessages(prev => [...prev, r.message]);
      setDraft('');
    } finally {
      setSending(false);
    }
  }

  if (locked) {
    return (
      <div className="card p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="font-bold text-slate-900 mb-1">{t('chat.lockedTitle')}</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">{t('chat.lockedDesc')}</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden flex flex-col" style={{ height: 'min(560px, 70vh)' }}>
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
          {(otherPartyName ?? '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">
            {otherPartyName ?? t('chat.counterpart')}
          </p>
          <p className="text-[11px] text-slate-500">
            {me.role === 'student' ? t('chat.youAreStudent') : t('chat.youAreUniversity')}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 bg-slate-50/40">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">{t('chat.empty')}</p>
        )}
        {messages.map(m => {
          const mine = m.senderId === me.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                mine
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`text-[10px] mt-1 ${mine ? 'text-brand-100' : 'text-slate-400'}`}>
                  {new Date(m.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="border-t border-slate-100 p-3 flex gap-2 bg-white">
        <input
          className="input flex-1"
          placeholder={t('chat.placeholder')}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          disabled={sending}
          maxLength={4000}
        />
        <button type="submit" className="btn-primary px-5" disabled={sending || !draft.trim()}>
          {sending ? '…' : t('chat.send')}
        </button>
      </form>
    </div>
  );
}
