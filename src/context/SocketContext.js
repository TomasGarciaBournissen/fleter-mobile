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
      if (!s) return;
      s.on('connect',    () => setSocket(s));
      s.on('disconnect', () => setSocket(null));
      // If already connected (fast connect), set immediately
      if (s.connected) setSocket(s);
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
