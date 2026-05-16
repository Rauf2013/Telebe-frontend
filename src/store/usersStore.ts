import { create } from 'zustand';
import type { User } from '../types';
import { api } from '../api/client';

interface State {
  users: Record<string, User>;
  loaded: boolean;
  load: () => Promise<void>;
}

export const useUsersStore = create<State>((set, get) => ({
  users: {},
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    try {
      const { users } = await api<{ users: User[] }>('/api/users');
      const map: Record<string, User> = {};
      users.forEach(u => { map[u.id] = u; });
      set({ users: map, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));

export function getCachedUser(id: string): User | undefined {
  return useUsersStore.getState().users[id];
}
