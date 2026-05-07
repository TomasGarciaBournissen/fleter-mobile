import { useState, useCallback } from 'react';

// ─── CONFIG DEV ───────────────────────────────────────────────────────────────
//
//  DEV_MODE = true  → usa mock, no necesita Firebase ni backend
//  DEV_MODE = false → usa Firebase real (requiere .env con credenciales)
//
const DEV_MODE = true;

//  DEV_ROL controla qué pantalla ves al arrancar:
//    null        → pantalla de Login (para probar el flujo de auth)
//    'CLIENTE'   → entra directo al stack del cliente
//    'CONDUCTOR' → entra directo al stack del fletero
//
const DEV_ROL = null;

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

export function useAuth() {
  const [user, setUser] = useState(DEV_MODE && DEV_ROL ? DEV_USERS[DEV_ROL] : null);
  const [loading] = useState(false);

  // En dev mode: cualquier email/password "funciona" y simula el rol elegido
  const mockLogin = useCallback((rol = 'CLIENTE') => {
    setUser(DEV_USERS[rol]);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return { user, loading, logout, mockLogin };
}

// ─── CUANDO TENGAS FIREBASE LISTO ────────────────────────────────────────────
// 1. Completá el .env con las credenciales
// 2. Cambiá DEV_MODE = false
// 3. Reemplazá el contenido de este archivo por:
//
// import { useState, useEffect, useCallback } from 'react';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../services/firebase';
// import api from '../services/api';
// import { logout as authLogout } from '../services/auth';
//
// export function useAuth() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, async (fbUser) => {
//       if (fbUser) {
//         try {
//           const { data } = await api.post('/api/auth/login');
//           setUser(data);
//         } catch { setUser(null); }
//       } else { setUser(null); }
//       setLoading(false);
//     });
//     return unsub;
//   }, []);
//   const logout = useCallback(async () => { await authLogout(); setUser(null); }, []);
//   return { user, loading, logout, mockLogin: null };
// }
