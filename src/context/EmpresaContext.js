import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { DEV_MODE } from '../config';
import { listarViajes, obtenerViaje } from '../services/viajesEmpresa';
import { mock } from '../services/mockEmpresa';
import useEnVivo from '../hooks/useEnVivo';
import { finVentanaInicio } from '../utils/ventana';
import { hora } from '../utils/fechas';
import { partirDireccion } from '../components/viaje/Recorrido';
import { MIN_TARDE } from '../components/empresa/TablaParadas';

// Estado compartido del lado de la empresa: qué organización es, si el usuario
// es responsable, y las alertas (pestaña Alertas y su contador en la barra).
//
// Alertas en dos grupos (prototipo de la fase 3):
// · «Para resolver»: sale del REST, así sobrevive a reconexiones y reinicios:
//   rechazados que todavía se pueden reasignar, sin confirmar por vencer y
//   viajes que la empresa ya puede cerrar a mano. Se van solos al resolverse.
// · «Hoy»: lo que avisa el socket (desvíos, salidas tarde, entregas,
//   confirmaciones). No hay historial de alertas en el backend (ISSUES.md #4),
//   así que vive en memoria mientras la app está abierta.
const EmpresaContext = createContext(null);
const RESUELTOS_KEY = '@fleter/rechazos-resueltos';
const HORAS_AVISO_VENCE = 24;

const EVENTOS_REST = [
  'viaje:asignado', 'viaje:desasignado', 'viaje:editado', 'viaje:confirmado', 'viaje:rechazado', 'viaje:iniciado',
  'viaje:estado_cambiado', 'viaje:finalizado', 'viaje:cancelado', 'viaje:vencido', 'viaje:cierre_habilitado', 'serie:asignada',
];

const nombreDe = (v) => v?.conductor?.nombre ?? 'El conductor';

export function EmpresaProvider({ children }) {
  const { user } = useAuth();
  const { socket } = useSocket() ?? {};
  const organizacion = user?.organizacion ?? null;
  const idOrg = organizacion?.id_organizacion ?? null;
  const esResponsable = organizacion?.rol === 'RESPONSABLE';

  const [viajes, setViajes] = useState(null);
  const [resueltos, setResueltos] = useState([]);
  const [hoy, setHoy] = useState(() => (DEV_MODE ? mock.alertasDelDia() : []));
  const porId = useRef(new Map());

  useEffect(() => {
    AsyncStorage.getItem(RESUELTOS_KEY).then((v) => setResueltos(v ? JSON.parse(v) : [])).catch(() => {});
  }, []);

  const recargar = useCallback(async () => {
    if (!idOrg) return;
    try {
      const lista = await listarViajes(idOrg);
      lista.forEach((v) => porId.current.set(v.id_viaje, v));
      setViajes(lista);
    } catch {
      // Sin red: quedan las alertas que ya había; el próximo refetch las corrige
    }
  }, [idOrg]);

  useEffect(() => { recargar(); }, [recargar]);
  useEnVivo(EVENTOS_REST, recargar);

  // Un rechazo resuelto (se asignó a otro conductor) deja de pedir acción
  const resolverRechazo = useCallback((idViaje) => {
    setResueltos((prev) => {
      const nuevo = [...new Set([...prev, idViaje])].slice(-200);
      AsyncStorage.setItem(RESUELTOS_KEY, JSON.stringify(nuevo)).catch(() => {});
      return nuevo;
    });
  }, []);

  const pendientes = useMemo(() => {
    if (!viajes) return [];
    const ahora = Date.now();
    const lista = [];
    viajes.forEach((v) => {
      const [origen] = partirDireccion(v.paradas?.[0]?.direccion);
      const destino = partirDireccion(v.paradas?.[v.paradas.length - 1]?.direccion)[0];
      const recorrido = `${origen} → ${destino}`;
      if (v.estado === 'RECHAZADO' && new Date(v.fecha_programada) > ahora && !resueltos.includes(v.id_viaje)) {
        lista.push({ id: `rech-${v.id_viaje}`, tipo: 'rechazado', viaje: v, fecha: v.fecha_rechazo ?? v.fecha_programada, titulo: `${nombreDe(v)} rechazó VJ-${v.id_viaje}`, texto: `${hora(v.fecha_programada)}. ${recorrido}.` });
      }
      if (v.estado === 'ASIGNADO') {
        const fin = finVentanaInicio(v);
        if (fin - ahora < HORAS_AVISO_VENCE * 3600000) {
          lista.push({ id: `vence-${v.id_viaje}`, tipo: 'por_vencer', viaje: v, fecha: v.creado_en, titulo: `VJ-${v.id_viaje} sin confirmar`, texto: `${nombreDe(v)} tiene hasta las ${hora(fin)}. Si no lo confirma, vence.` });
        }
      }
      if (v.cierre?.cierre_manual_habilitado && !['FINALIZADO', 'CANCELADO'].includes(v.estado)) {
        lista.push({ id: `cierre-${v.id_viaje}`, tipo: 'cierre', viaje: v, fecha: v.cierre.cierre_manual_desde, titulo: `VJ-${v.id_viaje} llegó y no se cerró`, texto: `${nombreDe(v)} no tocó «Salir» en la última parada. Ya lo podés finalizar vos.` });
      }
    });
    return lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [viajes, resueltos]);

  // Feed «Hoy» con los avisos del socket
  const sumar = useCallback((item) => {
    setHoy((prev) => (prev.some((x) => x.id === item.id) ? prev : [{ ...item, nueva: true }, ...prev].slice(0, 50)));
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const v = (d) => porId.current.get(Number(d?.id_viaje));
    const ahora = () => new Date().toISOString();
    const handlers = {
      'alerta:desvio': (d) => sumar({ id: `desvio-${d.id_viaje}-${Date.now()}`, tipo: 'desvio', id_viaje: d.id_viaje, fecha: ahora(), titulo: `${nombreDe(v(d))} se desvió de la ruta`, texto: `VJ-${d.id_viaje}${d.distancia_metros ? `, ${Math.round(d.distancia_metros)} m` : ''}. ${d.mensaje ?? ''}`.trim() }),
      'alerta:parada': (d) => sumar({ id: `parada-${d.id_viaje}-${Date.now()}`, tipo: 'detenido', id_viaje: d.id_viaje, fecha: ahora(), titulo: `${nombreDe(v(d))} está detenido`, texto: `VJ-${d.id_viaje}: hace ${d.minutos_detenido} min que no se mueve.` }),
      'viaje:confirmado': (d) => sumar({ id: `conf-${d.id_viaje}`, tipo: 'confirmado', id_viaje: d.id_viaje, fecha: ahora(), titulo: `${nombreDe(v(d))} confirmó VJ-${d.id_viaje}`, texto: d.vehiculo ? `Lo hace con la ${d.vehiculo.marca} ${d.vehiculo.modelo}.` : 'Ya está confirmado.' }),
      'viaje:vencido': (d) => sumar({ id: `venc-${d.id_viaje}`, tipo: 'vencido', id_viaje: d.id_viaje, fecha: ahora(), titulo: `VJ-${d.id_viaje} venció`, texto: 'No se inició a tiempo. Si todavía hace falta, cargalo de nuevo.' }),
      'viaje:cancelado': (d) => (d.causa === 'CHOFER' ? sumar({ id: `canc-${d.id_viaje}`, tipo: 'cancelado', id_viaje: d.id_viaje, fecha: ahora(), titulo: `${nombreDe(v(d))} canceló VJ-${d.id_viaje}`, texto: 'Si todavía hace falta, cargalo de nuevo con otro conductor.' }) : null),
      'viaje:finalizado': (d) => sumar({ id: `fin-${d.id_viaje}`, tipo: 'entregado', id_viaje: d.id_viaje, fecha: ahora(), titulo: `VJ-${d.id_viaje} entregado`, texto: d.incompleto ? 'Se cerró solo a fin del día, con paradas sin visitar.' : 'El remito ya está listo.' }),
      'parada:salida_detectada': (d) => sumar({ id: `sal-${d.id_parada}`, tipo: 'salida_gps', id_viaje: d.id_viaje, fecha: d.salida_detectada ?? ahora(), titulo: `VJ-${d.id_viaje} salió de la parada ${d.orden}`, texto: 'Lo detectó el GPS; el conductor todavía no tocó «Salir».' }),
      // Salida tarde: el aviso es de la empresa, la diferencia sale de las horas del backend
      'viaje:estado_cambiado': async (d) => {
        if (d.estado !== 'EN_RUTA' || !idOrg) return;
        try {
          const det = await obtenerViaje(idOrg, d.id_viaje);
          const p = [...(det.paradas ?? [])].reverse().find((x) => x.salida_real);
          const tarde = p?.salida_estimada ? Math.round((new Date(p.salida_real) - new Date(p.salida_estimada)) / 60000) : 0;
          if (tarde >= MIN_TARDE) {
            sumar({ id: `tarde-${p.id_parada}`, tipo: 'tarde', id_viaje: d.id_viaje, fecha: p.salida_real, titulo: `VJ-${d.id_viaje} salió ${tarde} min tarde`, texto: `${nombreDe(det)} dejó ${p.lugar?.nombre ?? partirDireccion(p.direccion)[0]}.` });
          }
        } catch { /* sin detalle no hay aviso */ }
      },
    };
    Object.entries(handlers).forEach(([e, h]) => socket.on(e, h));
    return () => Object.entries(handlers).forEach(([e, h]) => socket.off(e, h));
  }, [socket, sumar, idOrg]);

  const marcarVistas = useCallback(() => setHoy((prev) => (prev.some((x) => x.nueva) ? prev.map((x) => ({ ...x, nueva: false })) : prev)), []);

  const value = useMemo(() => ({
    idOrg, organizacion, esResponsable, viajes, recargar,
    pendientes, hoy, marcarVistas, resolverRechazo,
  }), [idOrg, organizacion, esResponsable, viajes, recargar, pendientes, hoy, marcarVistas, resolverRechazo]);

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>;
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) throw new Error('useEmpresa debe usarse dentro de <EmpresaProvider>');
  return ctx;
}
