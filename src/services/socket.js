import { io } from 'socket.io-client';
import { auth } from './firebase';

let socket = null;

export async function conectarSocket() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  // Mismo Firebase ID token que usa el interceptor de axios
  const idToken = await currentUser.getIdToken();

  socket = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000', {
    auth: { token: idToken },
    transports: ['websocket'],
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function desconectarSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
