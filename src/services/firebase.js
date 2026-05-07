import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, inMemoryPersistence } from 'firebase/auth';

// Configuración del proyecto Firebase — completar con los valores del backend
// Pedile a Persona 1 (backend) las credenciales del proyecto Firebase dev
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Evitar re-inicializar en hot reloads
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// inMemoryPersistence: funciona en Expo Go sin módulos nativos.
// Cuando hagan el build nativo pueden cambiar a getReactNativePersistence(AsyncStorage)
// para que la sesión sobreviva a reinicios de la app.
const auth = initializeAuth(app, {
  persistence: inMemoryPersistence,
});

export { app, auth };
