// Permisos de la empresa (backend develop, «Dueño y permisos»). Un único dueño
// hace todo; el resto tiene una lista de permisos. GESTIONAR_VIAJES incluye ver.
//
// Compatibilidad: un backend sin este sistema (producción hasta que se pase)
// no manda `es_dueno` ni `mis_permisos`. Ahí manda el rol viejo: RESPONSABLE
// hace de dueño y todos los miembros pueden todo lo del día a día.
export const PERMISOS = [
  { id: 'VER_VIAJES',       titulo: 'Ver viajes',          descripcion: 'Los viajes, los viajes repetidos y los lugares guardados.', icono: 'eye-outline' },
  { id: 'GESTIONAR_VIAJES', titulo: 'Cargar y cambiar viajes', descripcion: 'Cargar, editar, reasignar y cancelar. Incluye verlos.', icono: 'pencil-outline' },
  { id: 'CHOFERES',         titulo: 'Conductores',         descripcion: 'Ver los conductores, invitarlos y desvincularlos.', icono: 'van-utility' },
  { id: 'ANALYTICS',        titulo: 'Estadísticas',        descripcion: 'Cuánto se gastó, puntualidad y cancelaciones (en la web).', icono: 'chart-line' },
];
export const TODOS_LOS_PERMISOS = PERMISOS.map((p) => p.id);
export const PERMISOS_POR_DEFECTO = ['VER_VIAJES', 'ANALYTICS'];

// Lo que suman los permisos guardados (GESTIONAR_VIAJES trae VER_VIAJES)
export function efectivos(lista) {
  const set = new Set(lista ?? []);
  if (set.has('GESTIONAR_VIAJES')) set.add('VER_VIAJES');
  return set;
}

// { sistemaNuevo, esDueno, puede(permiso) } a partir de la organización de /me
export function permisosDe(organizacion) {
  if (!organizacion) return { sistemaNuevo: false, esDueno: false, puede: () => false };
  const sistemaNuevo = 'es_dueno' in organizacion || 'mis_permisos' in organizacion;
  if (!sistemaNuevo) {
    const esDueno = organizacion.rol === 'RESPONSABLE' || organizacion.mi_rol === 'RESPONSABLE';
    return { sistemaNuevo, esDueno, puede: () => true };
  }
  const esDueno = !!organizacion.es_dueno;
  const set = efectivos(organizacion.mis_permisos);
  return { sistemaNuevo, esDueno, puede: (p) => esDueno || set.has(p) };
}

// «Ver viajes y conductores» / «Sin permisos»: resumen corto para las listas
export function textoPermisos(m) {
  if (m.es_dueno) return 'Dueño';
  const set = efectivos(m.permisos_efectivos ?? m.permisos);
  if (set.has('GESTIONAR_VIAJES')) set.delete('VER_VIAJES');
  const nombres = PERMISOS.filter((p) => set.has(p.id)).map((p) => p.titulo.toLowerCase());
  if (!nombres.length) return 'Sin permisos';
  const txt = nombres.length === 1 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
  return txt[0].toUpperCase() + txt.slice(1);
}
