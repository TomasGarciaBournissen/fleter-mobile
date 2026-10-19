import {
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';
import api from './api';
import { DEV_MODE } from '../config';

// Login con email y contraseña
export async function loginEmail(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
  // onAuthStateChanged en AuthContext se dispara solo → /api/auth/login + /me → setUser
}

// Login con Google: el idToken lo consigue useGoogleLogin (services/google.js)
export async function loginGoogle(idToken) {
  await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}

// Manda el link para crear una contraseña nueva (vence en 1 h, default de Firebase)
export async function recuperarContrasena(email) {
  if (DEV_MODE) return;
  await sendPasswordResetEmail(auth, email);
}

// Registro de usuario de empresa (rol CLIENTE). La empresa se crea aparte
// con POST /api/organizaciones o se entra con un código de miembro.
export async function registroCliente(datos) {
  // datos: { nombre, apellido, dni, email, contrasena, telefono? }
  if (DEV_MODE) return;
  await api.post('/api/auth/registro-cliente', datos);
  // Activar sesión Firebase en el dispositivo para obtener token
  await signInWithEmailAndPassword(auth, datos.email, datos.contrasena);
}

// Registro de conductor
export async function registroConductor(datos) {
  // datos: { nombre, apellido, dni, email, contrasena, telefono?, nro_licencia, licencia_vencimiento }
  if (DEV_MODE) return;
  await api.post('/api/auth/registro-conductor', datos);
  await signInWithEmailAndPassword(auth, datos.email, datos.contrasena);
}

// Registro de gerente (marketplace, archivado en screens/auth/_marketplace)
export async function registroGerente(datos) {
  await api.post('/api/auth/registro-gerente', datos);
  await signInWithEmailAndPassword(auth, datos.email, datos.contrasena);
}

// Perfil completo con la empresa (CLIENTE) o las empresas (CONDUCTOR)
export async function obtenerPerfil() {
  const { data } = await api.get('/api/auth/me');
  return data;
}

// Cierra sesión
export async function logout() {
  await signOut(auth);
}
