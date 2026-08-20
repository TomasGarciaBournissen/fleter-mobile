import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { logout as firebaseLogout } from '../services/auth';
import api from '../services/api';

// ─── CONFIG DEV ───────────────────────────────────────────────────────────────
export const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE !== 'false';
const DEV_ROL = null; // null = Login, 'CLIENTE', 'CONDUCTOR'
// ─────────────────────────────────────────────────────────────────────────────

const DEV_USERS = {
  CLIENTE: {
    id_usuario: 1,
    nombre: 'Tomi',
    apellido: 'García',
    email: 'tomi@empresa.com',
    rol: 'CLIENTE',
  },
  CONDUCTOR: {
    id_usuario: 2,
    nombre: 'Carlos',
    apellido: 'Martínez',
    email: 'carlos@fletero.com',
    rol: 'CONDUCTOR',
  },
  GERENTE: {
    id_usuario: 3,
    nombre: 'Laura',
    apellido: 'Gómez',
    email: 'laura@empresa.com',
    rol: 'GERENTE',
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEV_MODE && DEV_ROL ? DEV_USERS[DEV_ROL] : null);
  const [loading, setLoading] = useState(!DEV_MODE);

  useEffect(() => {
    if (DEV_MODE) return;
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const { data } = await api.post('/api/auth/login');
          console.log('[Auth] login response:', JSON.stringify(data));
          setUser(data);
        } catch (err) {
          console.error('[Auth] login error:', err?.response?.status, err?.response?.data ?? err?.message);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const mockLogin = useCallback((rol = 'CLIENTE') => {
    setUser(DEV_USERS[rol]);
  }, []);

  const logout = useCallback(async () => {
    if (!DEV_MODE) await firebaseLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, mockLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
