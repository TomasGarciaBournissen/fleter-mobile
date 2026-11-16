import api from './api';
import { DEV_MODE } from '../config';
import { mock } from './mockEmpresa';
import { soloDigitos } from '../utils/formularios';

// La empresa del usuario CLIENTE: datos, equipo, invitaciones, conductores y
// lugares guardados. API.md de develop → «Identidad — PyMEs, miembros,
// invitaciones y choferes» y «Lugares guardados».
const org = (idOrg) => `/api/organizaciones/${idOrg}`;

export async function obtenerOrganizacion(idOrg) {
  if (DEV_MODE) return mock.organizacion();
  const { data } = await api.get(org(idOrg));
  return data;
}

// Solo un responsable. razon_social y direccion vacías se mandan como null (las borra).
export async function editarOrganizacion(idOrg, { nombre, cuit, razon_social, direccion }) {
  const body = {
    nombre: nombre.trim(),
    cuit: soloDigitos(cuit),
    razon_social: razon_social?.trim() || null,
    direccion: direccion?.trim() || null,
  };
  if (DEV_MODE) return mock.editarOrganizacion(body);
  const { data } = await api.put(org(idOrg), body);
  return data;
}

// ─── Equipo ────────────────────────────────────────────────────────────────
export async function listarMiembros(idOrg) {
  if (DEV_MODE) return mock.miembros();
  const { data } = await api.get(`${org(idOrg)}/miembros`);
  return data;
}

// Solo el dueño. permisos: VER_VIAJES | GESTIONAR_VIAJES | ANALYTICS | CHOFERES
export async function cambiarPermisos(idOrg, idUsuario, permisos) {
  if (DEV_MODE) return mock.cambiarPermisos(idUsuario, permisos);
  const { data } = await api.put(`${org(idOrg)}/miembros/${idUsuario}/permisos`, { permisos });
  return data;
}

// Solo el dueño: pasa la empresa a otro miembro (queda dueño con todo)
export async function transferirEmpresa(idOrg, idUsuario) {
  if (DEV_MODE) return mock.transferir(idUsuario);
  const { data } = await api.post(`${org(idOrg)}/transferir`, { id_usuario: idUsuario });
  return data;
}

// Backend sin el sistema de permisos (producción hasta que se pase): promover
// o degradar. En develop ya no existe (404).
export async function cambiarRol(idOrg, idUsuario, rol) {
  if (DEV_MODE) return mock.cambiarRol(idUsuario, rol);
  const { data } = await api.put(`${org(idOrg)}/miembros/${idUsuario}/rol`, { rol });
  return data;
}

export async function eliminarMiembro(idOrg, idUsuario) {
  if (DEV_MODE) return mock.eliminarMiembro(idUsuario);
  const { data } = await api.delete(`${org(idOrg)}/miembros/${idUsuario}`);
  return data;
}

// Irse de la empresa: la cuenta queda sin empresa (vuelve al onboarding)
export async function salirDeEmpresa(idOrg) {
  if (DEV_MODE) return { mensaje: 'Saliste de la PyME', id_organizacion: idOrg };
  const { data } = await api.post(`${org(idOrg)}/salir`);
  return data;
}

// ─── Invitaciones ──────────────────────────────────────────────────────────
// tipo: CHOFER (permiso CHOFERES) | MIEMBRO (solo el dueño, con `permisos`;
// sin ellos entra con VER_VIAJES y ANALYTICS). El `codigo` viene solo en esta
// respuesta: el backend guarda un hash.
export async function crearInvitacion(idOrg, tipo, permisos) {
  if (DEV_MODE) return mock.crearInvitacion(tipo, permisos);
  const body = tipo === 'MIEMBRO' && permisos ? { tipo, permisos } : { tipo };
  const { data } = await api.post(`${org(idOrg)}/invitaciones`, body);
  return data;
}

export async function listarInvitaciones(idOrg) {
  if (DEV_MODE) return mock.invitaciones();
  const { data } = await api.get(`${org(idOrg)}/invitaciones`);
  return data;
}

export async function revocarInvitacion(idOrg, idInv) {
  if (DEV_MODE) return mock.revocarInvitacion(idInv);
  const { data } = await api.delete(`${org(idOrg)}/invitaciones/${idInv}`);
  return data;
}

// ─── Conductores ───────────────────────────────────────────────────────────
// Cada uno con sus vehículos propios (`condiciones` como lista de strings)
export async function listarConductores(idOrg) {
  if (DEV_MODE) return mock.choferes();
  const { data } = await api.get(`${org(idOrg)}/choferes`);
  return data;
}

// Qué pasaría al desvincularlo: { viajes_a_cancelar: [ids], en_curso: id | null,
// series_a_borrar: [ids] }. null si el backend no tiene la vista previa.
export async function previaDesvinculacion(idOrg, idConductor) {
  if (DEV_MODE) return mock.desvinculacionChofer(idConductor);
  try {
    const { data } = await api.get(`${org(idOrg)}/choferes/${idConductor}/desvinculacion`);
    return data;
  } catch (e) {
    if (e?.response?.status === 404 && !/vinculo/i.test(e.response.data?.error ?? '')) return null;
    throw e;
  }
}

// Cancela sus viajes por hacer con la empresa y borra sus series activas.
// Con un viaje en curso responde 409 { error, en_curso }.
// Devuelve { viajes_cancelados, series_borradas }.
export async function desvincularConductor(idOrg, idConductor) {
  if (DEV_MODE) return mock.desvincularChofer(idConductor);
  const { data } = await api.delete(`${org(idOrg)}/choferes/${idConductor}`);
  return data;
}

// ─── Lugares guardados ─────────────────────────────────────────────────────
export async function listarLugares(idOrg) {
  if (DEV_MODE) return mock.lugares();
  const { data } = await api.get(`${org(idOrg)}/lugares`);
  return data;
}

// Crea (sin id) o edita un lugar: { nombre, direccion, lat, lng }
export async function guardarLugar(idOrg, idLugar, { nombre, direccion, lat, lng }) {
  const body = { nombre: nombre.trim(), direccion, lat, lng };
  if (DEV_MODE) return mock.guardarLugar(idLugar, body);
  const { data } = idLugar
    ? await api.put(`${org(idOrg)}/lugares/${idLugar}`, body)
    : await api.post(`${org(idOrg)}/lugares`, body);
  return data;
}

export async function borrarLugar(idOrg, idLugar) {
  if (DEV_MODE) return mock.borrarLugar(idLugar);
  const { data } = await api.delete(`${org(idOrg)}/lugares/${idLugar}`);
  return data;
}

// ─── Mis datos ─────────────────────────────────────────────────────────────
export async function editarPerfil({ nombre, apellido, telefono }) {
  const body = { nombre: nombre.trim(), apellido: apellido.trim() };
  if (telefono?.trim()) body.telefono = telefono.trim();
  if (DEV_MODE) return body;
  const { data } = await api.put('/api/auth/perfil', body);
  return data;
}
