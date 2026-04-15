import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  fetchCurrentUser,
  getGoogleAuthUrl,
  logoutUser,
  type AuthUser,
} from '../api/auth.api.js';
import { AuthContext, type AuthContextValue } from './AuthContext.js';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function checkAuth(): Promise<void> {
      try {
        const fetchedUser = await fetchCurrentUser();
        if (!cancelled) {
          setUser(fetchedUser);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((): void => {
    window.location.href = getGoogleAuthUrl();
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
    } catch {
      // Server-side logout failed; still clear local state
    } finally {
      setUser(null);
      navigate('/');
    }
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
