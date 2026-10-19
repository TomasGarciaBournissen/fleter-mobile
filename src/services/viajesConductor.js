import api from './api';
import { DEV_MODE } from '../config';

// Viaje interno del lado del conductor (API.md de develop → «Viaje interno», Pasos 2 a 4).
// El mobile no calcula nada: estados, tiempos, distancias y remito vienen del backend.

export async function listarViajes(params = {}) {
  if (DEV_MODE) return mock.listar(params);
  const { data } = await api.get('/api/choferes/viajes', { params });
  return data;
}

export async function obtenerViaje(id) {
  if (DEV_MODE) return mock.obtener(id);
  const { data } = await api.get(`/api/choferes/viajes/${id}`);
  return data;
}

export async function confirmarViaje(id, idVehiculo) {
  if (DEV_MODE) return mock.cambiar(id, 'CONFIRMADO');
  const { data } = await api.post(`/api/choferes/viajes/${id}/confirmar`, { id_vehiculo: idVehiculo });
  return data;
}

export async function rechazarViaje(id) {
  if (DEV_MODE) return mock.cambiar(id, 'RECHAZADO');
  const { data } = await api.post(`/api/choferes/viajes/${id}/rechazar`);
  return data;
}

export async function cancelarViaje(id) {
  if (DEV_MODE) return mock.cambiar(id, 'CANCELADO', { causa_cancelacion: 'CHOFER' });
  const { data } = await api.post(`/api/choferes/viajes/${id}/cancelar`);
  return data;
}

// Iniciar = llegar a la parada 1 (valida ventana y 50 m del origen en el backend)
export async function iniciarViaje(id, { lat, lng }) {
  if (DEV_MODE) return mock.iniciar(id);
  const { data } = await api.post(`/api/choferes/viajes/${id}/iniciar`, { lat, lng });
  return data;
}

// Salir de la parada actual; desde la última finaliza el viaje
export async function salirDeParada(id) {
  if (DEV_MODE) return mock.salir(id);
  const { data } = await api.post(`/api/choferes/viajes/${id}/salir`);
  return data;
}

// Llegar a la siguiente parada (por proximidad, en orden)
export async function confirmarLlegada(id, idParada, { lat, lng }) {
  if (DEV_MODE) return mock.llegar(id, idParada);
  const { data } = await api.post(`/api/viajes/${id}/confirmar-parada`, { id_parada: idParada, lat, lng });
  return data;
}

export async function misVehiculos() {
  if (DEV_MODE) return mock.vehiculos;
  const { data } = await api.get('/api/conductores/mis-vehiculos');
  return data;
}

export async function misOrganizaciones() {
  if (DEV_MODE) return mock.organizaciones;
  const { data } = await api.get('/api/choferes/mis-organizaciones');
  return data;
}

export async function desvincularme(idOrganizacion) {
  if (DEV_MODE) {
    mock.organizaciones = mock.organizaciones.filter((o) => o.id_organizacion !== idOrganizacion);
    return { viajes_cancelados: [], series_borradas: [] };
  }
  const { data } = await api.delete(`/api/choferes/mis-organizaciones/${idOrganizacion}`);
  return data;
}

// ─── Datos de ejemplo para el modo desarrollo ──────────────────────────────
const mock = (() => {
  const en = (dias, h, m) => { const d = new Date(); d.setDate(d.getDate() + dias); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const masMin = (iso, min) => new Date(new Date(iso).getTime() + min * 60000).toISOString();
  const DN = { id_organizacion: 1, nombre: 'Distribuidora Norte', cuit: '30712345671' };
  const FS = { id_organizacion: 2, nombre: 'Frigorífico Sur', cuit: '30698765432' };
  const transit = { id_vehiculo: 10, patente: 'AE421KL', marca: 'Ford', modelo: 'Transit', anio: 2022, color: 'Blanco', tipo_vehiculo: 'utilitario', condiciones: [{ condicion: 'FRAGIL' }, { condicion: 'VOLUMINOSO' }] };
  const daily = { id_vehiculo: 11, patente: 'AD118PQ', marca: 'Iveco', modelo: 'Daily', anio: 2019, color: 'Gris', tipo_vehiculo: 'camion_chico', condiciones: [{ condicion: 'REFRIGERADO' }, { condicion: 'CARGA_PESADA' }] };

  const parada = (id, orden, direccion, lat, lng, llegada, peon = 20, extra = {}) => ({
    id_parada: id, orden, direccion, latitud: lat, longitud: lng, estado: 'PENDIENTE',
    llegada_estimada: llegada, salida_estimada: masMin(llegada, peon), peon_estimado_min: peon,
    llegada_real: null, salida_real: null, ...extra,
  });
  const viaje = (id, org, fecha, estado, paradas, extra = {}) => ({
    id_viaje: id, estado, fecha_programada: fecha, organizacion: org,
    creador: { nombre: 'Ana', apellido: 'Ferreyra' }, vehiculo: null, condiciones_requeridas: [],
    paradas, estimado: null, real: null, vencido: false, remito_url: null, historial_estados: [], ...extra,
  });

  const v2420Fecha = en(1, 8, 0);
  const viajes = [
    viaje(2420, DN, v2420Fecha, 'ASIGNADO', [
      parada(1, 1, 'Depósito Pilar, Ruta 8 km 52, Pilar', -34.4587, -58.9142, v2420Fecha, 15),
      parada(2, 2, 'Av. Mitre 1450, Vicente López', -34.5266, -58.4728, masMin(v2420Fecha, 45)),
      parada(3, 3, 'Av. Corrientes 3200, Almagro, CABA', -34.6037, -58.4110, masMin(v2420Fecha, 80)),
    ], { condiciones_requeridas: ['FRAGIL'], estimado: { manejo_horas: 1.08, peon_horas: 0.5, total_horas: 1.33, distancia_km: 48 } }),
    viaje(2421, FS, en(0, 14, 30), 'CONFIRMADO', [
      parada(4, 1, 'Mercado Central, Autopista Ricchieri, Tapiales', -34.6969, -58.5085, en(0, 14, 30)),
      parada(5, 2, 'Av. Rivadavia 6800, Flores, CABA', -34.6294, -58.4633, en(0, 15, 15)),
    ], { vehiculo: daily, condiciones_requeridas: ['REFRIGERADO'], estimado: { manejo_horas: 0.5, peon_horas: 0.25, total_horas: 0.75, distancia_km: 21 } }),
    viaje(2425, DN, en(2, 7, 0), 'CONFIRMADO', [
      parada(6, 1, 'Depósito Pilar, Ruta 8 km 52, Pilar', -34.4587, -58.9142, en(2, 7, 0)),
      parada(7, 2, 'Av. Maipú 2100, Olivos', -34.5100, -58.4890, en(2, 7, 50)),
      parada(8, 3, 'Panamericana km 26, Don Torcuato', -34.4920, -58.6280, en(2, 8, 30)),
      parada(9, 4, 'Av. Centenario 200, San Isidro', -34.4708, -58.5129, en(2, 9, 5)),
    ], { vehiculo: transit, estimado: { manejo_horas: 1.4, peon_horas: 0.67, total_horas: 2.08, distancia_km: 63 } }),
    viaje(2416, DN, en(-1, 9, 0), 'FINALIZADO', [
      parada(10, 1, 'Depósito Pilar, Ruta 8 km 52, Pilar', -34.4587, -58.9142, en(-1, 9, 0), 15, { estado: 'ENTREGADO' }),
      parada(11, 2, 'Av. Mitre 1450, Vicente López', -34.5266, -58.4728, en(-1, 9, 45), 20, { estado: 'ENTREGADO' }),
      parada(12, 3, 'Av. Corrientes 3200, Almagro, CABA', -34.6037, -58.4110, en(-1, 10, 20), 20, { estado: 'ENTREGADO' }),
    ], { vehiculo: transit, condiciones_requeridas: ['FRAGIL'], estimado: { manejo_horas: 1.08, peon_horas: 0.5, total_horas: 1.58, distancia_km: 48 }, real: { manejo_horas: 1.2, peon_horas: 0.63, total_horas: 1.83, distancia_km: 51 }, remito_url: 'https://example.com/remito-2416.pdf' }),
    viaje(2409, FS, en(-4, 6, 30), 'VENCIDO', [
      parada(13, 1, 'Mercado Central, Autopista Ricchieri, Tapiales', -34.6969, -58.5085, en(-4, 6, 30)),
      parada(14, 2, 'Av. Rivadavia 6800, Flores, CABA', -34.6294, -58.4633, en(-4, 7, 15)),
    ], { condiciones_requeridas: ['REFRIGERADO'], vencido: true, estimado: { manejo_horas: 0.5, peon_horas: 0.25, total_horas: 0.75, distancia_km: 21 } }),
  ];

  const GRUPOS = {
    asignados: ['ASIGNADO'], confirmados: ['CONFIRMADO'], en_curso: ['CARGANDO', 'EN_RUTA', 'DESCARGANDO'],
    historial: ['FINALIZADO', 'RECHAZADO', 'VENCIDO', 'CANCELADO'],
  };
  const copia = (x) => JSON.parse(JSON.stringify(x));
  const buscar = (id) => {
    const v = viajes.find((x) => x.id_viaje === Number(id));
    if (!v) throw Object.assign(new Error('Viaje no encontrado'), { response: { status: 404, data: { error: 'Viaje no encontrado' } } });
    return v;
  };
  const ahora = () => new Date().toISOString();

  return {
    vehiculos: [transit, daily],
    organizaciones: [{ ...DN, fecha_alta: en(-10, 10, 0) }, { ...FS, fecha_alta: en(-40, 10, 0) }],
    listar({ grupo, estado } = {}) {
      let r = viajes;
      if (grupo) r = r.filter((v) => GRUPOS[grupo].includes(v.estado));
      if (estado) r = r.filter((v) => v.estado === estado);
      return copia([...r].sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada)));
    },
    obtener: (id) => copia(buscar(id)),
    cambiar(id, estado, extra = {}) {
      const v = buscar(id);
      Object.assign(v, { estado, ...extra });
      if (estado === 'CONFIRMADO' && !v.vehiculo) v.vehiculo = transit;
      return copia(v);
    },
    iniciar(id) {
      const v = buscar(id);
      v.estado = 'CARGANDO'; v.fecha_inicio = ahora();
      Object.assign(v.paradas[0], { llegada_real: ahora() });
      return { estado: 'CARGANDO', id_parada: v.paradas[0].id_parada };
    },
    salir(id) {
      const v = buscar(id);
      const actual = v.paradas.find((p) => p.llegada_real && !p.salida_real);
      if (actual) Object.assign(actual, { salida_real: ahora(), estado: 'ENTREGADO' });
      const queda = v.paradas.some((p) => !p.llegada_real);
      if (!queda) {
        Object.assign(v, { estado: 'FINALIZADO', real: { manejo_horas: 1.2, peon_horas: 0.63, total_horas: 1.83, distancia_km: 51 }, remito_url: 'https://example.com/remito.pdf' });
        return { estado: 'FINALIZADO', viaje_finalizado: true, estimado: v.estimado, real: v.real, remito_url: v.remito_url };
      }
      v.estado = 'EN_RUTA';
      return { estado: 'EN_RUTA', viaje_finalizado: false };
    },
    llegar(id, idParada) {
      const v = buscar(id);
      Object.assign(v.paradas.find((p) => p.id_parada === idParada), { llegada_real: ahora() });
      v.estado = 'DESCARGANDO';
      return { estado: 'DESCARGANDO', id_parada: idParada };
    },
  };
})();
