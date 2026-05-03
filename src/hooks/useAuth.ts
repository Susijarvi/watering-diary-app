import { useCallback, useEffect, useState } from 'react';
import { fetchAuth, logout as apiLogout, loginWithGoogleCredential } from '../lib/api';
import type { AuthUser } from '../lib/types';

interface AuthState {
  user: AuthUser | null;
  googleClientId: string | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithCredential: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuth()
      .then((data) => {
        setUser(data.user);
        setGoogleClientId(data.googleClientId);
      })
      .catch(() => {
        setUser(null);
        setGoogleClientId(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loginWithCredential = useCallback(async (credential: string) => {
    const u = await loginWithGoogleCredential(credential);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return {
    user,
    googleClientId,
    loading,
    isAdmin: user?.role === 'admin',
    loginWithCredential,
    logout,
  };
}
