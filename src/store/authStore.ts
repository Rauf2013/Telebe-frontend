import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { api, setToken, getToken } from '../api/client';

interface AuthState {
  user: User | null;
  hydrated: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ ok: boolean; error?: string; requiresOtp?: boolean; phone?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  resendOtp: (phone: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  whatsapp?: string;
  country: string;
  city: string;
}

const codeMap: Record<string, string> = {
  invalid_credentials: 'invalidCredentials',
  email_exists: 'emailExists',
  missing_fields: 'fillAll',
  weak_password: 'weakPassword',
  forbidden_role: 'forbiddenRole',
  network_error: 'networkError',
  invalid_code: 'invalidCode',
  expired_code: 'expiredCode',
  too_many_attempts: 'tooManyAttempts',
  no_pending_registration: 'noPendingRegistration',
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

  // Step 1: Register sends OTP via SMS. Does NOT log the user in yet.
  register: async (data) => {
    try {
      const r = await api<{ ok: boolean; requiresOtp?: boolean; phone?: string }>(
        '/api/auth/register', { body: data },
      );
      return { ok: true, requiresOtp: !!r.requiresOtp, phone: r.phone };
    } catch (e) {
      const code = (e as { code?: string }).code;
      return { ok: false, error: code ? (codeMap[code] ?? 'unknownError') : 'unknownError' };
    }
  },

  // Step 2: Verify OTP — this is where the user is actually created server-side and a token returns.
  verifyOtp: async (phone, code) => {
    try {
      const { user, token } = await api<{ user: User; token: string }>('/api/auth/verify-otp', {
        body: { phone, code },
      });
      setToken(token);
      set({ user });
      return { ok: true };
    } catch (e) {
      const errCode = (e as { code?: string }).code;
      return { ok: false, error: errCode ? (codeMap[errCode] ?? 'unknownError') : 'unknownError' };
    }
  },

  resendOtp: async (phone) => {
    try {
      await api('/api/auth/resend-otp', { body: { phone } });
      return { ok: true };
    } catch (e) {
      const errCode = (e as { code?: string }).code;
      return { ok: false, error: errCode ? (codeMap[errCode] ?? 'unknownError') : 'unknownError' };
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

