import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';
import api from './api';

// Login con email y contraseña
export async function loginEmail(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
  // onAuthStateChanged en useAuth se dispara solo → llama a /api/auth/login → setUser
}

// Registro de cliente — el backend crea el usuario en Firebase + DB
export async function registroCliente(datos) {
  // datos: { nombre, apellido, dni, email, contrasena, telefono?, cuit?, nombre_empresa?, direccion_principal? }
  await api.post('/api/auth/registro-cliente', datos);

  // Activar sesión Firebase en el dispositivo para obtener token
  await signInWithEmailAndPassword(auth, datos.email, datos.contrasena);
}

// Registro de conductor — el backend crea el usuario con estado pendiente_verificacion
export async function registroConductor(datos) {
  // datos: { nombre, apellido, dni, email, contrasena, telefono?, nro_licencia, licencia_vencimiento }
  await api.post('/api/auth/registro-conductor', datos);

  // Activar sesión Firebase
  await signInWithEmailAndPassword(auth, datos.email, datos.contrasena);
}

// Cierra sesión
export async function logout() {
  await signOut(auth);
}
