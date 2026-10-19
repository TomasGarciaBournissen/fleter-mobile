import { useEffect, useRef, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { useSocket } from '../context/SocketContext';
import { DEV_MODE } from '../config';
import { startLocationTracking, stopLocationTracking, setLocationEmitter } from '../tasks/locationTask';

const POS_DEV = { latitude: -34.4590, longitude: -58.9140 }; // en el origen de los viajes de ejemplo

// GPS del viaje. La posición en pantalla se sigue siempre que haya permiso;
// el envío a la empresa (`conductor:ubicacion`) arranca solo con `compartir`,
// que la pantalla prende después del 200 de /iniciar (contrato del Paso 2).
export default function useGpsViaje(idViaje, { compartir }) {
  const { socket } = useSocket() ?? {};
  const [posicion, setPosicion] = useState(DEV_MODE ? POS_DEV : null);
  const [permiso, setPermiso] = useState(DEV_MODE ? 'granted' : null); // null = todavía no se sabe
  const posRef = useRef(posicion);

  // Estado del permiso al entrar
  useEffect(() => {
    if (DEV_MODE) return;
    Location.getForegroundPermissionsAsync().then(({ status }) => setPermiso(status)).catch(() => setPermiso('undetermined'));
  }, []);

  // Pide primero el de primer plano y después «Permitir siempre» (segundo plano)
  const pedirPermiso = useCallback(async () => {
    if (DEV_MODE) { setPermiso('granted'); return 'granted'; }
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermiso(status);
    if (status === 'granted') await Location.requestBackgroundPermissionsAsync().catch(() => {});
    return status;
  }, []);

  // Posición en pantalla
  useEffect(() => {
    if (DEV_MODE || permiso !== 'granted') return undefined;
    let sub = null;
    let activo = true;
    Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 }, (loc) => {
      if (!activo) return;
      const p = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      posRef.current = p;
      setPosicion(p);
    }).then((s) => { sub = s; }).catch(() => {});
    return () => { activo = false; sub?.remove(); };
  }, [permiso]);

  // Envío de la ubicación a la empresa mientras el viaje está en curso
  useEffect(() => {
    if (DEV_MODE || !compartir || !socket || !idViaje || permiso !== 'granted') return undefined;
    let intervalo = null;
    const emitir = (lat, lng) => socket.emit('conductor:ubicacion', { id_viaje: idViaje, lat, lng, timestamp: Date.now() });
    setLocationEmitter(emitir);
    startLocationTracking().catch(() => {
      // Sin tarea en segundo plano: emitir desde primer plano cada 15 s
      intervalo = setInterval(() => {
        const p = posRef.current;
        if (p) emitir(p.latitude, p.longitude);
      }, 15000);
    });
    return () => {
      if (intervalo) clearInterval(intervalo);
      stopLocationTracking();
    };
  }, [compartir, socket, idViaje, permiso]);

  // Posición precisa para iniciar o confirmar una parada
  const posicionActual = useCallback(async () => {
    if (DEV_MODE) return { lat: POS_DEV.latitude, lng: POS_DEV.longitude };
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  }, []);

  return { posicion, permiso, pedirPermiso, posicionActual, compartiendo: !!compartir && permiso === 'granted' };
}
