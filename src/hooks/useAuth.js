import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import api from '../services/api';
import { logout as authLogout } from '../services/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const { data } = await api.post('/api/auth/login');
          setUser(data);
        } catch { setUser(null); }
      } else { setUser(null); }
      setLoading(false);
    });
    return unsub;
  }, []);
  const logout = useCallback(async () => { await authLogout(); setUser(null); }, []);
  return { user, loading, logout, mockLogin: null };
}