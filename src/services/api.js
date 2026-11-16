import axios from 'axios';
import { auth } from './firebase';

// Backend: EXPO_PUBLIC_API_URL si está en el .env. Si no, en desarrollo (Metro)
// se usa staging y en un build de producción, el backend de producción.
const STAGING = 'https://nombre-proyecto-back-staging.up.railway.app';
const PRODUCCION = 'https://nombre-proyecto-back-production.up.railway.app';
const baseURL = (process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? STAGING : PRODUCCION)).replace(/\/$/, '');

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

export { baseURL };
export default api;
