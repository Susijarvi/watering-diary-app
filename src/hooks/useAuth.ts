import { useEffect, useState } from 'react';
import { fetchAuth } from '../lib/api';
import type { AuthInfo } from '../lib/types';

interface AuthState {
  auth: AuthInfo | null;
  loading: boolean;
  isAdmin: boolean;
}

export function useAuth(): AuthState {
  const [auth, setAuth] = useState<AuthInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuth()
      .then((p) => setAuth(p.clientPrincipal))
      .catch(() => setAuth(null))
      .finally(() => setLoading(false));
  }, []);

  return {
    auth,
    loading,
    isAdmin: auth?.userRoles?.includes('admin') ?? false,
  };
}
