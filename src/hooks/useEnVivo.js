import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useSocket } from '../context/SocketContext';

// Escucha eventos del socket y vuelve a pedir el estado por REST cuando:
// llega uno de esos eventos, el socket se reconecta, o la app vuelve a primer
// plano. Los eventos emitidos durante un corte no se reenvían (ISSUES.md),
// así que el REST es la fuente de verdad y el socket solo avisa que cambió algo.
export default function useEnVivo(eventos, recargar, { filtro } = {}) {
  const { socket } = useSocket() ?? {};
  const ref = useRef(recargar);
  ref.current = recargar;

  useEffect(() => {
    if (!socket) return undefined;
    const handler = (data) => { if (!filtro || filtro(data)) ref.current?.(data); };
    const alReconectar = () => ref.current?.();
    eventos.forEach((e) => socket.on(e, handler));
    socket.io?.on?.('reconnect', alReconectar);
    return () => {
      eventos.forEach((e) => socket.off(e, handler));
      socket.io?.off?.('reconnect', alReconectar);
    };
  }, [socket, eventos.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') ref.current?.(); });
    return () => sub.remove();
  }, []);
}
