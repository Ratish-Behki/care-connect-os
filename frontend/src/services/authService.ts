import { api } from '@/lib/api';
import type { UserRole } from '@/types';

export const authService = {
  login: (input: { email: string; password: string; role: UserRole }) => api.login(input),
  signup: (input: { name: string; email: string; password: string; role: UserRole }) => api.signup(input),
};
