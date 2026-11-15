import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, inMemoryPersistence } from 'firebase/auth';
import { persistenciaSesion } from './persistenciaSesion';
import { DEV_MODE } from '../config';

// Configuración del proyecto Firebase: sale del .env (ver .env.example).
const firebaseConfig = {
  // Firebase exige una key para inicializar: sin .env la app arranca igual
  // (en modo desarrollo no se usa; si no, el login falla y queda el error en consola)
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'falta-configurar',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!DEV_MODE && !process.env.EXPO_PUBLIC_FIREBASE_API_KEY) {
  console.error('[Firebase] Falta EXPO_PUBLIC_FIREBASE_API_KEY en el .env: el login no va a andar.');
}

// Evitar re-inicializar en hot reloads
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// La sesión se guarda en el llavero del teléfono (persistenciaSesion.js) para que
// sobreviva a cerrar la app. En modo desarrollo no hay sesión real: queda en memoria.
const auth = initializeAuth(app, {
  persistence: DEV_MODE ? inMemoryPersistence : persistenciaSesion,
});

export { app, auth };
