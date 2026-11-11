import { io } from 'socket.io-client';
import { auth } from './firebase';

let socket = null;
let timer = null;
let intentos = 0;

const tokenBearer = async (forzar = false) => `Bearer ${await auth.currentUser.getIdToken(forzar)}`;

export async function conectarSocket() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  // Mismo Firebase ID token que usa el interceptor de axios
  socket = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000', {
    auth: { token: await tokenBearer() },
    transports: ['websocket'],
  });
  socket.on('connect', () => { intentos = 0; });
  socket.on('connect_error', (err) => reintentar(socket, err));

  return socket;
}

// Un rechazo del middleware de socket.io (rate limit, token vencido) NO se
// reconecta solo: hay que volver a llamar a connect() (API.md → «Socket.io —
// handshake»). Los cortes de red sí los reintenta socket.io por su cuenta.
function reintentar(s, err) {
  if (s !== socket || s.active) return; // `active`: socket.io ya lo está reintentando
  clearTimeout(timer);
  const motivo = err?.message;
  if (motivo === 'Usuario no registrado') return;
  intentos += 1;
  const backoff = Math.min(1000 * 2 ** (intentos - 1), 30000);
  const espera = motivo === 'RATE_LIMIT'
    ? (Number(err?.data?.retryAfter) || 30) * 1000 + Math.random() * 3000
    : backoff;
  const tokenVencido = motivo === 'Token invalido' || motivo === 'Token no proporcionado';
  timer = setTimeout(async () => {
    if (s !== socket || !auth.currentUser) return;
    try {
      if (tokenVencido) s.auth = { token: await tokenBearer(true) };
    } catch (e) {
      // Sin red para refrescar el token: se reintenta igual con el anterior
    }
    s.connect();
  }, espera);
}

export function getSocket() {
  return socket;
}

export function desconectarSocket() {
  clearTimeout(timer);
  intentos = 0;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
