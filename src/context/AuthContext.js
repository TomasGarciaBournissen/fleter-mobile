import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── CONFIG DEV ───────────────────────────────────────────────────────────────
export const DEV_MODE = true;
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
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEV_MODE && DEV_ROL ? DEV_USERS[DEV_ROL] : null);
  const [loading] = useState(false);

  const mockLogin = useCallback((rol = 'CLIENTE') => {
    setUser(DEV_USERS[rol]);
  }, []);

  const logout = useCallback(() => {
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
