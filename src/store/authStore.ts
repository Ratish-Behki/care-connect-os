import { create } from 'zustand';
import { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => void;
  signup: (name: string, email: string, password: string, role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (_email, _password, role) => {
    set({
      user: {
        id: '1',
        name: role === 'patient' ? 'Sarah Johnson' : 'Dr. Smith',
        email: _email,
        role,
      },
      isAuthenticated: true,
    });
  },
  signup: (name, email, _password, role) => {
    set({
      user: { id: '1', name, email, role },
      isAuthenticated: true,
    });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
