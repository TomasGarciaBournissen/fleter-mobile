// Fechas y horas en formato es-AR (UXUI.md): 14:30 · mié 22 oct · semana desde el lunes.
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const aFecha = (v) => (v instanceof Date ? v : new Date(v));
const inicioDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const diasEntre = (a, b) => Math.round((inicioDia(b) - inicioDia(a)) / 86400000);

export function hora(v) {
  if (!v) return 'A confirmar';
  const d = aFecha(v);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// mié 22 oct
export function diaCorto(v) {
  const d = aFecha(v);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

// «Hoy, 14:30» · «Mañana, 08:00» · «Jue 23 oct, 07:00»
export function cuando(v, ahora = new Date()) {
  if (!v) return 'A confirmar';
  const d = aFecha(v);
  const n = diasEntre(ahora, d);
  if (n === 0) return `Hoy, ${hora(d)}`;
  if (n === 1) return `Mañana, ${hora(d)}`;
  if (n === -1) return `Ayer, ${hora(d)}`;
  const dia = diaCorto(d);
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${hora(d)}`;
}

// «Mañana, mié 22 oct, 08:00» para el título del detalle
export function cuandoLargo(v, ahora = new Date()) {
  if (!v) return 'A confirmar';
  const d = aFecha(v);
  const n = diasEntre(ahora, d);
  if (n === 0) return `Hoy, ${diaCorto(d)}, ${hora(d)}`;
  if (n === 1) return `Mañana, ${diaCorto(d)}, ${hora(d)}`;
  return cuando(d, ahora);
}

// «Octubre 2026» para agrupar el historial
export function mesAnio(v) {
  const d = aFecha(v);
  const m = MESES_LARGOS[d.getMonth()];
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${d.getFullYear()}`;
}

export function mesAlta(v) {
  const d = aFecha(v);
  return `${MESES_LARGOS[d.getMonth()]} ${d.getFullYear()}`;
}

// Minutos → «1 h 20 min» · «45 min»
export function duracionMin(min) {
  if (min == null || Number.isNaN(Number(min))) return 'A confirmar';
  const t = Math.round(Number(min));
  const h = Math.floor(t / 60);
  const m = t % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export const duracionHoras = (h) => (h == null ? 'A confirmar' : duracionMin(Number(h) * 60));

// Cronómetro mm:ss (o h:mm:ss) desde una fecha
export function transcurrido(desde, ahora = new Date()) {
  if (!desde) return '00:00';
  const s = Math.max(0, Math.floor((ahora - aFecha(desde)) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const mmss = `${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  return h ? `${h}:${mmss}` : mmss;
}

export function km(v) {
  if (v == null) return 'A confirmar';
  const n = Math.round(Number(v) * 10) / 10;
  return `${n.toLocaleString('es-AR')} km`;
}
