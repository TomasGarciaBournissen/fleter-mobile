import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { logout as firebaseLogout, obtenerPerfil } from '../services/auth';
import api from '../services/api';
import { DEV_MODE } from '../config';
import { mensajeDeError } from '../utils/errores';

export { DEV_MODE };

// ─── CONFIG DEV ───────────────────────────────────────────────────────────────
const DEV_ROL = null; // null = Login, 'CLIENTE', 'CLIENTE_SIN_EMPRESA', 'CONDUCTOR'
// ─────────────────────────────────────────────────────────────────────────────

const DEV_USERS = {
  CLIENTE: {
    id_usuario: 1, nombre: 'Ana', apellido: 'Ferreyra', email: 'ana@distribuidoranorte.com.ar', rol: 'CLIENTE',
    organizacion: { id_organizacion: 1, nombre: 'Distribuidora Norte', estado: 'TRIAL', rol: 'RESPONSABLE' },
  },
  CLIENTE_SIN_EMPRESA: {
    id_usuario: 1, nombre: 'Ana', apellido: 'Ferreyra', email: 'ana@distribuidoranorte.com.ar', rol: 'CLIENTE',
    organizacion: null,
  },
  CONDUCTOR: {
    id_usuario: 2, nombre: 'Martín', apellido: 'Gómez', email: 'martin.gomez@gmail.com', rol: 'CONDUCTOR',
    organizaciones: [{ id_organizacion: 1, nombre: 'Distribuidora Norte' }],
  },
  GERENTE: {
    id_usuario: 3, nombre: 'Laura', apellido: 'Gómez', email: 'laura@empresa.com', rol: 'GERENTE',
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEV_MODE && DEV_ROL ? DEV_USERS[DEV_ROL] : null);
  const [loading, setLoading] = useState(!DEV_MODE);
  // Error al abrir sesión (p. ej. una cuenta de Google sin registro en Fleter)
  const [errorSesion, setErrorSesion] = useState('');
  // Mientras un alta está en curso, RootNavigator deja el AuthStack montado
  // aunque Firebase ya haya abierto la sesión (registro → vehículo → código).
  const [altaEnCurso, setAltaEnCurso] = useState(false);
  // Rol que se está dando de alta (antes de tener sesión): define el tema
  // por defecto del alta, oscuro para el conductor.
  const [rolEnAlta, setRolEnAlta] = useState(null);

  // /api/auth/login confirma que existe en la DB; /me suma la empresa
  // (`organizacion` del CLIENTE) o las empresas (`organizaciones` del CONDUCTOR).
  const cargarUsuario = useCallback(async () => {
    const { data: base } = await api.post('/api/auth/login');
    try {
      const perfil = await obtenerPerfil();
      return { ...base, ...perfil };
    } catch {
      return base;
    }
  }, []);

  useEffect(() => {
    if (DEV_MODE) return;
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          setUser(await cargarUsuario());
          setErrorSesion('');
        } catch (err) {
          console.error('[Auth] login error:', err?.response?.status, err?.response?.data ?? err?.message);
          // Sin registro en la DB no hay sesión posible: se cierra Firebase y se avisa
          if (err?.response?.status === 404) {
            setErrorSesion(mensajeDeError(err));
            firebaseLogout().catch(() => {});
          }
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [cargarUsuario]);

  // Vuelve a pedir el perfil (después de crear la empresa o canjear un código)
  const refrescarUsuario = useCallback(async () => {
    if (DEV_MODE) {
      setUser((u) => (u?.rol === 'CLIENTE' && !u.organizacion ? DEV_USERS.CLIENTE : u));
      return;
    }
    setUser(await cargarUsuario());
  }, [cargarUsuario]);

  const mockLogin = useCallback((rol = 'CLIENTE') => {
    setUser(DEV_USERS[rol]);
  }, []);

  const logout = useCallback(async () => {
    if (!DEV_MODE) await firebaseLogout();
    setAltaEnCurso(false);
    setRolEnAlta(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, mockLogin, logout, refrescarUsuario,
      errorSesion, setErrorSesion, altaEnCurso, setAltaEnCurso, rolEnAlta, setRolEnAlta,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
