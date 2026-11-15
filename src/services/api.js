import axios from 'axios';
import { auth } from './firebase';

// Sin EXPO_PUBLIC_API_URL: en desarrollo (Metro) se usa staging; en un build
// de producción no hay valor por defecto, para no mandar datos a otro backend.
const STAGING = 'https://nombre-proyecto-back-staging.up.railway.app';
const baseURL = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? STAGING : undefined);
if (!baseURL) console.error('[API] Falta EXPO_PUBLIC_API_URL en el .env del build.');

const api = axios.create({
  baseURL,
  timeout: 30000,
});

// Interceptor: adjunta el Firebase ID token en cada request.
// Firebase maneja el refresh automáticamente — siempre obtenemos un token válido.
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const idToken = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${idToken}`;
  }
  return config;
});

export default api;
