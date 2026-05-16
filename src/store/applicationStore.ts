import { create } from 'zustand';
import type { Application, ApplicationStatus, FacultyChoice } from '../types';
import { api } from '../api/client';

interface State {
  applications: Application[];
  myApp: Application | null;
  loaded: boolean;

  loadMine: () => Promise<void>;
  loadAll: () => Promise<void>;

  upsertChoices:    (choices: FacultyChoice[]) => Promise<void>;
  addDocument:      (type: string, file: File) => Promise<void>;
  removeDocument:   (docId: string) => Promise<void>;
  setFirstPayment:  () => Promise<void>;
  setSecondPayment: () => Promise<void>;

  attachTranslation: (appId: string, docId: string, file: File) => Promise<void>;
  setChoiceStatus:   (appId: string, facultyId: string, status: ApplicationStatus, patch?: { tuitionFee?: number; notes?: string }) => Promise<void>;
}

function mergeApp(list: Application[], app: Application): Application[] {
  const idx = list.findIndex(a => a.id === app.id);
  if (idx >= 0) { const next = [...list]; next[idx] = app; return next; }
  return [...list, app];
}

export const useAppStore = create<State>((set) => ({
  applications: [],
  myApp: null,
  loaded: false,

  loadMine: async () => {
    try {
      const { application } = await api<{ application: Application | null }>('/api/applications/mine');
      set({ myApp: application, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  loadAll: async () => {
    try {
      const { applications } = await api<{ applications: Application[] }>('/api/applications');
      set({ applications, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  upsertChoices: async (choices) => {
    const { application } = await api<{ application: Application }>('/api/applications/choices', { body: { choices } });
    set({ myApp: application });
  },

  addDocument: async (type, file) => {
    const fd = new FormData();
    fd.append('type', type);
    fd.append('file', file);
    const { application } = await api<{ application: Application }>('/api/applications/documents', { formData: fd });
    set({ myApp: application });
  },

  removeDocument: async (docId) => {
    const { application } = await api<{ application: Application }>(`/api/applications/documents/${docId}`, { method: 'DELETE' });
    set({ myApp: application });
  },

  setFirstPayment: async () => {
    const { application } = await api<{ application: Application }>('/api/applications/payment/first', { body: {} });
    set({ myApp: application });
  },

  setSecondPayment: async () => {
    const { application } = await api<{ application: Application }>('/api/applications/payment/second', { body: {} });
    set({ myApp: application });
  },

  attachTranslation: async (appId, docId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    const { application } = await api<{ application: Application }>(
      `/api/applications/${appId}/documents/${docId}/translation`, { formData: fd }
    );
    set(s => ({ applications: mergeApp(s.applications, application) }));
  },

  setChoiceStatus: async (appId, facultyId, status, patch) => {
    const { application } = await api<{ application: Application }>(
      `/api/applications/${appId}/choices/${facultyId}/status`,
      { body: { status, ...patch } }
    );
    set(s => ({ applications: mergeApp(s.applications, application) }));
  },
}));
