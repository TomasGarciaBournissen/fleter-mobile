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

// Parada para crear, editar o estimar: un lugar guardado va por su id (la empresa
// ve su nombre después y el backend copia su acceso y pisos); una dirección
// suelta, con coordenadas.
export const paradaParaApi = (p) => (p.id_lugar ? { id_lugar: p.id_lugar } : { lat: p.lat, lng: p.lng, direccion: p.direccion });

// Precio y tiempos antes de crear, con la fórmula del precio v2 (la misma con la
// que el backend crea el viaje): `total` y el rango `bajo` / `alto` (−20 % / +30 %),
// más `estimado` y `tramos`. No crea nada. El `/api/viajes/estimar-costo` viejo es
// del marketplace y da otro número: no se usa para viajes de empresa.
export async function estimarViaje(idOrg, { paradas, fecha_programada }) {
  const body = { paradas: paradas.map(paradaParaApi), fecha_programada };
  if (DEV_MODE) return mock.estimar(body);
  const { data } = await api.post(`${base(idOrg)}/estimar-precio`, body);
  return data;
}

// `motivo` (para qué es, 1 a 120) y `descripcion` (indicaciones, 1 a 500) son
// obligatorios desde el pedido del 20-10-2026. Los viajes de PyME ya no tienen
// condiciones especiales: el conductor confirma con cualquier vehículo propio.
export async function crearViaje(idOrg, { id_conductor, fecha_programada, paradas, motivo, descripcion }) {
  const body = { id_conductor, fecha_programada, paradas: paradas.map(paradaParaApi), motivo: motivo?.trim(), descripcion: descripcion?.trim() };
  if (DEV_MODE) return mock.crear(body);
  const { data } = await api.post(base(idOrg), body);
  return data;
}

// Un viaje RECHAZADO es final: `reasignar` no lo acepta. «Asignar a otro
// conductor» crea un viaje nuevo con el mismo recorrido, hora, motivo e
// indicaciones. Un viaje anterior al 20-10-2026 puede no tener motivo ni
// indicaciones: se completan con un texto mínimo para que el backend lo acepte.
export function asignarRechazadoA(idOrg, viaje, idConductor) {
  return crearViaje(idOrg, {
    id_conductor: idConductor,
    fecha_programada: viaje.fecha_programada,
    paradas: (viaje.paradas ?? []).map((p) => (p.lugar?.activo ? { id_lugar: p.id_lugar } : { lat: Number(p.latitud), lng: Number(p.longitud), direccion: p.direccion })),
    motivo: viaje.motivo?.trim() || `Reemplazo de VJ-${viaje.id_viaje}`,
    descripcion: viaje.descripcion?.trim() || 'Sin indicaciones.',
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

// Mismas reglas que un viaje: `motivo` y `descripcion` obligatorios, se copian a cada viaje
export async function crearSerie(idOrg, { paradas, motivo, descripcion, ...resto }) {
  const body = { ...resto, paradas: paradas.map(paradaParaApi), motivo: motivo?.trim(), descripcion: descripcion?.trim() };
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
