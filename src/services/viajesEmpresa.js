import api from './api';
import { DEV_MODE } from '../config';
import { mock } from './mockEmpresa';

// Viajes de la empresa (API.md de develop → «Viaje interno», «Lugares guardados y
// series» y «Cierre sin Salir»). Todas las rutas cuelgan de la organización del
// usuario. El mobile no calcula nada: precio, tiempos, ruta y estados vienen del backend.
const base = (idOrg) => `/api/organizaciones/${idOrg}/viajes`;

// grupo: activos | en_curso | historial — o un `estado` puntual
export async function listarViajes(idOrg, params = {}) {
  if (DEV_MODE) return mock.listar(params);
  const { data } = await api.get(base(idOrg), { params });
  return data;
}

export async function obtenerViaje(idOrg, id) {
  if (DEV_MODE) return mock.obtener(id);
  const { data } = await api.get(`${base(idOrg)}/${id}`);
  return data;
}

// Precio y tiempos antes de crear. Acá las paradas van solo con coordenadas
// (un lugar guardado se manda con sus lat/lng; `id_lugar` no se acepta).
export async function estimarViaje({ paradas, fecha_programada }) {
  const body = { paradas: paradas.map(({ lat, lng, direccion }) => ({ lat, lng, direccion })), fecha_programada };
  if (DEV_MODE) return mock.estimar(body);
  const { data } = await api.post('/api/viajes/estimar-costo', body);
  return data;
}

// Parada para crear o editar: un lugar guardado va por su id (la empresa ve
// su nombre después); una dirección suelta, con coordenadas.
export const paradaParaApi = (p) => (p.id_lugar ? { id_lugar: p.id_lugar } : { lat: p.lat, lng: p.lng, direccion: p.direccion });

export async function crearViaje(idOrg, { id_conductor, fecha_programada, paradas, condiciones_requeridas, descripcion }) {
  const body = { id_conductor, fecha_programada, paradas: paradas.map(paradaParaApi), condiciones_requeridas };
  if (descripcion?.trim()) body.descripcion = descripcion.trim();
  if (DEV_MODE) return mock.crear(body);
  const { data } = await api.post(base(idOrg), body);
  return data;
}

// Un viaje RECHAZADO es final: `reasignar` no lo acepta. «Asignar a otro
// conductor» crea un viaje nuevo con el mismo recorrido, hora, condiciones y nota.
export function asignarRechazadoA(idOrg, viaje, idConductor) {
  return crearViaje(idOrg, {
    id_conductor: idConductor,
    fecha_programada: viaje.fecha_programada,
    paradas: (viaje.paradas ?? []).map((p) => (p.lugar?.activo ? { id_lugar: p.id_lugar } : { lat: Number(p.latitud), lng: Number(p.longitud), direccion: p.direccion })),
    condiciones_requeridas: viaje.condiciones_requeridas ?? [],
    descripcion: viaje.descripcion,
  });
}

// Solo en ASIGNADO o CONFIRMADO; un CONFIRMADO vuelve a ASIGNADO
export async function editarViaje(idOrg, id, cambios) {
  const body = { ...cambios };
  if (body.paradas) body.paradas = body.paradas.map(paradaParaApi);
  if (DEV_MODE) return mock.editar(id, body);
  const { data } = await api.put(`${base(idOrg)}/${id}`, body);
  return data;
}

export async function reasignarViaje(idOrg, id, idConductor) {
  if (DEV_MODE) return mock.reasignar(id, idConductor);
  const { data } = await api.post(`${base(idOrg)}/${id}/reasignar`, { id_conductor: idConductor });
  return data;
}

// En cualquier estado no final, también en curso. El motivo lo ve el conductor.
export async function cancelarViaje(idOrg, id, motivo) {
  if (DEV_MODE) return mock.cancelar(id, motivo);
  const { data } = await api.post(`${base(idOrg)}/${id}/cancelar`, motivo?.trim() ? { motivo: motivo.trim() } : {});
  return data;
}

// Cierre a mano cuando el conductor no tocó «Salir» en la última parada (Tarea 5)
export async function finalizarViaje(idOrg, id) {
  if (DEV_MODE) return mock.finalizar(id);
  const { data } = await api.post(`${base(idOrg)}/${id}/finalizar`);
  return data;
}

export async function obtenerRemito(idOrg, id) {
  if (DEV_MODE) return mock.remito(id);
  const { data } = await api.get(`${base(idOrg)}/${id}/remito`);
  return data;
}

// ─── Viajes repetidos (series) ─────────────────────────────────────────────
const series = (idOrg) => `/api/organizaciones/${idOrg}/series`;

export async function crearSerie(idOrg, { paradas, descripcion, ...resto }) {
  const body = { ...resto, paradas: paradas.map(paradaParaApi) };
  if (descripcion?.trim()) body.descripcion = descripcion.trim();
  if (DEV_MODE) return mock.crearSerie(body);
  const { data } = await api.post(series(idOrg), body);
  return data;
}

export async function listarSeries(idOrg, params = {}) {
  if (DEV_MODE) return mock.series(params);
  const { data } = await api.get(series(idOrg), { params });
  return data;
}

export async function obtenerSerie(idOrg, id) {
  if (DEV_MODE) return mock.serie(id);
  const { data } = await api.get(`${series(idOrg)}/${id}`);
  return data;
}

// La serie pasa a CANCELADA; sus viajes ya creados no se tocan
export async function cancelarSerie(idOrg, id) {
  if (DEV_MODE) return mock.cancelarSerie(id);
  const { data } = await api.post(`${series(idOrg)}/${id}/cancelar`);
  return data;
}

// En DEV no hay socket: posición y llegada de ejemplo para el seguimiento.
// Con backend, las dos llegan solo por `mapa:actualizar` y `eta:actualizar`.
export const vivoDeEjemplo = (viaje) => (DEV_MODE ? viaje?._dev_vivo ?? null : null);
