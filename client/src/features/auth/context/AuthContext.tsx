import { createContext } from 'react';
import type { AuthUser } from '../api/auth.api.js';

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
