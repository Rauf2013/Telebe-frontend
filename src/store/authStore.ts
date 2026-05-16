import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { api, setToken, getToken } from '../api/client';

interface AuthState {
  user: User | null;
  hydrated: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  whatsapp?: string;
  universityId?: string;
}

const codeMap: Record<string, string> = {
  invalid_credentials: 'invalidCredentials',
  email_exists: 'emailExists',
  missing_fields: 'fillAll',
  weak_password: 'weakPassword',
  forbidden_role: 'forbiddenRole',
  network_error: 'networkError',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  init: async () => {
    if (!getToken()) { set({ hydrated: true }); return; }
    try {
      const { user } = await api<{ user: User }>('/api/auth/me');
      set({ user, hydrated: true });
    } catch {
      setToken(null);
      set({ user: null, hydrated: true });
    }
  },

  login: async (email, password) => {
    try {
      const { user, token } = await api<{ user: User; token: string }>('/api/auth/login', {
        body: { email, password },
      });
      setToken(token);
      set({ user });
      return { ok: true };
    } catch (e) {
      const code = (e as { code?: string }).code;
      return { ok: false, error: code ? (codeMap[code] ?? 'unknownError') : 'unknownError' };
    }
  },

  register: async (data) => {
    try {
      const { user, token } = await api<{ user: User; token: string }>('/api/auth/register', { body: data });
      setToken(token);
      set({ user });
      return { ok: true };
    } catch (e) {
      const code = (e as { code?: string }).code;
      return { ok: false, error: code ? (codeMap[code] ?? 'unknownError') : 'unknownError' };
    }
  },

  logout: () => {
    setToken(null);
    set({ user: null });
  },
}));

export function dashboardPath(role: UserRole): string {
  return role === 'student' ? '/student' : role === 'university' ? '/university' : '/moderator';
}

