import api from './api';
import { DEV_MODE } from '../config';
import { limpiarCodigo, soloDigitos } from '../utils/formularios';

// Empresa (PyME) del usuario: crear y sumarse con código.
// Contrato: API.md de develop → «Identidad — PyMEs, miembros, invitaciones y choferes».

export async function crearOrganizacion({ nombre, cuit, razon_social, direccion }) {
  if (DEV_MODE) {
    return { id_organizacion: 1, nombre, cuit: soloDigitos(cuit), estado: 'TRIAL', mi_rol: 'RESPONSABLE' };
  }
  const body = { nombre: nombre.trim(), cuit: soloDigitos(cuit) };
  if (razon_social?.trim()) body.razon_social = razon_social.trim();
  if (direccion?.trim()) body.direccion = direccion.trim();
  const { data } = await api.post('/api/organizaciones', body);
  return data;
}

// Endpoint único de canje: un CLIENTE queda MIEMBRO de la empresa y un
// CONDUCTOR queda vinculado. Devuelve { tipo, organizacion }.
export async function canjearCodigo(codigo) {
  if (DEV_MODE) {
    return { tipo: 'CHOFER', organizacion: { id_organizacion: 1, nombre: 'Distribuidora Norte' } };
  }
  const { data } = await api.post('/api/invitaciones/canjear', { codigo: limpiarCodigo(codigo) });
  return data;
}
