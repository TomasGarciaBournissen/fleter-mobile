import React, { createContext, useContext, useEffect, useState } from 'react';
import { conectarSocket, desconectarSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      desconectarSocket();
      setSocket(null);
      return;
    }
    conectarSocket().then(s => {
      if (!s) { console.warn('[Socket] conectarSocket() devolvió null/undefined'); return; }
      s.on('connect',    () => { console.log('[Socket] conectado, id:', s.id); setSocket(s); });
      s.on('disconnect', (reason) => { console.warn('[Socket] desconectado, razón:', reason); setSocket(null); });
      s.on('connect_error', (err) => console.error('[Socket] error de conexión:', err.message));
      if (s.connected) { console.log('[Socket] ya estaba conectado, id:', s.id); setSocket(s); }
    });
    return () => {
      desconectarSocket();
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
