import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setSession: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,
      setSession: (user, token) => set({ user, token, isAuthenticated: true }),
      setUser: (user) => set({ user, isAuthenticated: true }),
      setHydrated: (value) => set({ hasHydrated: value }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'care-connect-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
