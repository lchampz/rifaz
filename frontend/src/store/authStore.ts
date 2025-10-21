import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: user => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
